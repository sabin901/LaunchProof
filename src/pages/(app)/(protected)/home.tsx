import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useAuthProfileReady } from 'deepspace'
import { callAction } from '../../../lib/action-client'
import type { Release } from '../../../lib/release-rules'

export default function ReleasesPage() {
  const { records, status } = useQuery<Release>('releases', { orderBy: 'createdAt', orderDir: 'desc' })
  const { user } = useAuthProfileReady({ requireUser: true })
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      const result = await callAction<{ releaseId: string }>('createRelease', { name: form.get('name'), version: form.get('version') })
      navigate(`/releases/${result.releaseId}`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Creation failed.') }
    finally { setBusy(false) }
  }
  return <div className="lp-page">
    <p className="lp-eyebrow">RELEASE CONTROL / WORKSPACE</p>
    <header className="lp-header"><div><h1>Releases</h1><p>One shared record of what’s ready to ship.</p></div><button className="lp-button" onClick={() => setCreating(!creating)}>+ New release</button></header>
    <p className="lp-identity">Your reviewer ID: <code data-testid="my-user-id">{user?.id}</code><br />Share this ID with a release lead after signing in.</p>
    {creating && <form className="lp-panel lp-create" onSubmit={create}><h2>Create a release</h2><div className="lp-form-grid">
      <label>Product name<input name="name" required minLength={2} maxLength={80} placeholder="Atlas API" autoFocus /></label>
      <label>Version<input name="version" required maxLength={30} placeholder="v1.0.0" /></label></div><p>We’ll create the five required verification gates.</p>
      {error && <p role="alert" className="lp-error">{error}</p>}<button className="lp-button" disabled={busy}>{busy ? 'Creating…' : 'Create release'}</button></form>}
    {status !== 'ready' ? <p role="status">{status === 'error' ? 'Unable to load releases. Check your connection and refresh.' : 'Connecting to your releases…'}</p> : records.length === 0 ?
      <section className="lp-panel lp-empty"><h2>Your next release starts here.</h2><p>Create a release, collect evidence, and make a clear decision together.</p><button className="lp-button" onClick={() => setCreating(true)}>Create your first release</button></section> :
      <div className="lp-panel lp-list">{records.map(r => <Link className="lp-release-row" key={r.recordId} to={`/releases/${r.recordId}`}><div><h2>{r.data.name}</h2><p>{r.data.version} · Fixed five-gate policy</p></div><span className={`lp-badge ${r.data.status}`}>{r.data.status.replace('_', ' ')}</span><span>↗</span></Link>)}</div>}
  </div>
}
