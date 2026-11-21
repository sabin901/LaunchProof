export const REQUIRED_GATES = [
  { key: 'build', title: 'Build and automated tests' },
  { key: 'auth', title: 'Authentication and authorization' },
  { key: 'critical', title: 'Critical issues resolved' },
  { key: 'smoke', title: 'Regression smoke test' },
  { key: 'recovery', title: 'Recovery readiness' },
] as const

export type Gate = {
  releaseId: string; key: string; title: string; required: boolean | 0 | 1
  status: 'pending' | 'verified' | 'failed'; evidenceNote: string; evidenceUrl: string
  verifiedBy: string; verifiedAt: number
}
export type Release = {
  name: string; version: string; leadUserId: string; policyVersion: 'v1'
  status: 'initializing' | 'draft' | 'approved' | 'rejected' | 'init_failed'
  decisionSnapshot?: DecisionSnapshot; decisionAt?: number; decisionBy?: string; decisionReason?: string
}
export type Membership = { teamId: string; userId: string; status: string; roleInRelease: 'lead' | 'reviewer'; addedAt: number }
export type ReleaseEvent = { releaseId: string; actorUserId: string; kind: string; summary: string; occurredAt: number }
export type DecisionSnapshot = {
  name: string; version: string; policyVersion: 'v1'; decision: 'approved' | 'rejected'
  actorId: string; decidedAt: number; reason: string; gates: Gate[]; independentReviewerIds: string[]
}

export function boundedText(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`)
  const text = value.trim()
  if (text.length < min || text.length > max) throw new Error(`${label} must be ${min}–${max} characters.`)
  return text
}
export function validateReleaseInput(name: unknown, version: unknown) {
  return { name: boundedText(name, 'Release name', 2, 80), version: boundedText(version, 'Version', 1, 30) }
}
export function validateEvidence(status: unknown, note: unknown, url: unknown = '') {
  if (status !== 'verified' && status !== 'failed') throw new Error('Choose verified or failed.')
  const evidenceNote = boundedText(note, 'Evidence note', 10, 1000)
  const evidenceUrl = boundedText(url, 'Evidence URL', 0, 500)
  if (evidenceUrl) {
    let parsed: URL
    try { parsed = new URL(evidenceUrl) } catch { throw new Error('Evidence URL must be a valid HTTP(S) address.') }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Evidence URL must be HTTP(S) without credentials.')
  }
  return { status, evidenceNote, evidenceUrl }
}
export function getReleaseReadiness(gates: Gate[], releaseId?: string) {
  const expected = REQUIRED_GATES.map(g => g.key as string)
  const completeSet = gates.length === 5 && new Set(gates.map(g => g.key)).size === 5 &&
    gates.every(g => expected.includes(g.key) && (g.required === true || g.required === 1) && (!releaseId || g.releaseId === releaseId)) &&
    new Set(gates.map(g => g.releaseId)).size === 1
  const qualifies = (g: Gate) => {
    try {
      validateEvidence(g.status, g.evidenceNote, g.evidenceUrl)
      return g.status === 'verified' && Boolean(g.verifiedBy?.trim()) && Number.isFinite(g.verifiedAt) && g.verifiedAt > 0
    } catch { return false }
  }
  const missing = expected.filter(key => !gates.some(g => g.key === key && qualifies(g)))
  return { approvable: completeSet && missing.length === 0, completeSet, missing, verified: gates.filter(qualifies).length }
}
export function getApprovalEligibility(release: Release, gates: Gate[], members: Membership[], releaseId: string) {
  const readiness = getReleaseReadiness(gates, releaseId)
  const reviewers = new Set(members.filter(m => m.teamId === releaseId && m.status === 'active' && m.roleInRelease === 'reviewer' && m.userId !== release.leadUserId).map(m => m.userId))
  const independentReviewerIds = [...new Set(gates.filter(g => g.releaseId === releaseId && g.status === 'verified' && reviewers.has(g.verifiedBy)).map(g => g.verifiedBy))]
  return { ...readiness, independentReviewerIds, independentReview: independentReviewerIds.length > 0,
    approvable: release.status === 'draft' && readiness.approvable && independentReviewerIds.length > 0 }
}
export function makeDecisionSnapshot(release: Release, gates: Gate[], actorId: string, decision: 'approved' | 'rejected', reason: string, now: number, independentReviewerIds: string[] = []): DecisionSnapshot {
  return structuredClone({ name: release.name, version: release.version, policyVersion: release.policyVersion,
    decision, actorId, decidedAt: now, reason,
    gates: [...gates].sort((a, b) => REQUIRED_GATES.findIndex(g => g.key === a.key) - REQUIRED_GATES.findIndex(g => g.key === b.key)), independentReviewerIds })
}
