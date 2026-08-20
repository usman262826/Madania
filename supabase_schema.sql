-- ====================================================================
-- MADRASAH MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA & POLICIES
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. CENTRAL JSON APP STATE TABLE (Real-time Cloud Synchronization)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.madrasah_app_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.madrasah_app_state ENABLE ROW LEVEL SECURITY;

-- Allow Public Access for Seamless Offline & Cloud Sync
DROP POLICY IF EXISTS "Allow public full access on madrasah_app_state" ON public.madrasah_app_state;
CREATE POLICY "Allow public full access on madrasah_app_state" 
ON public.madrasah_app_state 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Enable Realtime Broadcast for Cross-Device Synchronization
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'madrasah_app_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.madrasah_app_state;
  END IF;
END $$;


-- --------------------------------------------------------------------
-- 2. STRUCTURED APP USERS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access on app_users" ON public.app_users;
CREATE POLICY "Allow public full access on app_users" 
ON public.app_users 
FOR ALL 
USING (true) 
WITH CHECK (true);

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
  END IF;
END $$;


-- --------------------------------------------------------------------
-- 3. STRUCTURED INVOICES TABLE (Relational Mirror for Fees)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT,
  student_roll TEXT,
  student_class TEXT,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  net_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  due_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'paid',
  payment_method TEXT DEFAULT 'ক্যাশ',
  invoice_month TEXT,
  invoice_year TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.student_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access on student_invoices" ON public.student_invoices;
CREATE POLICY "Allow public full access on student_invoices" 
ON public.student_invoices 
FOR ALL 
USING (true) 
WITH CHECK (true);


-- --------------------------------------------------------------------
-- 4. STRUCTURED ATTENDANCE RECORDS TABLE (Relational Mirror)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_attendance_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL,
  entry_time TEXT,
  exit_time TEXT,
  marked_by TEXT DEFAULT 'ADMIN_MANUAL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.student_attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access on student_attendance_records" ON public.student_attendance_records;
CREATE POLICY "Allow public full access on student_attendance_records" 
ON public.student_attendance_records 
FOR ALL 
USING (true) 
WITH CHECK (true);


-- --------------------------------------------------------------------
-- 5. STRUCTURED SENT SMS LOGS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sent_sms_logs (
  id TEXT PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message_body TEXT NOT NULL,
  status TEXT DEFAULT 'SENT',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sent_sms_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access on sent_sms_logs" ON public.sent_sms_logs;
CREATE POLICY "Allow public full access on sent_sms_logs" 
ON public.sent_sms_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);
