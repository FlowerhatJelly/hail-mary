import { createClient } from '@supabase/supabase-js'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 10분 캐시 — Grace 재시작 후 최대 10분 내 자동 반영
let _cachedUrl: string | null = null
let _cachedAt = 0

async function getGraceUrl(): Promise<string> {
  const now = Date.now()
  if (_cachedUrl && now - _cachedAt < 10 * 60 * 1000) return _cachedUrl

  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'grace_url')
    .single()

  if (data?.value) {
    _cachedUrl = data.value
    _cachedAt = now
    return _cachedUrl
  }

  // env fallback (로컬 개발용)
  if (process.env.GRACE_URL) return process.env.GRACE_URL

  throw new Error('Grace URL이 설정되지 않았습니다. Grace 서버를 먼저 시작하세요.')
}

export async function chatWithGrace(
  messages: ChatMessage[],
  context: Record<string, unknown> | undefined,
  system: string,
  tool: string
): Promise<string> {
  const graceUrl = await getGraceUrl()
  const secret = process.env.GRACE_SECRET

  if (!secret) throw new Error('GRACE_SECRET이 설정되지 않았습니다.')

  const res = await fetch(`${graceUrl}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-grace-secret': secret,
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
