'use client'
import { useState } from 'react'
import { ChangeCandidate } from '@/lib/change-detector'

interface Props {
  candidates: ChangeCandidate[]
  onDone: () => void
}

export function ChangeDetectionModal({ candidates, onDone }: Props) {
  const [remaining, setRemaining] = useState(candidates)

  async function handleConfirm(candidate: ChangeCandidate) {
    await fetch(`/api/fixed-expenses/${candidate.fixedExpense.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: candidate.transaction.amount,
        linked_transaction_id: candidate.transaction.id,
      }),
    })
    dismiss(candidate)
  }

  function dismiss(candidate: ChangeCandidate) {
    const next = remaining.filter(c => c.fixedExpense.id !== candidate.fixedExpense.id)
    setRemaining(next)
    if (next.length === 0) onDone()
  }

  if (remaining.length === 0) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h2 className="text-white text-lg font-bold mb-1">금액 변동 감지</h2>
        <p className="text-gray-400 text-sm mb-4">기존 고정지출과 금액이 다른 거래가 있습니다.</p>

        {remaining.map((c, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 mb-3">
            <div className="text-white font-medium mb-1">{c.fixedExpense.name}</div>
            <div className="text-sm text-gray-400 mb-1">
              기존 <span className="text-white">{c.fixedExpense.amount.toLocaleString()}원</span>
              {' → '}
              새 거래 <span className="text-white">{c.transaction.amount.toLocaleString()}원</span>
              <span className={`ml-2 ${c.amountDiff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                ({c.amountDiff > 0 ? '+' : ''}{c.amountDiff.toLocaleString()}원)
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {c.transaction.date} · {c.transaction.original_memo}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleConfirm(c)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg"
              >
                맞아요 — 금액 갱신
              </button>
              <button
                onClick={() => dismiss(c)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm py-2 rounded-lg"
              >
                아니요
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
