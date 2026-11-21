import { test, expect } from 'deepspace/testing'
import { action, createRelease, recordTool } from './helpers/actions'

test('unauthenticated actions and forged internal routes are refused', async ({ request }) => {
  for (const name of ['createRelease', 'addReviewer', 'verifyGate', 'decideRelease']) {
    const result = await request.post(`/api/actions/${name}`, { data: {} })
    expect(result.status()).toBe(401)
  }
  const forged = await request.post('/internal/launchproof-action', { headers: { 'X-App-Action': 'true', 'X-User-Id': 'forged' }, data: { name: 'createRelease', params: { name: 'Forged', version: '1' } } })
  expect(forged.status()).not.toBe(200)
})

test('record RBAC isolates all four collections and denies direct writes', async ({ users }) => {
  const [lead, outsider] = await users(2)
  const id = await createRelease(lead.page)
  await expect(lead.page.getByTestId('gate-card')).toHaveCount(5)
  const gateId = await lead.page.getByTestId('gate-card').first().getAttribute('data-gate-id')
  await outsider.page.goto('/home')
  await expect(outsider.page.getByTestId('my-user-id')).toHaveText(/\S/)
  for (const collection of ['releases', 'gates', 'events', 'team_members']) {
    const field = collection === 'releases' ? 'recordId' : collection === 'team_members' ? 'teamId' : 'releaseId'
    const read = await recordTool(outsider.page, 'records_query', { collection, where: { [field]: id } })
    expect(read.success, JSON.stringify(read)).toBe(true)
    expect(read.data.records).toEqual([])
    const write = await recordTool(lead.page, 'records_create', { collection, data: {} })
    expect(write, JSON.stringify(write)).toMatchObject({ ok: false, code: 'tool_failed' })
    expect(write.error).toContain('CREATE DENIED')
  }
  const write = await recordTool(lead.page, 'records_update', { collection: 'gates', recordId: gateId, data: { status: 'verified' } })
  expect(write).toMatchObject({ ok: false, code: 'tool_failed' })
  expect(write.error).toContain('DENIED')
  expect((await action(lead.page, 'verifyGate', { releaseId: id, gateId, status: 'verified', evidenceNote: 'An unsafe URL must fail.', evidenceUrl: 'javascript:alert(1)' })).success).toBe(false)
  expect((await action(lead.page, 'addReviewer', { releaseId: id, targetUserId: 'nonexistent-user' })).success).toBe(false)
})
