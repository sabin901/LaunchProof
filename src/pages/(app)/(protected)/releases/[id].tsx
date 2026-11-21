import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { REQUIRED_GATES, getReleaseReadiness, type Release, type Gate } from '../../../../lib/release-rules'

export default function ReleaseWorkspace() {
  const { id = '' } = useParams()
  const releases = useQuery<Release>('releases', { where: { recordId: id } })
  const gates = useQuery<Gate>('gates', { where: { releaseId: id } })
  const release = releases.records[0]?.data
  if (releases.status !== 'ready' || gates.status !== 'ready') return <div className="lp-page" role="status">Connecting to release…</div>
  if (!release) return <div className="lp-page"><h1>Release unavailable</h1><p>This release does not exist or you do not have access.</p><Link to="/home">Back to releases</Link></div>
  const readiness = getReleaseReadiness(gates.records.map(g => g.data), id)
  return <div className="lp-page"><Link className="lp-back" to="/home">← All releases</Link>
    <header className="lp-header"><div><p className="lp-eyebrow">RELEASE WORKSPACE / {release.version}</p><h1>{release.name}</h1><p>Verify together. Ship with confidence.</p></div><span className={`lp-badge ${release.status}`}>{release.status}</span></header>
    {release.status === 'init_failed' && <p role="alert" className="lp-error">Setup failed. This release cannot be approved. Create a new release.</p>}
    <div className="lp-workspace"><section className="lp-gates" aria-label="Verification gates">{REQUIRED_GATES.map((definition, index) => {
      const row = gates.records.find(g => g.data.key === definition.key)
      return <article className="lp-panel" data-testid="gate-card" key={definition.key}><div className="lp-gate-title"><span className="lp-number">0{index + 1}</span><h2>{definition.title}</h2><span className="lp-badge">{row?.data.status ?? 'missing'}</span></div><p>{row?.data.evidenceNote || 'No evidence submitted yet.'}</p></article>
    })}</section><aside><section className="lp-panel"><p className="lp-eyebrow">READINESS</p><div className="lp-score">{readiness.verified}<span> / 5</span></div><p>Gates verified</p><progress max={5} value={readiness.verified} /><p>Every gate requires evidence and an attributed reviewer before approval.</p><p className="lp-note">Evidence is a human attestation. LaunchProof does not execute CI or validate linked results.</p></section></aside></div>
  </div>
}
