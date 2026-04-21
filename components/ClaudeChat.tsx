'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  context?: Record<string, unknown>
  placeholder?: string
}

export function ClaudeChat({ context, placeholder = '재무 관련 질문을 해보세요...' }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: next, context }),
    })
    const data = await res.json()
    setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-xl text-white text-xl transition"
        title="Claude에게 물어보기"
      >
        💬
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-gray-900 rounded-2xl shadow-2xl flex flex-col border border-gray-700 z-40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-white font-semibold text-sm">Claude</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-10">{placeholder}</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed
                ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'}`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-xl px-3 py-2 text-gray-500 text-sm">생각 중...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-700 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="메시지 입력..."
          className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-40 transition"
        >
          전송
        </button>
      </div>
    </div>
  )
}
