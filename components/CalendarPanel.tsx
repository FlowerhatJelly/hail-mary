'use client'
import { useEffect, useState } from 'react'
import { CalendarEntry } from '@/types'

interface Props {
  currentMonth: string
  onMonthChange: (month: string) => void
  onDateSelect: (date: string | null) => void
  selectedDate: string | null
}

export function CalendarPanel({ currentMonth, onMonthChange, onDateSelect, selectedDate }: Props) {
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [year, month] = currentMonth.split('-').map(Number)

  useEffect(() => {
    fetch(`/api/calendar/${currentMonth}`)
      .then(r => r.json())
      .then(d => setEntries([...(d.transactions ?? []), ...(d.planned ?? [])]))
  }, [currentMonth])

  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  function nextMonth() {
    const d = new Date(year, month, 1)
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const byDate = entries.reduce((acc, e) => {
    const day = e.date.substring(8, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(e)
    return acc
  }, {} as Record<string, CalendarEntry[]>)

  const blanks = Array.from({ length: firstDay }, (_, i) => i)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const today = new Date().toISOString().substring(0, 10)

  return (
    <div className="w-96 border-r border-gray-800 p-4 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800">◀</button>
        <span className="text-white font-semibold">{year}년 {month}월</span>
        <button onClick={nextMonth} className="text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map(i => <div key={`b${i}`} />)}
        {days.map(day => {
          const key = String(day).padStart(2, '0')
          const dateStr = `${currentMonth}-${key}`
          const dayEntries = byDate[key] ?? []
          const isSelected = selectedDate === dateStr
          const isToday = today === dateStr

          return (
            <button
              key={day}
              onClick={() => onDateSelect(isSelected ? null : dateStr)}
              className={`aspect-square flex flex-col items-center justify-start p-1 rounded-lg text-xs transition
                ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-300'}
                ${isToday && !isSelected ? 'ring-1 ring-indigo-500' : ''}
              `}
            >
              <span>{day}</span>
              {dayEntries.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayEntries.slice(0, 3).map((e, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${e.type === 'planned' ? 'opacity-40' : ''}`}
                      style={{ backgroundColor: e.account?.color ?? '#6366f1' }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
