import { useState, type FormEvent } from 'react'
import type { Gate } from '../lib/release-rules'
import { useAction } from '../lib/use-action'

export function GateCard({
  gate,
  gateId,
  index,
  readOnly,
}: {
  gate: Gate
  gateId: string
  index: number
  readOnly: boolean
}) {
  const [editing, setEditing] = useState(false)
  const { run, busy, message, failed } = useAction()
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await run(
      'verifyGate',
      {
        releaseId: gate.releaseId,
        gateId,
        status: form.get('status'),
        evidenceNote: form.get('note'),
        evidenceUrl: form.get('url'),
      },
      'Evidence saved.',
    )
    if (result) setEditing(false)
  }
  return (
    <article className="lp-panel" data-testid="gate-card" data-gate-id={gateId}>
      <div className="lp-gate-title">
        <span className="lp-number">0{index + 1}</span>
        <h2>{gate.title}</h2>
        <span className={`lp-badge ${gate.status}`}>{gate.status}</span>
      </div>
      <p className="lp-evidence">
        {gate.evidenceNote || 'No evidence submitted yet.'}
      </p>
      {gate.evidenceUrl && (
        <a
          className="lp-back"
          href={gate.evidenceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open evidence ↗
        </a>
      )}
      {gate.verifiedBy && (
        <p className="lp-note">
          Recorded by <span data-testid="verified-by">{gate.verifiedBy}</span>
          <br />
          {new Date(gate.verifiedAt).toLocaleString()}
        </p>
      )}
      {editing && !readOnly ? (
        <form onSubmit={save}>
          <div className="lp-form-grid">
            <label>
              Result
              <select
                name="status"
                defaultValue={gate.status === 'failed' ? 'failed' : 'verified'}
              >
                <option value="verified">Verified</option>
                <option value="failed">Failed</option>
              </select>
            </label>
          </div>
          <label>
            Evidence note
            <textarea
              name="note"
              required
              minLength={10}
              maxLength={1000}
              defaultValue={gate.evidenceNote}
            />
          </label>
          <label>
            Evidence URL (optional)
            <input
              name="url"
              type="url"
              maxLength={500}
              defaultValue={gate.evidenceUrl}
              placeholder="https://…"
            />
          </label>
          <div className="lp-actions">
            <button className="lp-button" disabled={busy}>
              {busy ? 'Saving…' : 'Save evidence'}
            </button>
            <button
              className="lp-button lp-secondary"
              type="button"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        !readOnly && (
          <button
            className="lp-button lp-secondary"
            style={{ marginTop: 16 }}
            onClick={() => setEditing(true)}
          >
            Record evidence
          </button>
        )
      )}
      {message && (
        <p
          role={failed ? 'alert' : 'status'}
          className={failed ? 'lp-error' : 'lp-feedback'}
        >
          {message}
        </p>
      )}
    </article>
  )
}
