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
  const directGet = await recordTool(outsider.page, 'records_get', { collection: 'releases', recordId: id })
  expect(directGet).toMatchObject({ ok: false, code: 'tool_failed' })
  const directDelete = await recordTool(lead.page, 'records_delete', { collection: 'releases', recordId: id })
  expect(directDelete).toMatchObject({ ok: false, code: 'tool_failed' })
  expect(directDelete.error).toContain('DENIED')
  expect((await action(lead.page, 'verifyGate', { releaseId: id, gateId, status: 'verified', evidenceNote: 'An unsafe URL must fail.', evidenceUrl: 'javascript:alert(1)' })).success).toBe(false)
  expect((await action(lead.page, 'addReviewer', { releaseId: id, targetUserId: 'nonexistent-user' })).success).toBe(false)
})

test('disabled integrations and malformed or inherited actions fail closed', async ({ users }) => {
  const [user] = await users(1)
  await user.page.goto('/home')
  const results = await user.page.evaluate(async () => {
    const { token } = await (await fetch('/api/auth/token', { method: 'POST' })).json()
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    const cases = [
      ['/api/integrations/openai/chat-completion', '{}'],
      ['/api/integrations/composio/execute', '{}'],
      ['/api/actions/constructor', '{}'],
      ['/api/actions/__proto__', '{}'],
      ['/api/actions/createRelease', 'null'],
      ['/api/actions/createRelease', '[]'],
      ['/api/actions/createRelease', '{'],
      ['/api/actions/createRelease', JSON.stringify({ name: 'x'.repeat(12001) })],
    ]
    return Promise.all(cases.map(async ([url, body]) => {
      const response = await fetch(url, { method: 'POST', headers, body })
      return { status: response.status, body: await response.json() }
    }))
  })
  expect(results.map((r) => r.status)).toEqual([404, 404, 404, 404, 400, 400, 400, 413])
  for (const result of results.slice(0, 2)) expect(result.body.error).toBe('Integration not enabled for this app')
})
