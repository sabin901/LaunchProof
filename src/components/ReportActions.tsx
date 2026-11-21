import { Download, Printer } from 'lucide-react'
import type { DecisionSnapshot } from '../lib/release-rules'
import { CopyButton } from './CopyButton'

export function ReportActions({ snapshot }: { snapshot: DecisionSnapshot }) {
  const summary = [
    `${snapshot.name} ${snapshot.version} — ${snapshot.decision}`,
    `Decision: ${new Date(snapshot.decidedAt).toISOString()} by ${snapshot.actorId}`,
    `Reason: ${snapshot.reason || 'No additional note.'}`,
    ...snapshot.gates.map(
      (g) =>
        `${g.title}: ${g.status}\n${g.evidenceNote}\n${g.evidenceUrl || ''}`,
    ),
    'Human-attested evidence. External results have not been independently certified.',
  ].join('\n\n')

  function download() {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `launchproof-${snapshot.name.replace(/[^a-z0-9-]/gi, '-').slice(0, 60)}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="lp-actions lp-report-actions">
      <button className="lp-button" onClick={download}>
        <Download size={16} />
        Download JSON
      </button>
      <CopyButton text={summary} label="Copy report summary" />
      <button className="lp-button lp-secondary" onClick={() => window.print()}>
        <Printer size={16} />
        Print report
      </button>
    </div>
  )
}
