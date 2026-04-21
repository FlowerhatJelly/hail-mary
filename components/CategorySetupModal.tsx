'use client'
import { useState } from 'react'

interface SuggestedCategory {
  name: string
  color: string
  keywords: string[]
}

interface Props {
  onClose: () => void
  onSetupComplete: () => void
}

export function CategorySetupModal({ onClose, onSetupComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [suggested, setSuggested] = useState<SuggestedCategory[]>([])
  const [step, setStep] = useState<'idle' | 'reviewing' | 'saving'>('idle')

  async function handleSuggest() {
    setLoading(true)
    const res = await fetch('/api/categories/suggest', { method: 'POST' })
    const data = await res.json()
    setSuggested(data.categories ?? [])
    setStep('reviewing')
    setLoading(false)
  }

  async function handleApprove() {
    setStep('saving')
    for (let i = 0; i < suggested.length; i++) {
      const cat = suggested[i]
      const catRes = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cat.name, color: cat.color, sort_order: i }),
      })
      const { id } = await catRes.json()

      for (const keyword of cat.keywords) {
        await fetch('/api/category-keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_id: id, keyword }),
        })
      }
    }
    await fetch('/api/categories/classify', { method: 'POST' })
    onSetupComplete()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={step === 'idle' ? onClose : undefined}>
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">카테고리 설정</h2>
          {step === 'idle' && <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>}
        </div>

        {step === 'idle' && (
          <>
            <p className="text-gray-400 text-sm mb-6">
              Claude가 업로드된 거래 내역을 분석해서 카테고리 구조를 추천해드립니다.
              거래 내역이 없으면 기본 카테고리를 제안합니다.
            </p>
            <button
              onClick={handleSuggest}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-3 text-sm disabled:opacity-50"
            >
              {loading ? '분석 중...' : 'Claude에게 카테고리 추천 받기'}
            </button>
          </>
        )}

        {step === 'reviewing' && (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {suggested.map((cat, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-3 flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: cat.color }} />
                  <div>
                    <div className="text-white font-medium text-sm">{cat.name}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{cat.keywords.join(', ')}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('idle')} className="flex-1 py-2 text-sm text-gray-400 hover:text-white">다시 추천</button>
              <button onClick={handleApprove} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm">
                이 구조로 시작
              </button>
            </div>
          </>
        )}

        {step === 'saving' && (
          <div className="text-center text-gray-400 py-8 text-sm">저장 중...</div>
        )}
      </div>
    </div>
  )
}
