import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const yearMonth = searchParams.get('month')
  const q = searchParams.get('q')
  const unclassified = searchParams.get('unclassified') === 'true'

  let query = supabaseAdmin
    .from('transactions')
    .select('*, account:accounts(*), category:categories(*)')
    .order('date', { ascending: false })

  if (yearMonth) {
    const [year, month] = yearMonth.split('-')
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    query = query
      .gte('date', `${year}-${month}-01`)
      .lte('date', `${year}-${month}-${String(lastDay).padStart(2, '0')}`)
  }

  if (q) {
    query = query.or(`original_memo.ilike.%${q}%,custom_memo.ilike.%${q}%`)
  }

  if (unclassified) {
    query = query.is('category_id', null)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
