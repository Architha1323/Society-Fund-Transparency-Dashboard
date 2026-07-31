
-- RESIDENTS
CREATE TABLE public.residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  flat_number TEXT NOT NULL UNIQUE,
  tower TEXT NOT NULL,
  owner_type TEXT NOT NULL DEFAULT 'Owner',
  avatar_hue INT NOT NULL DEFAULT 220,
  contact TEXT,
  monthly_maintenance NUMERIC(10,2) NOT NULL DEFAULT 4500,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.residents TO authenticated;
GRANT ALL ON public.residents TO service_role;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read residents" ON public.residents FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write residents" ON public.residents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- INCOMES
CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
  flat_number TEXT NOT NULL,
  resident_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  mode TEXT NOT NULL DEFAULT 'UPI',
  txn_id TEXT,
  status TEXT NOT NULL DEFAULT 'Paid',
  note TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incomes TO authenticated;
GRANT ALL ON public.incomes TO service_role;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read incomes" ON public.incomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write incomes" ON public.incomes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EXPENSES
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  vendor TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  invoice_no TEXT,
  budgeted NUMERIC(12,2),
  spent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write expenses" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ACTIVITIES
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  actor TEXT NOT NULL,
  description TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write activities" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.incomes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.residents;

-- SEED RESIDENTS (Green Valley Residency, 24 sample flats across 4 towers)
INSERT INTO public.residents (name, flat_number, tower, owner_type, avatar_hue, contact, monthly_maintenance, join_date) VALUES
('Arjun Sharma','A-101','Tower A','Owner',210,'+91 98200 11201',4500,'2021-04-01'),
('Priya Iyer','A-102','Tower A','Owner',280,'+91 98200 11202',4500,'2020-06-15'),
('Rahul Verma','A-201','Tower A','Owner',150,'+91 98200 11203',4500,'2022-01-10'),
('Neha Kulkarni','A-202','Tower A','Tenant',330,'+91 98200 11204',4500,'2023-03-05'),
('Vikram Menon','A-301','Tower A','Owner',180,'+91 98200 11205',5200,'2019-11-20'),
('Anjali Rao','A-302','Tower A','Owner',20,'+91 98200 11206',5200,'2020-02-14'),
('Suresh Patel','B-101','Tower B','Owner',260,'+91 98200 11207',4500,'2018-08-01'),
('Kavya Reddy','B-102','Tower B','Owner',300,'+91 98200 11208',4500,'2021-09-19'),
('Rohan Deshmukh','B-201','Tower B','Tenant',60,'+91 98200 11209',4500,'2024-01-11'),
('Sneha Kapoor','B-202','Tower B','Owner',350,'+91 98200 11210',4500,'2019-05-22'),
('Aditya Joshi','B-301','Tower B','Owner',190,'+91 98200 11211',5200,'2020-07-30'),
('Meera Nair','B-302','Tower B','Owner',130,'+91 98200 11212',5200,'2022-04-08'),
('Karan Malhotra','C-101','Tower C','Owner',240,'+91 98200 11213',4500,'2021-12-01'),
('Divya Bhatt','C-102','Tower C','Tenant',40,'+91 98200 11214',4500,'2023-06-17'),
('Manish Gupta','C-201','Tower C','Owner',200,'+91 98200 11215',4500,'2019-03-25'),
('Pooja Mishra','C-202','Tower C','Owner',310,'+91 98200 11216',4500,'2020-10-12'),
('Sanjay Chatterjee','C-301','Tower C','Owner',170,'+91 98200 11217',5200,'2018-02-18'),
('Ritu Agarwal','C-302','Tower C','Owner',80,'+91 98200 11218',5200,'2021-08-04'),
('Aakash Pillai','D-101','Tower D','Owner',220,'+91 98200 11219',4500,'2022-11-23'),
('Isha Saxena','D-102','Tower D','Owner',290,'+91 98200 11220',4500,'2023-02-09'),
('Nikhil Shetty','D-201','Tower D','Tenant',100,'+91 98200 11221',4500,'2024-05-28'),
('Sakshi Bansal','D-202','Tower D','Owner',340,'+91 98200 11222',4500,'2020-09-14'),
('Harsh Trivedi','D-301','Tower D','Owner',160,'+91 98200 11223',5200,'2019-07-06'),
('Tanvi Choudhary','D-302','Tower D','Owner',10,'+91 98200 11224',5200,'2021-01-30');

-- SEED INCOMES: last 6 months of maintenance payments for most residents
INSERT INTO public.incomes (resident_id, flat_number, resident_name, amount, mode, txn_id, status, note, paid_at)
SELECT r.id, r.flat_number, r.name, r.monthly_maintenance,
  (ARRAY['UPI','Bank Transfer','Cash','Cheque','UPI','UPI'])[1 + (abs(hashtext(r.flat_number || m::text)) % 6)],
  'TXN' || upper(substr(md5(r.flat_number || m::text), 1, 10)),
  CASE WHEN (abs(hashtext(r.flat_number || m::text)) % 10) < 8 THEN 'Paid'
       WHEN (abs(hashtext(r.flat_number || m::text)) % 10) < 9 THEN 'Pending'
       ELSE 'Overdue' END,
  'Monthly maintenance',
  (date_trunc('month', now()) - (m || ' months')::interval + ((abs(hashtext(r.flat_number || m::text)) % 20) || ' days')::interval + '4 hours'::interval)
FROM public.residents r
CROSS JOIN generate_series(0,5) m
WHERE (abs(hashtext(r.flat_number || m::text)) % 10) < 9;

-- A few one-off incomes (interest, parking, hall booking)
INSERT INTO public.incomes (flat_number, resident_name, amount, mode, txn_id, status, note, paid_at) VALUES
('—','Bank Interest',3240,'Bank Transfer','INT-Q3-2026','Paid','Quarterly savings interest', now() - interval '12 days'),
('A-102','Priya Iyer',2000,'UPI','TXNHALL9821','Paid','Community hall booking', now() - interval '8 days'),
('C-201','Manish Gupta',1500,'Cash','—','Paid','Guest parking (weekly)', now() - interval '3 days'),
('D-202','Sakshi Bansal',2000,'UPI','TXNHALL7712','Paid','Community hall booking', now() - interval '20 days');

-- SEED EXPENSES (last 6 months, realistic society vendors + amounts INR)
INSERT INTO public.expenses (category, vendor, amount, note, invoice_no, budgeted, spent_at) VALUES
('Security','SecureGuard Services Pvt Ltd',68000,'6 guards - Nov shift','SG-2611',72000, now() - interval '4 days'),
('Housekeeping','CleanNest Facility',42000,'Common area cleaning','CN-1120',45000, now() - interval '6 days'),
('Electricity','MSEDCL',54780,'Common lighting + lift power','ELE-11-26',60000, now() - interval '9 days'),
('Lift Maintenance','OTIS India',18500,'AMC quarterly visit','OTIS-Q4',20000, now() - interval '11 days'),
('Water Supply','BMC Water',22400,'Tanker + municipal','WAT-11-26',25000, now() - interval '14 days'),
('Gardening','Green Thumb Landscaping',9500,'Monthly upkeep','GT-1126',10000, now() - interval '15 days'),
('Repairs','Ravi Plumbing Works',6800,'B-Tower riser leak repair','RP-778',15000, now() - interval '18 days'),
('Generator Diesel','Bharat Petroleum',31200,'400L diesel refill','BP-DL-9912',35000, now() - interval '20 days'),
('AMC','FireSafe Solutions',14200,'Fire extinguisher AMC','FS-Q4-26',15000, now() - interval '22 days'),
('Cleaning','Prakash Housekeeping',7500,'Deep-clean lobby','PH-2210',8000, now() - interval '25 days'),
('Security','SecureGuard Services Pvt Ltd',68000,'6 guards - Oct shift','SG-2610',72000, now() - interval '34 days'),
('Housekeeping','CleanNest Facility',42000,'Common area cleaning','CN-1020',45000, now() - interval '36 days'),
('Electricity','MSEDCL',58900,'Higher AC load','ELE-10-26',60000, now() - interval '39 days'),
('Repairs','Sunrise Electricals',12400,'Lift phase repair','SE-441',15000, now() - interval '42 days'),
('Water Supply','Aqua Tankers',18800,'2 tanker refills','AQ-987',25000, now() - interval '45 days'),
('Security','SecureGuard Services Pvt Ltd',68000,'6 guards - Sept shift','SG-2609',72000, now() - interval '64 days'),
('Housekeeping','CleanNest Facility',42000,'Common area cleaning','CN-0920',45000, now() - interval '66 days'),
('Electricity','MSEDCL',49200,'Monsoon low load','ELE-09-26',60000, now() - interval '69 days'),
('Gardening','Green Thumb Landscaping',9500,'Monthly upkeep','GT-0926',10000, now() - interval '75 days'),
('AMC','Kone Elevators',22000,'Half-yearly lift AMC','KE-H1-26',24000, now() - interval '80 days'),
('Repairs','MetroPaints',48000,'D-Tower staircase repaint','MP-9921',50000, now() - interval '85 days'),
('Security','SecureGuard Services Pvt Ltd',66000,'6 guards - Aug shift','SG-2608',72000, now() - interval '94 days'),
('Housekeeping','CleanNest Facility',40000,'Common area cleaning','CN-0820',45000, now() - interval '96 days'),
('Electricity','MSEDCL',61300,'Peak summer','ELE-08-26',60000, now() - interval '99 days'),
('Generator Diesel','Bharat Petroleum',28900,'350L diesel','BP-DL-9812',35000, now() - interval '105 days'),
('Security','SecureGuard Services Pvt Ltd',66000,'6 guards - Jul shift','SG-2607',72000, now() - interval '124 days'),
('Housekeeping','CleanNest Facility',40000,'Common area cleaning','CN-0720',45000, now() - interval '126 days'),
('Electricity','MSEDCL',63400,'Peak summer','ELE-07-26',60000, now() - interval '129 days'),
('Security','SecureGuard Services Pvt Ltd',64000,'6 guards - Jun shift','SG-2606',72000, now() - interval '154 days'),
('Housekeeping','CleanNest Facility',40000,'Common area cleaning','CN-0620',45000, now() - interval '156 days'),
('Electricity','MSEDCL',58100,'Late spring','ELE-06-26',60000, now() - interval '159 days');

-- SEED ACTIVITIES
INSERT INTO public.activities (kind, actor, description, meta) VALUES
('payment','Priya Iyer','Paid maintenance for A-102','{"amount":4500}'),
('expense','Treasurer','Recorded Security expense · ₹68,000','{"category":"Security"}'),
('invoice','Admin','Uploaded invoice OTIS-Q4','{"vendor":"OTIS India"}'),
('report','Treasurer','Generated October monthly report','{}'),
('payment','Karan Malhotra','Paid maintenance for C-101','{"amount":4500}'),
('update','Admin','Updated resident record for D-201','{}'),
('payment','Suresh Patel','Paid maintenance for B-101','{"amount":4500}'),
('expense','Treasurer','Recorded Housekeeping expense · ₹42,000','{"category":"Housekeeping"}'),
('payment','Anjali Rao','Paid maintenance for A-302','{"amount":5200}'),
('report','Auditor','Generated Q2 audit summary','{}');
