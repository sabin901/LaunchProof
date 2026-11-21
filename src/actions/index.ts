import type { ActionHandler, ActionResult } from 'deepspace/worker'
import type { Env } from '../../worker'
import { REQUIRED_GATES, validateReleaseInput } from '../lib/release-rules'

function confirmed<T>(result: ActionResult<T>): T {
  if (!result.success) throw new Error('The record operation could not be confirmed. Please retry.')
  return result.data
}

export const actions: Record<string, ActionHandler<Env>> = {
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
      const event = await tools.create('events', { releaseId, actorUserId: userId, kind: 'release_created', summary: 'Release created with five required gates.', occurredAt: Date.now(), details: {} })
      return { success: true, data: { releaseId, warning: event.success ? undefined : 'Release saved; activity history could not be saved.' } }
    } catch (error) {
      if (releaseId) await tools.update('releases', releaseId, { status: 'init_failed' })
      return { success: false, error: error instanceof Error ? error.message : 'Release creation failed.' }
    }
  },
}
