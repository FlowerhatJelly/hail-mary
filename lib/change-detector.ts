import { supabaseAdmin } from './supabase'

export interface ChangeCandidate {
  transaction: { id: string; date: string; amount: number; original_memo: string }
  fixedExpense: { id: string; name: string; amount: number }
  amountDiff: number
}

export async function detectChanges(
  transactions: Array<{ id: string; date: string; amount: number; original_memo: string; account_id: string }>
): Promise<ChangeCandidate[]> {
  if (transactions.length === 0) return []

  const { data: fixedExpenses } = await supabaseAdmin
    .from('fixed_expenses')
    .select('id, name, amount, day_of_month, account_id')
    .eq('is_active', true)

  const candidates: ChangeCandidate[] = []

  for (const tx of transactions) {
    const txDay = parseInt(tx.date.substring(8, 10), 10)

    for (const fe of fixedExpenses ?? []) {
      if (fe.account_id !== tx.account_id) continue
      if (Math.abs(fe.day_of_month - txDay) > 3) continue
      if (tx.amount === fe.amount) continue
      // 30% 초과 차이는 다른 항목으로 간주
      if (Math.abs(tx.amount - fe.amount) / fe.amount > 0.3) continue

      candidates.push({
        transaction: {
          id: tx.id,
          date: tx.date,
          amount: tx.amount,
          original_memo: tx.original_memo,
        },
        fixedExpense: {
          id: fe.id,
          name: fe.name,
          amount: fe.amount,
        },
        amountDiff: tx.amount - fe.amount,
      })
    }
  }

  return candidates
}
