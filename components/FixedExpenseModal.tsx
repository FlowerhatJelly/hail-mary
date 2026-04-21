'use client'
import { useState, useEffect } from 'react'
import { Account } from '@/types'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function FixedExpenseModal({ onClose, onSaved }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    day_of_month: '25',
    recurrence: 'monthly',
    start_date: '',
    duration_months: '',
    interest_rate: '',
    account_id: '',
  })

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts)
  }, [])

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name || !form.amount || !form.start_date || !form.account_id) return
    setSaving(true)
    await fetch('/api/fixed-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        amount: parseInt(form.amount.replace(/,/g, ''), 10),
        day_of_month: parseInt(form.day_of_month, 10),
        recurrence: form.recurrence,
        start_date: form.start_date,
        duration_months: form.duration_months ? parseInt(form.duration_months, 10) : null,
        interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
        account_id: form.account_id,
      }),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-white text-lg font-bold mb-4">고정지출/할부 추가</h2>

        <label className="block text-gray-400 text-sm mb-1">항목명</label>
        <input value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="주담대, 넷플릭스, 보험..." className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mb-3 text-sm outline-none focus:ring-1 focus:ring-indigo-500" />

        <label className="block text-gray-400 text-sm mb-1">금액 (원)</label>
        <input value={form.amount} onChange={e => set('amount', e.target.value)}
          type="number" placeholder="1500000" className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mb-3 text-sm outline-none focus:ring-1 focus:ring-indigo-500" />

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-gray-400 text-sm mb-1">매월 출금일</label>
            <input value={form.day_of_month} onChange={e => set('day_of_month', e.target.value)}
              type="number" min={1} max={31} className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-gray-400 text-sm mb-1">반복</label>
            <select value={form.recurrence} onChange={e => set('recurrence', e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm">
              <option value="monthly">매월</option>
              <option value="yearly">매년</option>
              <option value="once">1회</option>
            </select>
          </div>
        </div>

        <label className="block text-gray-400 text-sm mb-1">시작일 (구매일/대출 시작일)</label>
        <input value={form.start_date} onChange={e => set('start_date', e.target.value)}
          type="date" className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mb-3 text-sm outline-none" />

        <label className="block text-gray-400 text-sm mb-1">총 개월수 (할부/대출, 빈칸=무기한)</label>
        <input value={form.duration_months} onChange={e => set('duration_months', e.target.value)}
          type="number" placeholder="360 (30년)" className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mb-3 text-sm outline-none" />

        <label className="block text-gray-400 text-sm mb-1">이율 % (선택)</label>
        <input value={form.interest_rate} onChange={e => set('interest_rate', e.target.value)}
          type="number" step="0.01" placeholder="3.5" className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mb-3 text-sm outline-none" />

        <label className="block text-gray-400 text-sm mb-1">계좌</label>
        <select value={form.account_id} onChange={e => set('account_id', e.target.value)}
          className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mb-5 text-sm">
          <option value="">선택하세요</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.owner === 'husband' ? '남편' : '와이프'})</option>
          ))}
        </select>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm">취소</button>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.amount || !form.start_date || !form.account_id || saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
