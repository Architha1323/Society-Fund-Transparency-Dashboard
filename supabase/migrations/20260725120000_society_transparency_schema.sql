create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'resident',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.societies (
  id uuid primary key default gen_random_uuid(),
  name text,
  registration_number text,
  address text,
  financial_year text default 'FY 2026-27',
  maintenance_amount numeric(10,2) default 4500,
  reserve_percentage numeric(5,2) default 35,
  emergency_percentage numeric(5,2) default 15,
  theme text default 'dark',
  notification_settings jsonb default '{"email": true, "push": true}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.residents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  flat_number text not null unique,
  tower text not null,
  owner_type text not null default 'Owner',
  avatar_hue int not null default 220,
  contact text,
  email text,
  monthly_maintenance numeric(10,2) not null default 4500,
  occupancy_status text default 'Occupied',
  maintenance_status text default 'Current',
  due_amount numeric(10,2) default 0,
  payment_history jsonb default '[]'::jsonb,
  last_payment timestamptz,
  join_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references public.residents(id) on delete set null,
  flat_number text not null,
  resident_name text not null,
  income_source text,
  amount numeric(10,2) not null,
  mode text not null default 'UPI',
  txn_id text,
  late_fee numeric(10,2) default 0,
  remarks text,
  status text not null default 'Paid',
  note text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  vendor text not null,
  vendor_contact text,
  invoice_no text,
  invoice_url text,
  amount numeric(12,2) not null,
  mode text default 'Bank Transfer',
  budgeted numeric(12,2),
  approved_by text,
  remarks text,
  note text,
  spent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null,
  amount numeric(12,2) not null,
  reference_id uuid,
  remarks text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  range text not null,
  generated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  message text not null,
  type text not null,
  read boolean default false,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.income_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  actor text not null,
  description text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_incomes_paid_at on public.incomes(paid_at desc);
create index if not exists idx_expenses_spent_at on public.expenses(spent_at desc);
create index if not exists idx_residents_flat on public.residents(flat_number);
create index if not exists idx_notifications_read on public.notifications(read, created_at desc);
create index if not exists idx_reports_generated_at on public.reports(generated_at desc);

alter table public.profiles enable row level security;
alter table public.societies enable row level security;
alter table public.residents enable row level security;
alter table public.incomes enable row level security;
alter table public.expenses enable row level security;
alter table public.transactions enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.expense_categories enable row level security;
alter table public.income_categories enable row level security;
alter table public.activities enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles write own" on public.profiles;
create policy "profiles write own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "auth read society" on public.societies;
create policy "auth read society" on public.societies for select using (auth.role() = 'authenticated');
drop policy if exists "auth write society" on public.societies;
create policy "auth write society" on public.societies for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth read residents" on public.residents;
create policy "auth read residents" on public.residents for select using (auth.role() = 'authenticated');
drop policy if exists "auth write residents" on public.residents;
create policy "auth write residents" on public.residents for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth read incomes" on public.incomes;
create policy "auth read incomes" on public.incomes for select using (auth.role() = 'authenticated');
drop policy if exists "auth write incomes" on public.incomes;
create policy "auth write incomes" on public.incomes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth read expenses" on public.expenses;
create policy "auth read expenses" on public.expenses for select using (auth.role() = 'authenticated');
drop policy if exists "auth write expenses" on public.expenses;
create policy "auth write expenses" on public.expenses for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth read transactions" on public.transactions;
create policy "auth read transactions" on public.transactions for select using (auth.role() = 'authenticated');
drop policy if exists "auth write transactions" on public.transactions;
create policy "auth write transactions" on public.transactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth read reports" on public.reports;
create policy "auth read reports" on public.reports for select using (auth.role() = 'authenticated');
drop policy if exists "auth write reports" on public.reports;
create policy "auth write reports" on public.reports for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth read audit_logs" on public.audit_logs;
create policy "auth read audit_logs" on public.audit_logs for select using (auth.role() = 'authenticated');
drop policy if exists "auth write audit_logs" on public.audit_logs;
create policy "auth write audit_logs" on public.audit_logs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth read notifications" on public.notifications;
create policy "auth read notifications" on public.notifications for select using (auth.role() = 'authenticated');
drop policy if exists "auth write notifications" on public.notifications;
create policy "auth write notifications" on public.notifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth read categories" on public.expense_categories;
create policy "auth read categories" on public.expense_categories for select using (auth.role() = 'authenticated');
drop policy if exists "auth write categories" on public.expense_categories;
create policy "auth write categories" on public.expense_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth read income_categories" on public.income_categories;
create policy "auth read income_categories" on public.income_categories for select using (auth.role() = 'authenticated');
drop policy if exists "auth write income_categories" on public.income_categories;
create policy "auth write income_categories" on public.income_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth read activities" on public.activities;
create policy "auth read activities" on public.activities for select using (auth.role() = 'authenticated');
drop policy if exists "auth write activities" on public.activities;
create policy "auth write activities" on public.activities for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'incomes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incomes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'expenses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'residents') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.residents;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activities') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
