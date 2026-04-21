import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('original_memo')
    .order('created_at', { ascending: false })
    .limit(200)

  const memos = [...new Set((transactions ?? []).map(t => t.original_memo))].slice(0, 100)

  if (memos.length === 0) {
    return NextResponse.json({
      categories: [
        { name: '식비', color: '#f97316', keywords: ['편의점', '마트', '카페', '배달'] },
        { name: '교통', color: '#3b82f6', keywords: ['택시', '지하철', '버스', '주유'] },
        { name: '주거', color: '#8b5cf6', keywords: ['관리비', '전기', '가스', '수도'] },
        { name: '구독', color: '#ec4899', keywords: ['넷플릭스', '유튜브', '스포티파이'] },
        { name: '의료', color: '#22c55e', keywords: ['병원', '약국', '치과'] },
        { name: '금융', color: '#f59e0b', keywords: ['이자', '보험', '대출'] },
        { name: '기타', color: '#94a3b8', keywords: [] },
      ],
    })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `다음은 한국 가계부의 거래 내역 메모들입니다. 이 지출 패턴에 맞는 카테고리 구조를 추천해주세요.

거래 내역 샘플:
${memos.join('\n')}

JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "categories": [
    { "name": "식비", "color": "#f97316", "keywords": ["스타벅스", "배달", "마트"] }
  ]
}

6-10개 카테고리, 각 카테고리마다 대표 키워드 3-7개 포함. hex 색상 사용.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Parse error' }, { status: 500 })

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
