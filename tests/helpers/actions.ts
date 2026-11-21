import type { Page } from '@playwright/test'

export async function action(page: Page, name: string, params: Record<string, unknown>) {
  return page.evaluate(async ({ name, params }) => {
    const tokenResponse = await fetch('/api/auth/token', { method: 'POST' })
    const { token } = await tokenResponse.json()
    const response = await fetch(`/api/actions/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(params) })
    return response.json()
  }, { name, params })
}

export async function createRelease(page: Page) {
  await page.goto('/home')
  const result = await action(page, 'createRelease', { name: `__test-${Date.now()}__ Atlas`, version: 'v1.0' })
  if (!result.success) throw new Error(result.error)
  await page.goto(`/releases/${result.data.releaseId}`)
  return result.data.releaseId as string
}
