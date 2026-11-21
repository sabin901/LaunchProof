import { Link, useParams } from 'react-router-dom'
import { useQuery, useAuthProfileReady } from 'deepspace'
import { useState, type FormEvent } from 'react'
import { REQUIRED_GATES, getApprovalEligibility, type Release, type Gate, type Membership, type ReleaseEvent } from '../../../../../lib/release-rules'
import { GateCard } from '../../../../../components/GateCard'
import { DecisionPanel } from '../../../../../components/DecisionPanel'
import { callAction } from '../../../../../lib/action-client'

export default function ReleaseWorkspace() {
  const { id = '' } = useParams()
  const releases = useQuery<Release>('releases', { where: { recordId: id } })
  const gates = useQuery<Gate>('gates', { where: { releaseId: id } })
  const members = useQuery<Membership>('team_members', { where: { teamId: id } })
  const events = useQuery<ReleaseEvent>('events', { where: { releaseId: id }, orderBy: 'occurredAt', orderDir: 'desc', limit: 20 })
  const { user } = useAuthProfileReady({ requireUser: true })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      const result = await callAction<{ warning?: string }>('addReviewer', { releaseId: id, targetUserId: form.get('reviewer') })
      setMessage(result.warning || 'Reviewer added.')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not add reviewer.') }
    finally { setBusy(false) }
  }
  const release = releases.records[0]?.data
  if (releases.status === 'error' || gates.status === 'error') return <div className="lp-page" role="alert">Connection failed. Check your network and refresh.</div>
  if (releases.status !== 'ready' || gates.status !== 'ready') return <div className="lp-page" role="status">Connecting to release…</div>
  if (!release) return <div className="lp-page"><h1>Release unavailable</h1><p>This release does not exist or you do not have access.</p><Link to="/home">Back to releases</Link></div>
  const readiness = getApprovalEligibility(release, gates.records.map(g => g.data), members.records.map(m => m.data), id)
  return <div className="lp-page"><Link className="lp-back" to="/home">← All releases</Link>
    <header className="lp-header"><div><p className="lp-eyebrow">RELEASE WORKSPACE / {release.version}</p><h1>{release.name}</h1><p>Verify together. Ship with confidence.</p></div><span className={`lp-badge ${release.status}`}>{release.status}</span></header>
    {release.status === 'init_failed' && <p role="alert" className="lp-error">Setup failed. This release cannot be approved. Create a new release.</p>}
    <div className="lp-workspace"><section className="lp-gates" aria-label="Verification gates">{REQUIRED_GATES.map((definition, index) => {
      const row = gates.records.find(g => g.data.key === definition.key)
      return row ? <GateCard key={row.recordId} gate={row.data} gateId={row.recordId} index={index} readOnly={release.status !== 'draft'} /> : <p role="alert" key={definition.key}>Missing gate: {definition.title}</p>
    })}</section><aside><section className="lp-panel"><p className="lp-eyebrow">READINESS</p><div className="lp-score">{readiness.verified}<span> / 5</span></div><p>Gates verified</p><progress max={5} value={readiness.verified} /><p>Every gate requires evidence and an attributed reviewer before approval.</p><p className="lp-note">Evidence is a human attestation. LaunchProof does not execute CI or validate linked results.</p></section>
    <DecisionPanel release={release} releaseId={id} isLead={release.leadUserId === user?.id} ready={readiness.approvable} independentReview={readiness.independentReview} />
    <section className="lp-panel"><h2>Release team</h2>{members.records.map(m => <p className="lp-identity" key={m.recordId}>{m.data.roleInRelease}: <code>{m.data.userId}</code></p>)}
      {release.status === 'draft' && release.leadUserId === user?.id && <form onSubmit={invite}><label>Reviewer ID<input name="reviewer" required maxLength={150} /></label><p className="lp-note">Ask your reviewer to sign in once and share their ID from Releases.</p><button className="lp-button" disabled={busy}>Add reviewer</button></form>}{message && <p role="status">{message}</p>}</section>
    <section className="lp-panel"><h2>Activity</h2>{events.records.map(e => <div className="lp-event" key={e.recordId}><p>{e.data.summary}</p><time>{new Date(e.data.occurredAt).toLocaleString()}</time></div>)}</section>
    </aside></div>
  </div>
}

