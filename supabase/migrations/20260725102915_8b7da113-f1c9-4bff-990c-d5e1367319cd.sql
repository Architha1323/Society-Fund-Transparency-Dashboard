
-- Role infrastructure
CREATE TYPE public.app_role AS ENUM ('treasurer', 'member');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-assign roles on signup: first user becomes treasurer, others become members
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'treasurer') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'treasurer');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Replace permissive policies on financial/resident tables
DROP POLICY IF EXISTS "auth read activities" ON public.activities;
DROP POLICY IF EXISTS "auth write activities" ON public.activities;
CREATE POLICY "treasurers read activities" ON public.activities
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'treasurer'));
CREATE POLICY "treasurers write activities" ON public.activities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'treasurer'))
  WITH CHECK (public.has_role(auth.uid(), 'treasurer'));

DROP POLICY IF EXISTS "auth read expenses" ON public.expenses;
DROP POLICY IF EXISTS "auth write expenses" ON public.expenses;
CREATE POLICY "treasurers read expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'treasurer'));
CREATE POLICY "treasurers write expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'treasurer'))
  WITH CHECK (public.has_role(auth.uid(), 'treasurer'));

DROP POLICY IF EXISTS "auth read incomes" ON public.incomes;
DROP POLICY IF EXISTS "auth write incomes" ON public.incomes;
CREATE POLICY "treasurers read incomes" ON public.incomes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'treasurer'));
CREATE POLICY "treasurers write incomes" ON public.incomes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'treasurer'))
  WITH CHECK (public.has_role(auth.uid(), 'treasurer'));

DROP POLICY IF EXISTS "auth read residents" ON public.residents;
DROP POLICY IF EXISTS "auth write residents" ON public.residents;
CREATE POLICY "treasurers read residents" ON public.residents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'treasurer'));
CREATE POLICY "treasurers write residents" ON public.residents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'treasurer'))
  WITH CHECK (public.has_role(auth.uid(), 'treasurer'));
