import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useAuthProfileReady } from 'deepspace'
import { ArrowUpRight, Layers, Search, ShieldCheck, Clock3 } from 'lucide-react'
import { useAction } from '../../../lib/use-action'
import { CopyButton } from '../../../components/CopyButton'
import type { Release } from '../../../lib/release-rules'

export default function ReleasesPage() {
  const { records, status } = useQuery<Release>('releases', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })
  const { user } = useAuthProfileReady({ requireUser: true })
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const { run, busy, message, failed } = useAction()
  const navigate = useNavigate()
  const visible = records.filter(
    ({ data }) =>
      (filter === 'all' || data.status === filter) &&
      (data.name + ' ' + data.version)
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  )
  const counts = [
    { label: 'Total releases', value: records.length, icon: Layers },
    {
      label: 'In review',
      value: records.filter((r) => r.data.status === 'draft').length,
      icon: Clock3,
    },
    {
      label: 'Approved',
      value: records.filter((r) => r.data.status === 'approved').length,
      icon: ShieldCheck,
    },
  ]

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await run<{ releaseId: string; warning?: string }>(
      'createRelease',
      {
        name: form.get('name'),
        version: form.get('version'),
      },
    )
    if (result) navigate('/releases/' + result.releaseId)
  }

  return (
    <div className="lp-page">
      <p className="lp-eyebrow">WORKSPACE / OVERVIEW</p>
      <header className="lp-header">
        <div>
          <h1>Release overview</h1>
          <p>Your evidence, reviews, and decisions. All in one place.</p>
        </div>
        <button className="lp-button" onClick={() => setCreating(!creating)}>
          + New release
        </button>
      </header>

      <div className="lp-stats" aria-label="Release summary">
        {counts.map(({ label, value, icon: Icon }) => (
          <section className="lp-stat" key={label}>
            <span className="lp-stat-icon">
              <Icon size={20} />
            </span>
            <div>
              <p>{label}</p>
              <strong>{status === 'ready' ? value : '—'}</strong>
            </div>
          </section>
        ))}
      </div>

      {creating && (
        <form className="lp-panel lp-create" onSubmit={create}>
          <div className="lp-section-heading">
            <h2>Create a release</h2>
            <span className="lp-badge">Policy v1</span>
          </div>
          <div className="lp-form-grid">
            <label>
              Product name
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Atlas API"
                autoFocus
              />
            </label>
            <label>
              Version
              <input
                name="version"
                required
                maxLength={30}
                placeholder="v1.0.0"
              />
            </label>
          </div>
          <p>
            Five verification gates and an independent review before sign-off.
          </p>
          {message && (
            <p
              role={failed ? 'alert' : 'status'}
              className={failed ? 'lp-error' : ''}
            >
              {message}
            </p>
          )}
          <div className="lp-actions">
            <button className="lp-button" disabled={busy}>
              {busy ? 'Creating…' : 'Create release'}
            </button>
            <button
              className="lp-button lp-secondary"
              type="button"
              disabled={busy}
              onClick={() => setCreating(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="lp-panel lp-list">
        <div className="lp-toolbar">
          <div>
            <h2>All releases</h2>
            <p>
              {status === 'ready'
                ? visible.length + ' matching releases'
                : 'Connecting…'}
            </p>
          </div>
          <div className="lp-filters">
            <label className="lp-search">
              <Search size={16} />
              <input
                aria-label="Search releases"
                placeholder="Search name or version…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="Filter releases by status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="draft">In review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="init_failed">Setup failed</option>
              <option value="initializing">Initializing</option>
            </select>
          </div>
        </div>
        {status !== 'ready' ? (
          <p className="lp-empty" role="status">
            {status === 'error'
              ? 'Unable to load releases. Check your connection and refresh.'
              : 'Connecting to your releases…'}
          </p>
        ) : records.length === 0 ? (
          <div className="lp-empty">
            <Layers size={32} />
            <h2>Your next release starts here.</h2>
            <p>
              Create a release and invite a colleague to review the evidence.
            </p>
            <button className="lp-button" onClick={() => setCreating(true)}>
              Create your first release
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="lp-empty">
            <h2>No matching releases</h2>
            <p>Try another name, version, or status.</p>
            <button
              className="lp-button lp-secondary"
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          visible.map((r) => (
            <Link
              className="lp-release-row"
              data-testid="release-row"
              key={r.recordId}
              to={'/releases/' + r.recordId}
            >
              <span className="lp-release-icon">
                <Layers size={19} />
              </span>
              <div>
                <h2>{r.data.name}</h2>
                <p>
                  {r.data.version} <span aria-hidden="true">·</span>{' '}
                  {r.data.leadUserId === user?.id
                    ? 'You are the lead'
                    : 'Reviewer workspace'}
                </p>
              </div>
              <span className={'lp-badge ' + r.data.status}>
                {r.data.status.replace('_', ' ')}
              </span>
              <ArrowUpRight size={18} />
            </Link>
          ))
        )}
      </section>

      <section className="lp-identity-panel">
        <div>
          <h2>Your reviewer ID</h2>
          <p>Share this with a release lead to join their review.</p>
          <code data-testid="my-user-id">{user?.id}</code>
        </div>
        <CopyButton text={user?.id ?? ''} label="Copy reviewer ID" />
      </section>
    </div>
  )
}
