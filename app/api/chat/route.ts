import { auth } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, context } = await req.json()

  const systemPrompt = `당신은 부부 공용 가계부의 재무 어시스턴트입니다. 실제 지출 데이터를 바탕으로 구체적이고 실용적인 조언을 제공합니다.
재무 관리 원칙, 통장 구조 설계, 절약 방법, 대출/이자 관리 등에 대한 전문 지식을 활용해 도움을 드립니다.

현재 데이터 컨텍스트:
${context ? JSON.stringify(context, null, 2) : '(데이터 없음)'}

한국어로 답변하고, 금액은 원화(원)으로 표시하세요. 친근하지만 전문적인 톤을 유지하세요.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ message: text })
}
