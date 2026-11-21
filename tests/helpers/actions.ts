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

export async function recordTool(page: Page, name: string, input: Record<string, unknown>) {
  return page.evaluate(async ({ name, input }) => {
    const { token } = await (await fetch('/api/auth/token', { method: 'POST' })).json()
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    const catalog = await (await fetch('/_deepspace/agent/browser/tools', { headers })).json()
    if (!catalog.ok || !catalog.tools.some((t: { name: string }) => t.name === name)) throw new Error('Expected record tool is unavailable')
    const response = await fetch(`/_deepspace/agent/browser/tools/${name}`, { method: 'POST', headers, body: JSON.stringify({ input }) })
    const result = await response.json()
    return result.result ?? result
  }, { name, input })
}
