import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: keywords }, { data: unclassified }] = await Promise.all([
    supabaseAdmin.from('category_keywords').select('*, category:categories(*)'),
    supabaseAdmin.from('transactions').select('id, original_memo').is('category_id', null),
  ])

  let classified = 0

  for (const tx of unclassified ?? []) {
    const memo = tx.original_memo.toLowerCase()
    const match = (keywords ?? []).find(k => memo.includes(k.keyword.toLowerCase()))

    if (match) {
      await supabaseAdmin
        .from('transactions')
        .update({ category_id: match.category_id })
        .eq('id', tx.id)
      classified++
    }
  }

  const { count } = await supabaseAdmin
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .is('category_id', null)

  return NextResponse.json({ classified, unclassifiedCount: count ?? 0 })
}
