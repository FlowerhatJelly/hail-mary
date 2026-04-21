const GRACE_URL = process.env.GRACE_URL
const GRACE_SECRET = process.env.GRACE_SECRET

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function chatWithGrace(
  messages: ChatMessage[],
  context: Record<string, unknown> | undefined,
  system: string,
  tool: string
): Promise<string> {
  if (!GRACE_URL || !GRACE_SECRET) {
    throw new Error('GRACE_URL 또는 GRACE_SECRET이 설정되지 않았습니다.')
  }

  const res = await fetch(`${GRACE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-grace-secret': GRACE_SECRET,
    },
    body: JSON.stringify({ messages, context, system, tool }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `Grace 오류: ${res.status}`)
  }

  const data = await res.json()
  return data.message
}
