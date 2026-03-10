/**
 * Next.js Instrumentation Hook
 * Patches globalThis.fetch inside the API route runtime context
 * so devflow can intercept Anthropic SDK calls.
 */

export async function register() {
  // Only patch in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const DEVFLOW_PORT = parseInt(process.env.DEVFLOW_PORT || '4444')
  const origFetch = globalThis.fetch

  // Don't patch if fetch doesn't exist or already patched
  if (typeof origFetch !== 'function') return
  if ((origFetch as any).__devflow) return

  // Store ref for sendToDevflow
  _origFetchRef = origFetch

  let seq = 0

  const patched = async function devflowFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request)?.url ?? ''

    const method = (
      init?.method ||
      (typeof input === 'object' && !(input instanceof URL)
        ? (input as Request).method
        : null) ||
      'GET'
    ).toUpperCase()

    let parsed: URL | { hostname: string; pathname: string; protocol: string }
    try {
      parsed = new URL(url)
    } catch {
      parsed = { hostname: '', pathname: url, protocol: 'https:' }
    }

    const host = parsed.hostname

    // Skip calls to devflow itself and localhost dev server
    if (
      (host === 'localhost' || host === '127.0.0.1') &&
      url.includes(`:${DEVFLOW_PORT}`)
    ) {
      return origFetch(input, init)
    }

    const id = ++seq
    const startTime = Date.now()
    const record = {
      id,
      method,
      url,
      host,
      path: parsed.pathname,
      proto: parsed.protocol?.replace(':', '') || 'https',
      timestamp: new Date().toISOString(),
      status: null as number | null,
      duration: null as number | null,
      requestBody: '',
      responseBody: '',
      error: null as string | null,
    }

    // Capture request body
    if (init?.body) {
      try {
        record.requestBody = (
          typeof init.body === 'string' ? init.body : String(init.body)
        ).slice(0, 400)
      } catch {}
    }

    // Send start event to devflow
    sendToDevflow(DEVFLOW_PORT, { type: 'ingest', event: 'start', call: record })

    try {
      const res = await origFetch(input, init)
      record.status = res.status
      record.duration = Date.now() - startTime

      // Read a slice of the response body
      try {
        const clone = res.clone()
        const text = await clone.text()
        record.responseBody = text.slice(0, 800)
      } catch {}

      sendToDevflow(DEVFLOW_PORT, {
        type: 'ingest',
        event: 'complete',
        call: record,
      })
      return res
    } catch (err: any) {
      record.duration = Date.now() - startTime
      record.error = err.message
      sendToDevflow(DEVFLOW_PORT, {
        type: 'ingest',
        event: 'error',
        call: record,
      })
      throw err
    }
  }

  ;(patched as any).__devflow = true
  globalThis.fetch = patched as typeof globalThis.fetch
}

/** Fire-and-forget POST to devflow's ingest endpoint using the original fetch */
function sendToDevflow(port: number, data: Record<string, unknown>) {
  // Use the original (unpatched) fetch stored before we overwrote it
  if (!_origFetchRef) return
  try {
    _origFetchRef(`http://127.0.0.1:${port}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {}) // ignore errors (devflow might not be running)
  } catch {}
}

let _origFetchRef: typeof globalThis.fetch | null = null
