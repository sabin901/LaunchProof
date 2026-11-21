import { describe, it, expect } from 'vitest'
import { REQUIRED_GATES, getReleaseReadiness, makeDecisionSnapshot, validateEvidence, validateReleaseInput, type Gate, type Release } from './release-rules'
const gates = (): Gate[] => REQUIRED_GATES.map(g => ({ ...g, releaseId: 'r1', required: true, status: 'verified', evidenceNote: 'Checked the test results.', evidenceUrl: 'https://example.com/results', verifiedBy: 'reviewer', verifiedAt: 123 }))
describe('readiness fails closed', () => {
  it('requires exactly five distinct policy gates', () => {
    for (const input of [[], gates().slice(1), [...gates(), gates()[0]], [...gates().slice(1), gates()[1]]]) expect(getReleaseReadiness(input).approvable).toBe(false)
  })
  it('requires valid evidence and attribution on every gate', () => {
    for (const patch of [{ status: 'pending' }, { status: 'failed' }, { evidenceNote: '' }, { verifiedBy: '' }, { verifiedAt: 0 }, { required: false }, { evidenceUrl: 'javascript:alert(1)' }, { releaseId: 'r2' }]) {
      const input = gates(); Object.assign(input[0], patch)
      expect(getReleaseReadiness(input, 'r1').approvable).toBe(false)
    }
  })
  it('accepts five complete gates and reports absent keys', () => {
    expect(getReleaseReadiness(gates(), 'r1').approvable).toBe(true)
    expect(getReleaseReadiness([]).missing).toHaveLength(5)
  })
})
it('validates bounded input and safe URLs', () => {
  expect(validateReleaseInput(' Atlas ', ' 1.0 ')).toEqual({ name: 'Atlas', version: '1.0' })
  for (const name of ['', 'a', 'a'.repeat(81), null]) expect(() => validateReleaseInput(name, '1')).toThrow()
  for (const url of ['javascript:alert(1)', 'file:///tmp/a', 'data:text/html,a', 'invalid', 'https://user:password@example.com']) expect(() => validateEvidence('verified', 'Enough evidence here', url)).toThrow()
  expect(() => validateEvidence('approved', 'Enough evidence here')).toThrow()
  expect(() => validateEvidence('verified', 'a'.repeat(1001))).toThrow()
})
it('saves a deep snapshot independent of the source records', () => {
  const release: Release = { name: 'Atlas', version: '1', status: 'draft', policyVersion: 'v1', leadUserId: 'lead' }
  const input = gates(); const snapshot = makeDecisionSnapshot(release, input, 'lead', 'approved', '', 456)
  input[0].evidenceNote = 'changed'; release.name = 'changed'
  expect(snapshot.name).toBe('Atlas'); expect(snapshot.gates[0].evidenceNote).toBe('Checked the test results.')
})
