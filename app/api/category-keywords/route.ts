import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { category_id, keyword } = await req.json()
  if (!category_id || !keyword) {
    return NextResponse.json({ error: 'category_id and keyword required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('category_keywords')
    .upsert({ category_id, keyword }, { onConflict: 'keyword' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
