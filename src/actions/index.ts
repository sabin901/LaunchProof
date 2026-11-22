import type { ActionHandler, ActionResult, ActionContext, ActionTools } from 'deepspace/worker'
import type { Env } from '../../worker'
import {
  REQUIRED_GATES,
  validateReleaseInput,
  validateEvidence,
  boundedText,
  getApprovalEligibility,
  makeDecisionSnapshot,
  type Release,
  type Membership,
  type Gate,
} from '../lib/release-rules'

function confirmed<T>(result: ActionResult<T>): T {
  if (!result.success) throw new Error('The record operation could not be confirmed. Please retry.')
  return result.data
}

// Action tools bypass collection permissions. Every edit must check membership
// here before loading or changing release evidence. App-admin is not release-lead.
async function requireDraftMember(ctx: ActionContext<Env>, requiredRole?: 'lead') {
  const releaseId = boundedText(ctx.params.releaseId, 'Release ID', 1, 150)
  const result = await ctx.tools.get<Release>('releases', releaseId)
  const members = await ctx.tools.query<Membership>('team_members', {
    where: { teamId: releaseId, userId: ctx.userId, status: 'active' },
    limit: 2,
  })
  if (!result.success || !members.success || members.data.records.length !== 1)
    throw new Error('Release unavailable or access denied.')
  const release = result.data.record.data
  const role = members.data.records[0].data.roleInRelease
  if (
    !['lead', 'reviewer'].includes(role) ||
    (requiredRole === 'lead' && (role !== 'lead' || release.leadUserId !== ctx.userId))
  )
    throw new Error('Only the release lead may perform this action.')
  if (release.status !== 'draft')
    throw new Error('This release is read-only. Only draft releases can change.')
  return { releaseId, release }
}

// The main write has already succeeded. A missing activity entry must not tell
// the user the whole operation failed and encourage an unsafe retry.
async function recordActivity(
  tools: ActionTools,
  releaseId: string,
  actorUserId: string,
  kind: string,
  summary: string,
) {
  try {
    const result = await tools.create('events', {
      releaseId,
      actorUserId,
      kind,
      summary,
      occurredAt: Date.now(),
      details: {},
    })
    return result.success ? undefined : 'Changes saved; activity history could not be saved.'
  } catch {
    return 'Changes saved; activity history could not be saved.'
  }
}
// Expected validation failures become action responses, not unhandled HTTP errors.
function guarded(handler: ActionHandler<Env>): ActionHandler<Env> {
  return async (ctx) => {
    try {
      return await handler(ctx)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'The operation could not be completed.',
      }
    }
  }
}

async function createRelease({
  userId,
  params,
  tools,
}: ActionContext<Env>): Promise<ActionResult<unknown>> {
  let releaseId: string | undefined
  try {
    const input = validateReleaseInput(params.name, params.version)
    // Only expose a mutable draft after membership and every gate exist.
    releaseId = confirmed(
      await tools.create('releases', {
        ...input,
        status: 'initializing',
        leadUserId: userId,
        policyVersion: 'v1',
      }),
    ).recordId
    confirmed(
      await tools.create('team_members', {
        teamId: releaseId,
        userId,
        status: 'active',
        roleInRelease: 'lead',
        addedAt: Date.now(),
      }),
    )
    for (const gate of REQUIRED_GATES) {
      confirmed(
        await tools.create('gates', {
          ...gate,
          releaseId,
          required: true,
          status: 'pending',
          evidenceNote: '',
          evidenceUrl: '',
          verifiedBy: '',
          verifiedAt: 0,
        }),
      )
    }
    confirmed(await tools.update('releases', releaseId, { status: 'draft' }))
    const warning = await recordActivity(
      tools,
      releaseId,
      userId,
      'release_created',
      'Release created with five required gates.',
    )
    return { success: true, data: { releaseId, warning } }
  } catch (error) {
    // This is not rollback. If marking failure also fails, 'initializing'
    // still prevents all edits and decisions. Preserve the original error.
    if (releaseId) {
      try {
        await tools.update('releases', releaseId, { status: 'init_failed' })
      } catch {
        console.error('[createRelease] Could not mark incomplete setup as failed.')
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Release creation failed.',
    }
  }
}

async function addReviewer(ctx: ActionContext<Env>): Promise<ActionResult<unknown>> {
  const { releaseId } = await requireDraftMember(ctx, 'lead')
  const targetUserId = boundedText(ctx.params.targetUserId, 'Reviewer ID', 1, 150)
  if (targetUserId === ctx.userId) throw new Error('You are already the release lead.')
  const target = await ctx.tools.get('users', targetUserId)
  if (!target.success) throw new Error('Reviewer unavailable. They must sign in to this app first.')
  const existing = confirmed(
    await ctx.tools.query('team_members', {
      where: { teamId: releaseId, userId: targetUserId },
      limit: 1,
    }),
  )
  if (existing.records.length) throw new Error('This reviewer is already a member.')
  confirmed(
    await ctx.tools.create('team_members', {
      teamId: releaseId,
      userId: targetUserId,
      status: 'active',
      roleInRelease: 'reviewer',
      addedAt: Date.now(),
    }),
  )
  const warning = await recordActivity(
    ctx.tools,
    releaseId,
    ctx.userId,
    'reviewer_added',
    'A reviewer joined the release.',
  )
  return { success: true, data: { warning } }
}

async function verifyGate(ctx: ActionContext<Env>): Promise<ActionResult<unknown>> {
  const { releaseId } = await requireDraftMember(ctx)
  const gateId = boundedText(ctx.params.gateId, 'Gate ID', 1, 150)
  const gate = await ctx.tools.get<Gate>('gates', gateId)
  // Membership in one release must not authorize writes to another release's gate.
  if (!gate.success || gate.data.record.data.releaseId !== releaseId)
    throw new Error('Gate unavailable or access denied.')
  const evidence = validateEvidence(
    ctx.params.status,
    ctx.params.evidenceNote,
    ctx.params.evidenceUrl ?? '',
  )
  confirmed(
    await ctx.tools.update('gates', gateId, {
      ...evidence,
      // Identity and time come from the server, never from form input.
      verifiedBy: ctx.userId,
      verifiedAt: Date.now(),
    }),
  )
  const warning = await recordActivity(
    ctx.tools,
    releaseId,
    ctx.userId,
    'gate_updated',
    `${gate.data.record.data.title}: ${evidence.status}.`,
  )
  return { success: true, data: { warning } }
}

async function decideRelease(ctx: ActionContext<Env>): Promise<ActionResult<unknown>> {
  const { releaseId, release } = await requireDraftMember(ctx, 'lead')
  const decision = ctx.params.decision
  if (decision !== 'approved' && decision !== 'rejected')
    throw new Error('Choose approve or reject.')
  const reason = boundedText(
    ctx.params.reason ?? '',
    'Decision reason',
    decision === 'rejected' ? 10 : 0,
    1000,
  )
  // Fetch one more than the policy size so an unexpected extra gate is rejected.
  const gates = confirmed(
    await ctx.tools.query<Gate>('gates', {
      where: { releaseId },
      limit: REQUIRED_GATES.length + 1,
    }),
  ).records.map((r) => r.data)
  const members = confirmed(
    await ctx.tools.query<Membership>('team_members', {
      where: { teamId: releaseId, status: 'active' },
    }),
  ).records.map((r) => r.data)
  const readiness = getApprovalEligibility(release, gates, members, releaseId)
  if (release.policyVersion !== 'v1' || !readiness.completeSet)
    throw new Error('The release does not have the complete five-gate policy.')
  if (decision === 'approved' && readiness.missing.length)
    throw new Error('All five gates need verified, attributed evidence before approval.')
  if (decision === 'approved' && !readiness.independentReview)
    throw new Error('An independent reviewer must verify at least one gate before approval.')
  // The RecordRoom serializes this entire action with evidence edits. Read,
  // validate, and save the decision together; never move this check to the UI.
  const decisionAt = Date.now()
  const snapshot = makeDecisionSnapshot(
    release,
    gates,
    ctx.userId,
    decision,
    reason,
    decisionAt,
    readiness.independentReviewerIds,
  )
  // Status and its historical evidence are written to the same release record.
  confirmed(
    await ctx.tools.update('releases', releaseId, {
      status: decision,
      decisionSnapshot: snapshot,
      decisionAt,
      decisionBy: ctx.userId,
      decisionReason: reason,
    }),
  )
  const warning = await recordActivity(
    ctx.tools,
    releaseId,
    ctx.userId,
    `release_${decision}`,
    `Release ${decision}; evidence snapshot saved.`,
  )
  return { success: true, data: { snapshot, warning } }
}

// The only public write operations, in the order a release moves through them.
export const actions: Record<string, ActionHandler<Env>> = {
  createRelease: guarded(createRelease),
  addReviewer: guarded(addReviewer),
  verifyGate: guarded(verifyGate),
  decideRelease: guarded(decideRelease),
}
