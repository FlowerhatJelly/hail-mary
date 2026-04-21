import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { linked_transaction_id, ...updates } = body

  if (updates.amount !== undefined) {
    const { data: current } = await supabaseAdmin
      .from('fixed_expenses')
      .select('amount')
      .eq('id', id)
      .single()

    if (current && current.amount !== updates.amount) {
      await supabaseAdmin.from('fixed_expense_history').insert({
        fixed_expense_id: id,
        previous_amount: current.amount,
        new_amount: updates.amount,
        linked_transaction_id: linked_transaction_id ?? null,
      })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('fixed_expenses')
    .update(updates)
    .eq('id', id)
    .select('*, account:accounts(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabaseAdmin
    .from('fixed_expenses')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
