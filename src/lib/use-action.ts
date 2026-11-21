import { useState } from 'react'
import { callAction } from './action-client'

/** Shared confirmed-action state for forms. A failed request never reports success. */
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)

  async function run<T extends { warning?: string }>(
    name: string,
    params: Record<string, unknown>,
    success = '',
  ) {
    setBusy(true)
    setMessage('')
    setFailed(false)
    try {
      const result = await callAction<T>(name, params)
      setMessage(result.warning || success)
      return result
    } catch (error) {
      setFailed(true)
      setMessage(
        error instanceof Error
          ? error.message
          : 'Request failed. Please retry.',
      )
    } finally {
      setBusy(false)
    }
  }

  return { run, busy, message, failed }
}
