export type Owner = 'husband' | 'wife'
export type Recurrence = 'monthly' | 'yearly' | 'once'
export type TransactionType = 'actual' | 'planned'

export interface Account {
  id: string
  name: string
  owner: Owner
  color: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  color: string
  sort_order: number
}

export interface CategoryKeyword {
  id: string
  category_id: string
  keyword: string
}

export interface Transaction {
  id: string
  account_id: string
  date: string
  amount: number
  original_memo: string
  custom_memo: string | null
  category_id: string | null
  type: TransactionType
  toss_hash: string | null
  created_at: string
  account?: Account
  category?: Category
}

export interface FixedExpense {
  id: string
  account_id: string
  name: string
  amount: number
  day_of_month: number
  recurrence: Recurrence
  start_date: string
  duration_months: number | null
  interest_rate: number | null
  is_active: boolean
  created_at: string
  remaining_months?: number
  account?: Account
}

export interface FixedExpenseHistory {
  id: string
  fixed_expense_id: string
  previous_amount: number
  new_amount: number
  changed_at: string
  linked_transaction_id: string | null
}

export interface CalendarEntry {
  id: string
  date: string
  amount: number
  original_memo: string
  type: TransactionType
  account?: Account
  category?: Category
}
