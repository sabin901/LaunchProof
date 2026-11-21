import type { ActionHandler, ActionResult, ActionContext, ActionTools } from 'deepspace/worker'
import type { Env } from '../../worker'
import { REQUIRED_GATES, validateReleaseInput, validateEvidence, boundedText, type Release, type Membership, type Gate } from '../lib/release-rules'

function confirmed<T>(result: ActionResult<T>): T {
  if (!result.success) throw new Error('The record operation could not be confirmed. Please retry.')
  return result.data
}

async function authorize(ctx: ActionContext<Env>, leadOnly = false) {
  const releaseId = boundedText(ctx.params.releaseId, 'Release ID', 1, 150)
  const result = await ctx.tools.get<Release>('releases', releaseId)
  const members = await ctx.tools.query<Membership>('team_members', { where: { teamId: releaseId, userId: ctx.userId, status: 'active' }, limit: 2 })
  if (!result.success || !members.success || members.data.records.length !== 1) throw new Error('Release unavailable or access denied.')
  const role = members.data.records[0].data.roleInRelease
  if (!['lead', 'reviewer'].includes(role) || (leadOnly && (role !== 'lead' || result.data.record.data.leadUserId !== ctx.userId))) throw new Error('Only the release lead may perform this action.')
  if (result.data.record.data.status !== 'draft') throw new Error('This release is read-only. Only draft releases can change.')
  return { releaseId, release: result.data.record.data }
}

async function activity(tools: ActionTools, releaseId: string, actorUserId: string, kind: string, summary: string) {
  try {
    const result = await tools.create('events', { releaseId, actorUserId, kind, summary, occurredAt: Date.now(), details: {} })
    return result.success ? undefined : 'Changes saved; activity history could not be saved.'
  } catch { return 'Changes saved; activity history could not be saved.' }
}
const guarded = (handler: ActionHandler<Env>): ActionHandler<Env> => async ctx => {
  try { return await handler(ctx) } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'The operation could not be completed.' }
  }
}

export const actions: Record<string, ActionHandler<Env>> = {
  addReviewer: guarded(async ctx => {
    const { releaseId } = await authorize(ctx, true)
    const targetUserId = boundedText(ctx.params.targetUserId, 'Reviewer ID', 1, 150)
    if (targetUserId === ctx.userId) throw new Error('You are already the release lead.')
    const target = await ctx.tools.get('users', targetUserId)
    if (!target.success) throw new Error('Reviewer unavailable. They must sign in to this app first.')
    const existing = confirmed(await ctx.tools.query('team_members', { where: { teamId: releaseId, userId: targetUserId }, limit: 1 }))
    if (existing.records.length) throw new Error('This reviewer is already a member.')
    confirmed(await ctx.tools.create('team_members', { teamId: releaseId, userId: targetUserId, status: 'active', roleInRelease: 'reviewer', addedAt: Date.now() }))
    return { success: true, data: { warning: await activity(ctx.tools, releaseId, ctx.userId, 'reviewer_added', 'A reviewer joined the release.') } }
  }),
  verifyGate: guarded(async ctx => {
    const { releaseId } = await authorize(ctx)
    const gateId = boundedText(ctx.params.gateId, 'Gate ID', 1, 150)
    const gate = await ctx.tools.get<Gate>('gates', gateId)
    if (!gate.success || gate.data.record.data.releaseId !== releaseId) throw new Error('Gate unavailable or access denied.')
    const evidence = validateEvidence(ctx.params.status, ctx.params.evidenceNote, ctx.params.evidenceUrl ?? '')
    confirmed(await ctx.tools.update('gates', gateId, { ...evidence, verifiedBy: ctx.userId, verifiedAt: Date.now() }))
    return { success: true, data: { warning: await activity(ctx.tools, releaseId, ctx.userId, 'gate_updated', `${gate.data.record.data.title}: ${evidence.status}.`) } }
  }),
  createRelease: async ({ userId, params, tools }) => {
    let releaseId: string | undefined
    try {
      const input = validateReleaseInput(params.name, params.version)
      releaseId = confirmed(await tools.create('releases', { ...input, status: 'initializing', leadUserId: userId, policyVersion: 'v1' })).recordId
      confirmed(await tools.create('team_members', { teamId: releaseId, userId, status: 'active', roleInRelease: 'lead', addedAt: Date.now() }))
      for (const gate of REQUIRED_GATES) {
        confirmed(await tools.create('gates', { ...gate, releaseId, required: true, status: 'pending', evidenceNote: '', evidenceUrl: '', verifiedBy: '', verifiedAt: 0 }))
      }
      confirmed(await tools.update('releases', releaseId, { status: 'draft' }))
      const warning = await activity(tools, releaseId, userId, 'release_created', 'Release created with five required gates.')
      return { success: true, data: { releaseId, warning } }
    } catch (error) {
      if (releaseId) await tools.update('releases', releaseId, { status: 'init_failed' })
      return { success: false, error: error instanceof Error ? error.message : 'Release creation failed.' }
    }
  },
}
