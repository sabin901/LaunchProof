import { useQuery } from 'deepspace'
import { Link, useParams } from 'react-router-dom'
import type { Release } from '../../../../../lib/release-rules'
import { ReportActions } from '../../../../../components/ReportActions'

export default function DecisionReport() {
  const { id = '' } = useParams()
  const { records, status } = useQuery<Release>('releases', {
    where: { recordId: id },
  })
  if (status !== 'ready')
    return (
      <div className="lp-page" role="status">
        {status === 'error'
          ? 'Connection failed. Please refresh.'
          : 'Loading decision report…'}
      </div>
    )
  const snapshot = records[0]?.data.decisionSnapshot
  if (!snapshot)
    return (
      <div className="lp-page">
        <h1>Report unavailable</h1>
        <p>No saved decision, or you do not have access.</p>
        <Link to="/home">Back to releases</Link>
      </div>
    )
  return (
    <div className="lp-page">
      <Link className="lp-back" to={`/releases/${id}`}>
        ← Release workspace
      </Link>
      <header className="lp-header">
        <div>
          <p className="lp-eyebrow">
            SAVED DECISION / POLICY {snapshot.policyVersion}
          </p>
          <h1>
            {snapshot.name} · {snapshot.version}
          </h1>
          <p>Decision report</p>
        </div>
        <span className={`lp-badge ${snapshot.decision}`}>
          {snapshot.decision}
        </span>
      </header>
      <ReportActions snapshot={snapshot} />
      <section className="lp-panel">
        <h2>Decision record</h2>
        <p className="lp-evidence">
          Decided by {snapshot.actorId}
          <br />
          {new Date(snapshot.decidedAt).toLocaleString()}
        </p>
        <p>{snapshot.reason || 'No additional decision note.'}</p>
        <p className="lp-evidence">
          Independent reviewer at decision:{' '}
          {snapshot.independentReviewerIds?.join(', ') || 'None recorded'}
        </p>
        <p className="lp-note">
          This report uses the evidence snapshot saved with the decision.
          Evidence records human attestation, not independently validated CI
          results.
        </p>
      </section>
      <section className="lp-gates" style={{ marginTop: 24 }}>
        {snapshot.gates.map((g) => (
          <article className="lp-panel" data-testid="snapshot-gate" key={g.key}>
            <div className="lp-gate-title">
              <h2>{g.title}</h2>
              <span className={`lp-badge ${g.status}`}>{g.status}</span>
            </div>
            <p className="lp-evidence">
              {g.evidenceNote || 'No evidence recorded.'}
            </p>
            {g.evidenceUrl && (
              <a
                className="lp-back"
                href={g.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open captured evidence ↗
              </a>
            )}
            <p className="lp-note">
              {g.verifiedBy
                ? `Recorded by ${g.verifiedBy} · ${new Date(g.verifiedAt).toLocaleString()}`
                : 'Not yet verified'}
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}
