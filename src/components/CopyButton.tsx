import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState('')
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('Copied')
    } catch {
      setStatus('Copy unavailable. Select and copy the text manually.')
    }
  }
  return (
    <span className="lp-copy">
      <button
        className="lp-button lp-secondary"
        type="button"
        disabled={!text}
        onClick={copy}
        aria-label={label}
      >
        {status === 'Copied' ? <Check size={15} /> : <Copy size={15} />}
        {label}
      </button>
      {status && (
        <span role="status" className="lp-note">
          {status}
        </span>
      )}
    </span>
  )
}
