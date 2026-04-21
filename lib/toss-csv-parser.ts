import crypto from 'crypto'

export interface TossRow {
  date: string
  amount: number
  memo: string
}

function normalizeDate(raw: string): string {
  // "2024.01.15" → "2024-01-15", "2024-01-15 10:30:00" → "2024-01-15"
  return raw.replace(/\./g, '-').substring(0, 10)
}

function parseAmount(raw: string): number {
  return parseInt(raw.replace(/,/g, '').replace(/\s/g, '') || '0', 10)
}

export function parseTossCsv(csvText: string): TossRow[] {
  // BOM 제거
  const text = csvText.replace(/^﻿/, '')
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const rows: TossRow[] = []

  // 토스 CSV 컬럼 감지 (날짜, 내용/거래처, 출금액, 입금액)
  const dateIdx = header.findIndex(h => h.includes('날짜') || h.includes('일시') || h.includes('거래일'))
  const memoIdx = header.findIndex(h => h.includes('내용') || h.includes('거래처') || h.includes('적요'))
  const outIdx = header.findIndex(h => h.includes('출금') || h.includes('지출'))
  const inIdx = header.findIndex(h => h.includes('입금') || h.includes('수입'))

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // CSV 파싱 (따옴표 처리)
    const cols: string[] = []
    let cur = ''
    let inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { cols.push(cur); cur = '' }
      else { cur += ch }
    }
    cols.push(cur)

    const clean = (idx: number) => (cols[idx] ?? '').trim().replace(/^"|"$/g, '')

    const dateRaw = dateIdx >= 0 ? clean(dateIdx) : clean(0)
    const memo = memoIdx >= 0 ? clean(memoIdx) : clean(1)
    const outAmt = outIdx >= 0 ? parseAmount(clean(outIdx)) : parseAmount(clean(2))
    const inAmt = inIdx >= 0 ? parseAmount(clean(inIdx)) : parseAmount(clean(3))

    const date = normalizeDate(dateRaw)
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) continue

    const amount = outAmt > 0 ? outAmt : -inAmt
    if (amount === 0) continue

    rows.push({ date, amount, memo })
  }

  return rows
}

export function hashTransaction(date: string, amount: number, memo: string): string {
  return crypto.createHash('md5').update(`${date}|${amount}|${memo}`).digest('hex')
}
