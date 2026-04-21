import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('fixed_expenses')
    .select('*, account:accounts(*)')
    .eq('is_active', true)
    .order('day_of_month', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, amount, day_of_month, recurrence, start_date, duration_months, interest_rate, account_id } = body

  if (!name || !amount || !day_of_month || !start_date || !account_id) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('fixed_expenses')
    .insert({
      name,
      amount,
      day_of_month,
      recurrence: recurrence ?? 'monthly',
      start_date,
      duration_months: duration_months ?? null,
      interest_rate: interest_rate ?? null,
      account_id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
