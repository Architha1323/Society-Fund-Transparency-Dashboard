-- Add missing columns to incomes
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS income_source text;
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS late_fee numeric(10,2) default 0;
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS remarks text;

-- Add missing columns to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS vendor_contact text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS invoice_no text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS budgeted numeric(12,2);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS approved_by text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS remarks text;

-- Add missing columns to residents
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS tower text;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS owner_type text default 'Owner';
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS avatar_hue int default 220;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS monthly_maintenance numeric(10,2) default 4500;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS payment_history jsonb default '[]'::jsonb;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS join_date date default current_date;

-- Ensure tower has a default value for existing rows before making it NOT NULL (optional, but good practice if making NOT NULL later)
UPDATE public.residents SET tower = 'A' WHERE tower IS NULL;
