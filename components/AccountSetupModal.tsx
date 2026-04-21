'use client'
import { useState } from 'react'
import { Owner } from '@/types'

const COLORS = ['#6366f1', '#f97316', '#22c55e', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6']

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function AccountSetupModal({ onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [owner, setOwner] = useState<Owner>('husband')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), owner, color }),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-white text-lg font-bold mb-4">계좌/카드 추가</h2>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="예: 카카오뱅크, 신한카드..."
          className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mb-3 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="flex gap-2 mb-3">
          {(['husband', 'wife'] as Owner[]).map(o => (
            <button
              key={o}
              onClick={() => setOwner(o)}
              className={`flex-1 py-2 rounded-lg text-sm transition ${owner === o ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {o === 'husband' ? '남편' : '와이프'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm">취소</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
