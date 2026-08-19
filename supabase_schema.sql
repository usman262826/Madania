-- ==============================================================================
-- 🕋 MADRASAH MANAGEMENT SYSTEM (মাদরাসা ম্যানেজমেন্ট সিস্টেম)
-- 🚀 CLEAN & FRESH SUPABASE POSTGRESQL SCHEMA (REPLACE & RECREATE ALL)
-- ==============================================================================
-- এই স্ক্রিপ্টটি পূর্বের পুরোনো বা কনফ্লিক্ট হওয়া সব টেবিল নিরাপদভাবে মুছে ফেলে 
-- নতুন এবং শতভাগ নির্ভুল টেবিল ও রিয়েলটাইম আর্কিটেকচার সেটআপ করবে।
-- ==============================================================================

-- ১. প্রয়োজনীয় এক্সটেনশন চালু করা
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ২. রিয়েল-টাইম পাবলিকেশন কনফিগারেশন
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- ৩. পুরোনো/কনফ্লিক্ট তৈরি করা সকল টেবিল মুছে ফেলা (FRESH REPLACEMENT)
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.pending_applications CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.income CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.academic_departments CASCADE;
DROP TABLE IF EXISTS public.academic_classes CASCADE;
DROP TABLE IF EXISTS public.academic_subjects CASCADE;
DROP TABLE IF EXISTS public.academic_eval_metrics CASCADE;
DROP TABLE IF EXISTS public.academic_exam_dates CASCADE;
DROP TABLE IF EXISTS public.media_assets CASCADE;
DROP TABLE IF EXISTS public.recycle_bin CASCADE;
DROP TABLE IF EXISTS public.madrasah_app_state CASCADE;

-- ==============================================================================
-- ৪. ব্যবহারকারী ও ভূমিকা টেবিল (APP USERS & ROLE BASED ACCESS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'teacher', -- 'superadmin', 'admin', 'teacher', 'staff', 'accountant'
    designation TEXT,
    department TEXT,
    status TEXT NOT NULL DEFAULT 'Approved', -- 'Approved', 'Pending', 'Blocked'
    permissions JSONB DEFAULT '[]'::jsonb,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_phone ON public.app_users(phone);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_status ON public.app_users(status);

-- ==============================================================================
-- ৫. কোর অ্যাপ্লিকেশন স্টেট টেবিল (CORE FAST KEY-VALUE REALTIME STORE)
-- ==============================================================================
CREATE TABLE public.madrasah_app_state (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_madrasah_app_state_updated ON public.madrasah_app_state(updated_at DESC);
CREATE INDEX idx_madrasah_app_state_data_gin ON public.madrasah_app_state USING GIN(data);

-- ==============================================================================
-- ৫. শিক্ষার্থী টেবিল (STUDENTS TABLE)
-- ==============================================================================
CREATE TABLE public.students (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    name_bn TEXT,
    name_en TEXT,
    father_name TEXT,
    mother_name TEXT,
    dob TEXT,
    birth_reg_no TEXT,
    gender TEXT,
    blood_group TEXT,
    guardian_mobile TEXT,
    alt_mobile TEXT,
    email TEXT,
    address TEXT,
    department TEXT,
    class_name TEXT,
    branch TEXT DEFAULT 'ক',
    roll_number TEXT,
    student_type TEXT DEFAULT 'নতুন',
    residential_status TEXT DEFAULT 'আবাসিক',
    status TEXT DEFAULT 'সক্রিয়',
    academic_year TEXT,
    prev_madrasa TEXT,
    prev_class TEXT,
    monthly_fee NUMERIC(12, 2) DEFAULT 0,
    khoraki_fee NUMERIC(12, 2) DEFAULT 0,
    admission_fee NUMERIC(12, 2) DEFAULT 0,
    photo_url TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_academic_year ON public.students(academic_year);
CREATE INDEX idx_students_class_name ON public.students(class_name);
CREATE INDEX idx_students_guardian_mobile ON public.students(guardian_mobile);
CREATE INDEX idx_students_status ON public.students(status);

-- ==============================================================================
-- ৬. ফি ও ইনভয়েস টেবিল (INVOICES & STUDENT FEES)
-- ==============================================================================
CREATE TABLE public.invoices (
    id TEXT PRIMARY KEY,
    invoice_no TEXT,
    student_id TEXT,
    student_name TEXT,
    class_name TEXT,
    month TEXT,
    year TEXT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'unpaid',
    payment_method TEXT DEFAULT 'cash',
    transaction_id TEXT,
    fee_breakdown JSONB DEFAULT '[]'::jsonb,
    issue_date DATE DEFAULT CURRENT_DATE,
    paid_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_student_id ON public.invoices(student_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_month_year ON public.invoices(month, year);

-- ==============================================================================
-- ৭. মাদরাসার আয় টেবিল (INCOME RECORDS)
-- ==============================================================================
CREATE TABLE public.income (
    id TEXT PRIMARY KEY,
    receipt_no TEXT,
    source TEXT NOT NULL,
    category TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    received_from TEXT,
    received_by TEXT,
    payment_method TEXT DEFAULT 'cash',
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    academic_year TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_income_date ON public.income(date);
CREATE INDEX idx_income_category ON public.income(category);

-- ==============================================================================
-- ৮. মাদরাসার ব্যয় টেবিল (EXPENSES)
-- ==============================================================================
CREATE TABLE public.expenses (
    id TEXT PRIMARY KEY,
    voucher_no TEXT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expense_date DATE DEFAULT CURRENT_DATE,
    spent_by TEXT,
    payment_method TEXT DEFAULT 'cash',
    description TEXT,
    academic_year TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

-- ==============================================================================
-- ৯. শিক্ষক ও কর্মকর্তা-কর্মচারী টেবিল (STAFF & TEACHERS)
-- ==============================================================================
CREATE TABLE public.staff (
    id TEXT PRIMARY KEY,
    staff_id TEXT,
    name TEXT NOT NULL,
    designation TEXT,
    department TEXT,
    mobile TEXT,
    alt_mobile TEXT,
    email TEXT,
    nid_no TEXT,
    blood_group TEXT,
    address TEXT,
    joining_date DATE,
    salary NUMERIC(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    photo_url TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_mobile ON public.staff(mobile);
CREATE INDEX idx_staff_status ON public.staff(status);

-- ==============================================================================
-- ১০. হাজিরা রেকর্ডস টেবিল (ATTENDANCE)
-- ==============================================================================
CREATE TABLE public.attendance (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL, -- 'student' or 'staff'
    date DATE NOT NULL,
    records JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_present INTEGER DEFAULT 0,
    total_absent INTEGER DEFAULT 0,
    total_late INTEGER DEFAULT 0,
    total_leave INTEGER DEFAULT 0,
    submitted_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_date_type ON public.attendance(date, target_type);

-- ==============================================================================
-- ১১. অনলাইন ভর্তি আবেদন টেবিল (ONLINE PENDING ADMISSIONS)
-- ==============================================================================
CREATE TABLE public.pending_applications (
    id TEXT PRIMARY KEY,
    application_no TEXT UNIQUE,
    name TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    mobile TEXT NOT NULL,
    alt_mobile TEXT,
    dob TEXT,
    birth_reg TEXT,
    address TEXT,
    jamat_class TEXT,
    student_type TEXT DEFAULT 'নতুন',
    prev_madrasa TEXT,
    prev_class TEXT,
    academic_year TEXT,
    status TEXT DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pending_apps_status ON public.pending_applications(status);

-- ==============================================================================
-- ১২. অটোমেটিক Updated-At ট্রিগার ফাংশন
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_madrasah_app_state_updated
    BEFORE UPDATE ON public.madrasah_app_state
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_students_updated
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_invoices_updated
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_expenses_updated
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_income_updated
    BEFORE UPDATE ON public.income
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_staff_updated
    BEFORE UPDATE ON public.staff
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ১৩. ROW LEVEL SECURITY (RLS) ও PERMISSIONS পলিসি
-- ==============================================================================
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.madrasah_app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to app_users" ON public.app_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to madrasah_app_state" ON public.madrasah_app_state FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to invoices" ON public.invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to income" ON public.income FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to expenses" ON public.expenses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to staff" ON public.staff FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to attendance" ON public.attendance FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public access to pending_applications" ON public.pending_applications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- ১৪. REAL-TIME SYNCHRONIZATION ENABLING
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.madrasah_app_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.income;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_applications;

-- ==============================================================================
-- 🚀 সম্পন্ন!
-- ==============================================================================
