import { test, expect } from 'deepspace/testing'
import { action } from './helpers/actions'

test('dashboard searches and filters real releases and copies reviewer ID', async ({ users }) => {
  const [lead] = await users(1)
  await lead.page.goto('/home')
  const name = `__test-${Date.now()}__ Searchable`
  const created = await action(lead.page, 'createRelease', { name, version: 'v9.8' })
  expect(created.success).toBe(true)
  await lead.page.getByRole('textbox', { name: 'Search releases' }).fill(name)
  await expect(lead.page.getByTestId('release-row')).toHaveCount(1)
  await lead.page.getByRole('combobox', { name: 'Filter releases by status' }).selectOption('approved')
  await expect(lead.page.getByRole('heading', { name: 'No matching releases' })).toBeVisible()
  await lead.page.getByRole('combobox', { name: 'Filter releases by status' }).selectOption('draft')
  await expect(lead.page.getByTestId('release-row')).toHaveCount(1)
  await lead.page.getByRole('textbox', { name: 'Search releases' }).fill('v9.8')
  await expect(lead.page.getByTestId('release-row').filter({ hasText: name })).toHaveCount(1)
  await lead.context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await lead.page.getByRole('button', { name: 'Copy reviewer ID' }).click()
  expect(await lead.page.evaluate(() => navigator.clipboard.readText())).toBe(await lead.page.getByTestId('my-user-id').innerText())
  await lead.page.screenshot({ path: '.deepspace/screenshots/dashboard.png', fullPage: true })
  await lead.page.setViewportSize({ width: 390, height: 844 })
  expect(await lead.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await lead.page.screenshot({ path: '.deepspace/screenshots/dashboard-mobile.png', fullPage: true })
  await lead.page.getByTestId('release-row').filter({ hasText: name }).click()
  await lead.page.getByRole('button', { name: 'Copy workspace link' }).click()
  expect(await lead.page.evaluate(() => navigator.clipboard.readText())).toBe(lead.page.url())
})
