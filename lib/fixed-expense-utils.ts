import { FixedExpense } from '@/types'

export function getRemainingMonths(expense: FixedExpense): number | null {
  if (!expense.duration_months) return null
  const start = new Date(expense.start_date)
  const now = new Date()
  const elapsed =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  return Math.max(0, expense.duration_months - elapsed)
}

export function getEndDate(expense: FixedExpense): string | null {
  if (!expense.duration_months) return null
  const end = new Date(expense.start_date)
  end.setMonth(end.getMonth() + expense.duration_months)
  return end.toISOString().substring(0, 10)
}

export function isActiveInMonth(expense: FixedExpense, yearMonth: string): boolean {
  if (!expense.is_active) return false
  const [year, month] = yearMonth.split('-').map(Number)
  const targetDate = new Date(year, month - 1, expense.day_of_month)
  const start = new Date(expense.start_date)

  if (targetDate < start) return false
  if (!expense.duration_months) return true

  const end = new Date(expense.start_date)
  end.setMonth(end.getMonth() + expense.duration_months)
  return targetDate <= end
}
