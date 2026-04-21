-- accounts: 계좌/카드 목록
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner text not null check (owner in ('husband', 'wife')),
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

-- categories: 지출 카테고리
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#94a3b8',
  sort_order integer not null default 0
);

-- category_keywords: 자동 분류 키워드
create table if not exists category_keywords (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  keyword text not null unique
);

-- transactions: 실제 거래 내역 (CSV import)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  date date not null,
  amount integer not null,
  original_memo text not null default '',
  custom_memo text,
  category_id uuid references categories(id) on delete set null,
  type text not null default 'actual' check (type in ('actual', 'planned')),
  toss_hash text unique,
  created_at timestamptz default now()
);

-- fixed_expenses: 고정지출/할부/대출
create table if not exists fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  name text not null,
  amount integer not null,
  day_of_month integer not null check (day_of_month between 1 and 31),
  recurrence text not null default 'monthly' check (recurrence in ('monthly', 'yearly', 'once')),
  start_date date not null,
  duration_months integer,
  interest_rate numeric(5,2),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- fixed_expense_history: 금액 변경 이력
create table if not exists fixed_expense_history (
  id uuid primary key default gen_random_uuid(),
  fixed_expense_id uuid references fixed_expenses(id) on delete cascade,
  previous_amount integer not null,
  new_amount integer not null,
  changed_at timestamptz default now(),
  linked_transaction_id uuid references transactions(id) on delete set null
);

-- RLS 비활성화 (서비스 롤 키로 접근)
alter table accounts disable row level security;
alter table categories disable row level security;
alter table category_keywords disable row level security;
alter table transactions disable row level security;
alter table fixed_expenses disable row level security;
alter table fixed_expense_history disable row level security;
