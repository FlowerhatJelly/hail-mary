'use client'
import { useEffect, useState } from 'react'
import { Transaction, Category } from '@/types'

interface Props {
  currentMonth: string
  selectedDate: string | null
  onDataChange?: () => void
}

export function ListPanel({ currentMonth, selectedDate, onDataChange }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMemo, setEditMemo] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')

  useEffect(() => {
    fetch(`/api/transactions?month=${currentMonth}`).then(r => r.json()).then(setTransactions)
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [currentMonth])

  const filtered = transactions.filter(t => {
    const matchDate = !selectedDate || t.date === selectedDate
    const matchSearch = !search ||
      t.original_memo.toLowerCase().includes(search.toLowerCase()) ||
      (t.custom_memo ?? '').toLowerCase().includes(search.toLowerCase())
    return matchDate && matchSearch
  })

  const total = filtered.reduce((sum, t) => sum + t.amount, 0)
  const husbandTotal = filtered.filter(t => t.account?.owner === 'husband').reduce((sum, t) => sum + t.amount, 0)
  const wifeTotal = filtered.filter(t => t.account?.owner === 'wife').reduce((sum, t) => sum + t.amount, 0)

  function openEdit(t: Transaction) {
    setEditingId(t.id)
    setEditMemo(t.custom_memo ?? '')
    setEditCategoryId(t.category_id ?? '')
  }

  async function saveEdit(id: string) {
    const updated = await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_memo: editMemo || null, category_id: editCategoryId || null }),
    }).then(r => r.json())
    setTransactions(prev => prev.map(t => t.id === id ? updated : t))
    setEditingId(null)
    onDataChange?.()
  }

  function fmt(n: number) {
    return n.toLocaleString('ko-KR') + '원'
  }

  return (
    <div className="flex-1 flex flex-col p-4 min-w-0 overflow-hidden">
      <div className="flex gap-2 mb-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="검색..."
          className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-6 mb-3 text-sm">
        <span className="text-gray-400">전체 <span className="text-white font-semibold">{fmt(total)}</span></span>
        <span className="text-indigo-400">남편 {fmt(husbandTotal)}</span>
        <span className="text-pink-400">와이프 {fmt(wifeTotal)}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-12">내역이 없습니다</p>
        )}
        {filtered.map(t => (
          <div
            key={t.id}
            onClick={() => openEdit(t)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 cursor-pointer group"
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: t.account?.color ?? '#6366f1', opacity: t.type === 'planned' ? 0.4 : 1 }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm truncate">
                {t.custom_memo || t.original_memo}
              </div>
              {t.custom_memo && (
                <div className="text-gray-600 text-xs truncate">{t.original_memo}</div>
              )}
            </div>
            {t.category && (
              <span
                className="text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: t.category.color + '22', color: t.category.color }}
              >
                {t.category.name}
              </span>
            )}
            <div className="text-right shrink-0">
              <div className="text-white text-sm font-medium">{fmt(t.amount)}</div>
              <div className="text-gray-600 text-xs">{t.date.substring(5)}</div>
            </div>
          </div>
        ))}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={() => setEditingId(null)}>
          <div className="bg-gray-900 rounded-t-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-3">내역 수정</h3>
            <p className="text-gray-500 text-xs mb-2">
              원본: {transactions.find(t => t.id === editingId)?.original_memo}
            </p>
            <input
              value={editMemo}
              onChange={e => setEditMemo(e.target.value)}
              placeholder="메모 (직접 입력)"
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mb-3 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={editCategoryId}
              onChange={e => setEditCategoryId(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mb-4 text-sm"
            >
              <option value="">카테고리 없음</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">취소</button>
              <button onClick={() => saveEdit(editingId)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
