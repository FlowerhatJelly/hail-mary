'use client'
import { useState, useCallback } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { CalendarPanel } from '@/components/CalendarPanel'
import { ListPanel } from '@/components/ListPanel'
import { ClaudeChat } from '@/components/ClaudeChat'
import { AccountSetupModal } from '@/components/AccountSetupModal'
import { CsvUploadModal } from '@/components/CsvUploadModal'
import { FixedExpenseModal } from '@/components/FixedExpenseModal'
import { CategorySetupModal } from '@/components/CategorySetupModal'
import { UnclassifiedQueue } from '@/components/UnclassifiedQueue'
import { ChangeDetectionModal } from '@/components/ChangeDetectionModal'
import { ChangeCandidate } from '@/lib/change-detector'

type Modal = 'account' | 'csv' | 'fixed' | 'category' | 'unclassified' | null

export default function Dashboard() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [modal, setModal] = useState<Modal>(null)
  const [changeCandidates, setChangeCandidates] = useState<ChangeCandidate[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  function handleImported(candidates: ChangeCandidate[]) {
    setModal(null)
    refresh()
    if (candidates.length > 0) {
      setChangeCandidates(candidates)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="px-6 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold text-white">Hail Mary</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setModal('account')}
            className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
          >
            계좌 추가
          </button>
          <button
            onClick={() => setModal('csv')}
            className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
          >
            CSV 업로드
          </button>
          <button
            onClick={() => setModal('fixed')}
            className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
          >
            고정지출 추가
          </button>
          <button
            onClick={() => setModal('category')}
            className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
          >
            카테고리 설정
          </button>
          <button
            onClick={() => setModal('unclassified')}
            className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
          >
            미분류 정리
          </button>
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-600 hover:text-gray-400 px-2 py-1.5 transition"
          >
            {session?.user?.name ?? '로그아웃'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <CalendarPanel
          key={refreshKey}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />
        <ListPanel
          key={`list-${refreshKey}`}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onDataChange={refresh}
        />
      </div>

      <ClaudeChat
        context={{ currentMonth }}
        placeholder="이번 달 지출, 통장 구조, 재무 관리 등 무엇이든 물어보세요..."
      />

      {modal === 'account' && (
        <AccountSetupModal onClose={() => setModal(null)} onSaved={refresh} />
      )}
      {modal === 'csv' && (
        <CsvUploadModal onClose={() => setModal(null)} onImported={handleImported} />
      )}
      {modal === 'fixed' && (
        <FixedExpenseModal onClose={() => setModal(null)} onSaved={refresh} />
      )}
      {modal === 'category' && (
        <CategorySetupModal onClose={() => setModal(null)} onSetupComplete={refresh} />
      )}
      {modal === 'unclassified' && (
        <UnclassifiedQueue onClose={() => setModal(null)} onDone={refresh} />
      )}
      {changeCandidates.length > 0 && (
        <ChangeDetectionModal
          candidates={changeCandidates}
          onDone={() => { setChangeCandidates([]); refresh() }}
        />
      )}
    </div>
  )
}
