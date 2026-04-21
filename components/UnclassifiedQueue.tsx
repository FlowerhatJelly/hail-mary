'use client'
import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Transaction, Category } from '@/types'

interface Props {
  onClose: () => void
  onDone: () => void
}

export function UnclassifiedQueue({ onClose, onDone }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/transactions?unclassified=true').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([txs, cats]) => {
      setTransactions(txs)
      setCategories(cats)
    })
  }, [])

  async function onDragEnd(result: DropResult) {
    if (!result.destination || result.destination.droppableId === 'unclassified') return

    const txId = result.draggableId
    const categoryId = result.destination.droppableId
    const tx = transactions.find(t => t.id === txId)
    if (!tx) return

    setTransactions(prev => prev.filter(t => t.id !== txId))

    await Promise.all([
      fetch(`/api/transactions/${txId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId }),
      }),
      fetch('/api/category-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId, keyword: tx.original_memo }),
      }),
    ])
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-5xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-lg font-bold">미분류 항목 정리</h2>
          <div className="flex gap-2">
            <span className="text-gray-500 text-sm">{transactions.length}건 남음</span>
            <button onClick={() => { onDone(); onClose() }} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg">완료</button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-4">왼쪽 항목을 오른쪽 카테고리로 드래그하세요.</p>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 flex-1 overflow-hidden">
            <Droppable droppableId="unclassified">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-64 bg-gray-800 rounded-xl p-3 overflow-y-auto shrink-0"
                >
                  <h3 className="text-gray-400 text-xs font-medium mb-2">미분류</h3>
                  {transactions.length === 0 && (
                    <p className="text-gray-600 text-xs text-center py-4">모두 분류됨 🎉</p>
                  )}
                  {transactions.map((t, i) => (
                    <Draggable key={t.id} draggableId={t.id} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-gray-700 rounded-lg px-3 py-2 mb-1 text-sm cursor-grab select-none
                            ${snapshot.isDragging ? 'ring-2 ring-indigo-500 shadow-lg' : ''}`}
                        >
                          <div className="text-white truncate">{t.original_memo}</div>
                          <div className="text-gray-400 text-xs">{t.amount.toLocaleString()}원 · {t.date}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            <div className="flex-1 grid grid-cols-3 gap-2 overflow-y-auto content-start">
              {categories.map(cat => (
                <Droppable key={cat.id} droppableId={cat.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rounded-xl p-3 min-h-16 transition-opacity ${snapshot.isDraggingOver ? 'opacity-100' : 'opacity-70'}`}
                      style={{ backgroundColor: cat.color + '1a', border: `1px solid ${cat.color}55` }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-white text-xs font-medium">{cat.name}</span>
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
