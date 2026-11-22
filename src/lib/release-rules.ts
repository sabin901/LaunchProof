export const REQUIRED_GATES = [
  { key: 'build', title: 'Build and automated tests' },
  { key: 'auth', title: 'Authentication and authorization' },
  { key: 'critical', title: 'Critical issues resolved' },
  { key: 'smoke', title: 'Regression smoke test' },
  { key: 'recovery', title: 'Recovery readiness' },
] as const

export type Gate = {
  releaseId: string
  key: string
  title: string
  required: boolean | 0 | 1
  status: 'pending' | 'verified' | 'failed'
  evidenceNote: string
  evidenceUrl: string
  verifiedBy: string
  verifiedAt: number
}
export type Release = {
  name: string
  version: string
  leadUserId: string
  policyVersion: 'v1'
  status: 'initializing' | 'draft' | 'approved' | 'rejected' | 'init_failed'
  decisionSnapshot?: DecisionSnapshot
  decisionAt?: number
  decisionBy?: string
  decisionReason?: string
}
export type Membership = {
  teamId: string
  userId: string
  status: string
  roleInRelease: 'lead' | 'reviewer'
  addedAt: number
}
export type ReleaseEvent = {
  releaseId: string
  actorUserId: string
  kind: string
  summary: string
  occurredAt: number
}
export type DecisionSnapshot = {
  name: string
  version: string
  policyVersion: 'v1'
  decision: 'approved' | 'rejected'
  actorId: string
  decidedAt: number
  reason: string
  gates: Gate[]
  independentReviewerIds: string[]
}

export function boundedText(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`)
  const text = value.trim()
  if (text.length < min || text.length > max)
    throw new Error(`${label} must be ${min}–${max} characters.`)
  return text
}
export function validateReleaseInput(name: unknown, version: unknown) {
  return {
    name: boundedText(name, 'Release name', 2, 80),
    version: boundedText(version, 'Version', 1, 30),
  }
}
export function validateEvidence(status: unknown, note: unknown, url: unknown = '') {
  if (status !== 'verified' && status !== 'failed') throw new Error('Choose verified or failed.')
  const evidenceNote = boundedText(note, 'Evidence note', 10, 1000)
  const evidenceUrl = boundedText(url, 'Evidence URL', 0, 500)
  if (evidenceUrl) {
    let parsed: URL
    try {
      parsed = new URL(evidenceUrl)
    } catch {
      throw new Error('Evidence URL must be a valid HTTP(S) address.')
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password)
      throw new Error('Evidence URL must be HTTP(S) without credentials.')
  }
  return { status, evidenceNote, evidenceUrl }
}
// Shared by the UI and server. The server always rechecks these rules on save.
const requiredKeys: string[] = REQUIRED_GATES.map((gate) => gate.key)

function hasVerifiedEvidence(gate: Gate): boolean {
  try {
    validateEvidence(gate.status, gate.evidenceNote, gate.evidenceUrl)
    return (
      gate.status === 'verified' &&
      Boolean(gate.verifiedBy?.trim()) &&
      Number.isFinite(gate.verifiedAt) &&
      gate.verifiedAt > 0
    )
  } catch {
    return false
  }
}

export function getReleaseReadiness(gates: Gate[], releaseId?: string) {
  // Five rows alone are insufficient: reject duplicates, foreign-release gates,
  // and unknown keys. SQLite may return the required flag as 1 instead of true.
  const completeSet =
    gates.length === requiredKeys.length &&
    new Set(gates.map((g) => g.key)).size === requiredKeys.length &&
    gates.every(
      (g) =>
        requiredKeys.includes(g.key) &&
        (g.required === true || g.required === 1) &&
        (!releaseId || g.releaseId === releaseId),
    ) &&
    new Set(gates.map((g) => g.releaseId)).size === 1
  const verifiedGates = gates.filter(hasVerifiedEvidence)
  const verifiedKeys = new Set(verifiedGates.map((gate) => gate.key))
  const missing = requiredKeys.filter((key) => !verifiedKeys.has(key))
  return {
    approvable: completeSet && missing.length === 0,
    completeSet,
    missing,
    verified: verifiedGates.length,
  }
}
export function getApprovalEligibility(
  release: Release,
  gates: Gate[],
  members: Membership[],
  releaseId: string,
) {
  const readiness = getReleaseReadiness(gates, releaseId)
  // A lead cannot supply their own independent review; only active reviewers
  // belonging to this release count, even if an old attestation still exists.
  const reviewers = new Set(
    members
      .filter(
        (m) =>
          m.teamId === releaseId &&
          m.status === 'active' &&
          m.roleInRelease === 'reviewer' &&
          m.userId !== release.leadUserId,
      )
      .map((m) => m.userId),
  )
  const independentReviewerIds = [
    ...new Set(
      gates
        .filter(
          (g) =>
            g.releaseId === releaseId && g.status === 'verified' && reviewers.has(g.verifiedBy),
        )
        .map((g) => g.verifiedBy),
    ),
  ]
  return {
    ...readiness,
    independentReviewerIds,
    independentReview: independentReviewerIds.length > 0,
    approvable:
      release.status === 'draft' && readiness.approvable && independentReviewerIds.length > 0,
  }
}
export function makeDecisionSnapshot(
  release: Release,
  gates: Gate[],
  actorId: string,
  decision: 'approved' | 'rejected',
  reason: string,
  now: number,
  independentReviewerIds: string[] = [],
): DecisionSnapshot {
  // Copy the data, not references to live gates. Reports and exports must read
  // this snapshot so they always show what was considered at decision time.
  return structuredClone({
    name: release.name,
    version: release.version,
    policyVersion: release.policyVersion,
    decision,
    actorId,
    decidedAt: now,
    reason,
    gates: [...gates].sort(
      (a, b) =>
        REQUIRED_GATES.findIndex((g) => g.key === a.key) -
        REQUIRED_GATES.findIndex((g) => g.key === b.key),
    ),
    independentReviewerIds,
  })
}
