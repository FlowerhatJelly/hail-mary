import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { isActiveInMonth } from '@/lib/fixed-expense-utils'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ yearMonth: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { yearMonth } = await params
  const [year, month] = yearMonth.split('-')
  const startDate = `${year}-${month}-01`
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

  const [{ data: transactions }, { data: fixedExpenses }] = await Promise.all([
    supabaseAdmin
      .from('transactions')
      .select('*, account:accounts(*), category:categories(*)')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('type', 'actual')
      .order('date', { ascending: true }),
    supabaseAdmin
      .from('fixed_expenses')
      .select('*, account:accounts(*)')
      .eq('is_active', true),
  ])

  const planned = (fixedExpenses ?? [])
    .filter(fe => isActiveInMonth(fe, yearMonth))
    .map(fe => ({
      id: `fixed-${fe.id}`,
      date: `${year}-${month}-${String(fe.day_of_month).padStart(2, '0')}`,
      amount: fe.amount,
      original_memo: fe.name,
      type: 'planned' as const,
      account: fe.account,
    }))

  return NextResponse.json({
    transactions: transactions ?? [],
    planned,
  })
}
