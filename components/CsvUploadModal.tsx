'use client'
import { useState, useEffect } from 'react'
import { Account } from '@/types'

interface ChangeCandidate {
  transaction: { id: string; date: string; amount: number; original_memo: string }
  fixedExpense: { id: string; name: string; amount: number }
  amountDiff: number
}

interface Props {
  onClose: () => void
  onImported: (candidates: ChangeCandidate[]) => void
}

export function CsvUploadModal({ onClose, onImported }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts)
  }, [])

  async function handleUpload() {
    if (!file || !selectedAccountId) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('accountId', selectedAccountId)
    const res = await fetch('/api/import', { method: 'POST', body: fd })
    const data = await res.json()
    setResult({ imported: data.imported, skipped: data.skipped })
    setLoading(false)
    onImported(data.changeCandidates ?? [])
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-white text-lg font-bold mb-4">토스 CSV 업로드</h2>

        <label className="block text-gray-400 text-sm mb-1">계좌 선택</label>
        <select
          value={selectedAccountId}
          onChange={e => setSelectedAccountId(e.target.value)}
          className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mb-4 text-sm"
        >
          <option value="">선택하세요</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.owner === 'husband' ? '남편' : '와이프'})
            </option>
          ))}
        </select>

        <label className="block text-gray-400 text-sm mb-1">CSV 파일</label>
        <input
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-gray-300 text-sm mb-4"
        />

        {result && (
          <p className="text-green-400 text-sm mb-4">
            {result.imported}건 등록, {result.skipped}건 중복 스킵
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm">
            {result ? '닫기' : '취소'}
          </button>
          {!result && (
            <button
              onClick={handleUpload}
              disabled={!file || !selectedAccountId || loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? '업로드 중...' : '업로드'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
