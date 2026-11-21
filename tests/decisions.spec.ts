import { test, expect } from 'deepspace/testing'
import { action, createRelease } from './helpers/actions'

test('server refuses invalid decisions and protects final snapshot under races', async ({ users }) => {
  test.setTimeout(90_000)
  const [alice, bob] = await users(2)
  await bob.page.goto('/home')
  await expect(bob.page.getByTestId('my-user-id')).toHaveText(/\S/)
  const bobId = await bob.page.getByTestId('my-user-id').innerText()
  const id = await createRelease(alice.page)
  await expect(alice.page.getByTestId('gate-card')).toHaveCount(5)
  const gateIds = await alice.page.getByTestId('gate-card').evaluateAll(cards => cards.map(c => c.getAttribute('data-gate-id')!))
  expect((await action(alice.page, 'decideRelease', { releaseId: id, decision: 'approved' })).success).toBe(false)
  expect((await action(alice.page, 'addReviewer', { releaseId: id, targetUserId: bobId })).success).toBe(true)
  await bob.page.goto(`/releases/${id}`)
  expect((await action(bob.page, 'decideRelease', { releaseId: id, decision: 'approved' })).success).toBe(false)
  const otherId = await createRelease(bob.page)
  expect((await action(bob.page, 'verifyGate', { releaseId: otherId, gateId: gateIds[0], status: 'verified', evidenceNote: 'Cross-release forged evidence' })).success).toBe(false)
  for (const gateId of gateIds) {
    expect((await action(alice.page, 'verifyGate', { releaseId: id, gateId, status: 'verified', evidenceNote: 'Fictional QA checks completed.', evidenceUrl: 'https://example.com/qa' })).success).toBe(true)
  }
  const selfApproval = await action(alice.page, 'decideRelease', { releaseId: id, decision: 'approved' })
  expect(selfApproval.success).toBe(false)
  expect(selfApproval.error).toContain('independent reviewer')
  expect((await action(bob.page, 'verifyGate', { releaseId: id, gateId: gateIds[1], status: 'verified', evidenceNote: 'Independent reviewer checked authentication.' })).success).toBe(true)
  const results = await Promise.all([
    action(alice.page, 'decideRelease', { releaseId: id, decision: 'approved' }),
    action(bob.page, 'verifyGate', { releaseId: id, gateId: gateIds[0], status: 'failed', evidenceNote: 'Concurrent regression discovered.' }),
  ])
  // Either evidence wins and approval is denied, or approval wins and edits
  // are denied. Both succeeding would prove a broken serialization boundary.
  expect(results.filter(r => r.success)).toHaveLength(1)
  if (!results[0].success) {
    expect((await action(alice.page, 'verifyGate', { releaseId: id, gateId: gateIds[0], status: 'verified', evidenceNote: 'Regression reviewed and resolved.' })).success).toBe(true)
    const decisions = await Promise.all([1, 2, 3].map(() => action(alice.page, 'decideRelease', { releaseId: id, decision: 'approved' })))
    expect(decisions.filter(r => r.success), JSON.stringify(decisions)).toHaveLength(1)
  }
  expect((await action(alice.page, 'decideRelease', { releaseId: id, decision: 'approved' })).success).toBe(false)
  expect((await action(alice.page, 'verifyGate', { releaseId: id, gateId: gateIds[0], status: 'failed', evidenceNote: 'Attempted edit after approval.' })).success).toBe(false)
  await alice.page.goto(`/releases/${id}/report`)
  await expect(alice.page.getByTestId('snapshot-gate')).toHaveCount(5)
  await expect(alice.page.getByTestId('snapshot-gate').getByText('verified', { exact: true })).toHaveCount(5)
  await alice.page.reload()
  await expect(alice.page.getByTestId('snapshot-gate')).toHaveCount(5)
  await bob.page.goto(`/releases/${id}`)
  await expect(bob.page.getByRole('link', { name: 'View decision report' })).toBeVisible()
  await expect(bob.page.getByRole('button', { name: 'Record evidence' })).toHaveCount(0)
  await expect(bob.page.getByText('Release approved; evidence snapshot saved.', { exact: true })).toHaveCount(1)
})

test('three simultaneous approvals produce one decision', async ({ users }) => {
  const [lead, reviewer] = await users(2)
  await reviewer.page.goto('/home')
  await expect(reviewer.page.getByTestId('my-user-id')).toHaveText(/\S/)
  const reviewerId = await reviewer.page.getByTestId('my-user-id').innerText()
  const id = await createRelease(lead.page)
  await expect(lead.page.getByTestId('gate-card')).toHaveCount(5)
  const ids = await lead.page.getByTestId('gate-card').evaluateAll(cards => cards.map(c => c.getAttribute('data-gate-id')!))
  for (const gateId of ids) expect((await action(lead.page, 'verifyGate', { releaseId: id, gateId, status: 'verified', evidenceNote: 'Fictional test evidence reviewed.' })).success).toBe(true)
  expect((await action(lead.page, 'addReviewer', { releaseId: id, targetUserId: reviewerId })).success).toBe(true)
  expect((await action(reviewer.page, 'verifyGate', { releaseId: id, gateId: ids[0], status: 'verified', evidenceNote: 'Independent fictional test evidence reviewed.' })).success).toBe(true)
  const results = await Promise.all([1, 2, 3].map(() => action(lead.page, 'decideRelease', { releaseId: id, decision: 'approved' })))
  expect(results.filter(r => r.success), JSON.stringify(results)).toHaveLength(1)
  await lead.page.reload()
  await expect(lead.page.getByText('Release approved; evidence snapshot saved.', { exact: true })).toHaveCount(1)
})

test('lead may reject an incomplete release with an explanation', async ({ users }) => {
  const [lead] = await users(1)
  const id = await createRelease(lead.page)
  expect((await action(lead.page, 'decideRelease', { releaseId: id, decision: 'rejected', reason: 'short' })).success).toBe(false)
  await lead.page.getByLabel('Decision reason').fill('The release requires additional regression work.')
  await lead.page.getByRole('button', { name: 'Reject release' }).click()
  await lead.page.getByRole('link', { name: 'View decision report' }).click()
  await expect(lead.page.getByText('rejected', { exact: true })).toBeVisible()
  await expect(lead.page.getByTestId('snapshot-gate')).toHaveCount(5)
})
