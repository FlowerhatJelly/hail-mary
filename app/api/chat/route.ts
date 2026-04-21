import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const RELAY_URL = process.env.RELAY_URL
const RELAY_SECRET = process.env.RELAY_SECRET

async function callRelay(messages: unknown[], context: unknown, system: string) {
  const res = await fetch(`${RELAY_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-relay-secret': RELAY_SECRET!,
    },
    body: JSON.stringify({ messages, context, system }),
    signal: AbortSignal.timeout(120_000), // 2분 타임아웃
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? '릴레이 서버 오류')
  }
  return res.json()
}

async function callAnthropicApi(messages: unknown[], context: unknown, system: string) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompt = `${system}\n\n현재 데이터 컨텍스트:\n${context ? JSON.stringify(context, null, 2) : '(데이터 없음)'}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages as Parameters<typeof client.messages.create>[0]['messages'],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return { message: text }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, context } = await req.json()

  const system = `당신은 부부 공용 가계부의 재무 어시스턴트입니다. 실제 지출 데이터를 바탕으로 구체적이고 실용적인 조언을 제공합니다.
재무 관리 원칙, 통장 구조 설계, 절약 방법, 대출/이자 관리 등에 대한 전문 지식을 활용해 도움을 드립니다.
한국어로 답변하고, 금액은 원화(원)으로 표시하세요. 친근하지만 전문적인 톤을 유지하세요.`

  try {
    // 릴레이 서버 우선 사용 (Claude Code CLI, 구독 포함)
    if (RELAY_URL && RELAY_SECRET) {
      const data = await callRelay(messages, context, system)
      return NextResponse.json(data)
    }

    // 폴백: Anthropic API 직접 호출
    if (process.env.ANTHROPIC_API_KEY) {
      const data = await callAnthropicApi(messages, context, system)
      return NextResponse.json(data)
    }

    return NextResponse.json(
      { error: 'RELAY_URL 또는 ANTHROPIC_API_KEY가 설정되지 않았습니다.' },
      { status: 503 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류'

    // 릴레이 실패 시 API로 폴백
    if (RELAY_URL && process.env.ANTHROPIC_API_KEY) {
      console.warn('릴레이 실패, API 폴백:', message)
      try {
        const data = await callAnthropicApi(messages, context, system)
        return NextResponse.json({ ...data, _relay_fallback: true })
      } catch {}
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
