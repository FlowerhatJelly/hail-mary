import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { parseTossCsv, hashTransaction } from '@/lib/toss-csv-parser'
import { detectChanges } from '@/lib/change-detector'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const accountId = formData.get('accountId') as string

  if (!file || !accountId) {
    return NextResponse.json({ error: 'file and accountId required' }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseTossCsv(text)

  let imported = 0
  let skipped = 0
  const importedIds: string[] = []

  for (const row of rows) {
    const hash = hashTransaction(row.date, row.amount, row.memo)

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert({
        account_id: accountId,
        date: row.date,
        amount: row.amount,
        original_memo: row.memo,
        toss_hash: hash,
        type: 'actual',
      })
      .select('id')
      .single()

    if (error?.code === '23505') {
      skipped++
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      imported++
      if (data) importedIds.push(data.id)
    }
  }

  // 금액 변동 감지
  let changeCandidates: Awaited<ReturnType<typeof detectChanges>> = []
  if (importedIds.length > 0) {
    const { data: newTxs } = await supabaseAdmin
      .from('transactions')
      .select('id, date, amount, original_memo, account_id')
      .in('id', importedIds)

    changeCandidates = await detectChanges(newTxs ?? [])
  }

  return NextResponse.json({ imported, skipped, changeCandidates })
}
