import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAction } from '../lib/use-action'
import type { Release } from '../lib/release-rules'

export function DecisionPanel({
  release,
  releaseId,
  isLead,
  ready,
  independentReview,
}: {
  release: Release
  releaseId: string
  isLead: boolean
  ready: boolean
  independentReview: boolean
}) {
  const [reason, setReason] = useState('')
  const { run, busy, message, failed } = useAction()
  async function decide(decision: 'approved' | 'rejected') {
    await run(
      'decideRelease',
      { releaseId, decision, reason },
      'Decision saved. This release is now read-only.',
    )
  }
  return (
    <section className="lp-panel">
      <h2>Release decision</h2>
      {release.status === 'approved' || release.status === 'rejected' ? (
        <>
          <p>
            This release is read-only. Review the evidence captured at the
            decision.
          </p>
          <Link className="lp-button" to={`/releases/${releaseId}/report`}>
            View decision report
          </Link>
        </>
      ) : isLead && release.status === 'draft' ? (
        <>
          <p>
            {ready
              ? 'Evidence and independent review requirements are met.'
              : 'Approval requires five verified gates and an independent reviewer.'}
          </p>
          <p data-testid="independent-review">
            {independentReview
              ? '✓ Independent reviewer attestation recorded'
              : 'Independent review missing: ask another reviewer to verify a gate.'}
          </p>
          <label>
            Decision reason
            <textarea
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional for approval; at least 10 characters to reject."
            />
          </label>
          <div className="lp-actions">
            <button
              className="lp-button"
              disabled={!ready || busy}
              onClick={() => decide('approved')}
            >
              Approve release
            </button>
            <button
              className="lp-button lp-secondary"
              disabled={reason.trim().length < 10 || busy}
              onClick={() => decide('rejected')}
            >
              Reject release
            </button>
          </div>
        </>
      ) : (
        <p>Only the release lead can make the final decision.</p>
      )}
      {message && (
        <p
          role={failed ? 'alert' : 'status'}
          className={failed ? 'lp-error' : 'lp-feedback'}
        >
          {message}
        </p>
      )}
    </section>
  )
}
