import { test, expect } from 'deepspace/testing'

test('a real release has five pending gates and survives refresh', async ({ users }) => {
  const [alice] = await users(1)
  await alice.page.goto('/home')
  await alice.page.getByRole('button', { name: '+ New release', exact: true }).click()
  const name = `__test-${Date.now()}__ Atlas`
  await alice.page.getByLabel('Product name').fill(name)
  await alice.page.getByLabel('Version', { exact: true }).fill('v1.0')
  await alice.page.getByRole('button', { name: 'Create release', exact: true }).click()
  await expect(alice.page.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(alice.page.getByTestId('gate-card')).toHaveCount(5)
  await expect(alice.page.getByText('pending', { exact: true })).toHaveCount(5)
  await alice.page.reload()
  await expect(alice.page.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(alice.page.getByTestId('gate-card')).toHaveCount(5)
})
