-- ========================================================================================
-- MADRASAH MANAGEMENT SYSTEM - COMPREHENSIVE SUPABASE SCHEMA
-- ========================================================================================
-- WARNING: This script drops existing tables to recreate them fresh. 
-- Do NOT run this on a production database with real data unless you want to wipe it.

-- 0. UNIVERSAL APP STATE (Current mechanism)
-- The React app currently uses this table to sync all localStorage JSON data.
DROP TABLE IF EXISTS madrasah_app_state CASCADE;
CREATE TABLE madrasah_app_state (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL
);

-- 1. DROP EXISTING RELATIONAL TABLES (To start fresh)
DROP TABLE IF EXISTS exam_marks CASCADE;
DROP TABLE IF EXISTS exam_list CASCADE;
DROP TABLE IF EXISTS class_subjects CASCADE;
DROP TABLE IF EXISTS academic_subjects CASCADE;
DROP TABLE IF EXISTS academic_classes CASCADE;
DROP TABLE IF EXISTS fee_collections CASCADE;
DROP TABLE IF EXISTS fee_packages CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS student_attendance CASCADE;
DROP TABLE IF EXISTS staff_attendance CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS admission_inquiries CASCADE;
DROP TABLE IF EXISTS incomes CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS salaries CASCADE;
DROP TABLE IF EXISTS salary_payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS madrasah_settings CASCADE;
DROP TABLE IF EXISTS global_settings CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

-- 2. CREATE NEW TABLES (Covering all Sidebar Modules)

-- Users & Authentication
CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid,
  name varchar(255) NOT NULL,
  email varchar(255) UNIQUE,
  phone varchar(20),
  role varchar(50) DEFAULT 'admin', -- admin, teacher, staff, parent
  status varchar(20) DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now()
);

-- Academic Settings (Classes, Subjects)
CREATE TABLE academic_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  department varchar(100),
  numeric_value int,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE academic_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  code varchar(50),
  full_marks int DEFAULT 100,
  pass_marks int DEFAULT 33,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES academic_classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES academic_subjects(id) ON DELETE CASCADE,
  UNIQUE(class_id, subject_id)
);

-- Students & Admissions
CREATE TABLE admission_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name varchar(255) NOT NULL,
  guardian_name varchar(255),
  phone varchar(20) NOT NULL,
  target_class varchar(100),
  status varchar(50) DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id varchar(50) UNIQUE,
  name_bn varchar(255),
  name_en varchar(255),
  father_name varchar(255),
  mother_name varchar(255),
  dob date,
  gender varchar(20),
  blood_group varchar(10),
  guardian_mobile varchar(20),
  address text,
  class_id uuid REFERENCES academic_classes(id),
  roll_number varchar(50),
  registration_no varchar(100),
  status varchar(20) DEFAULT 'active',
  admission_date date DEFAULT CURRENT_DATE,
  academic_year varchar(20),
  photo_url text,
  meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id varchar(100) UNIQUE,
  student_name varchar(255) NOT NULL,
  mobile varchar(20) NOT NULL,
  target_class varchar(100),
  father_name varchar(255),
  mother_name varchar(255),
  dob date,
  address text,
  status varchar(50) DEFAULT 'pending',
  meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- HR & Staff
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id varchar(50) UNIQUE,
  name varchar(255) NOT NULL,
  designation varchar(150),
  department varchar(100),
  mobile varchar(20),
  email varchar(255),
  joining_date date,
  salary numeric(10, 2) DEFAULT 0,
  status varchar(20) DEFAULT 'active',
  photo_url text,
  meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Attendance (Unified)
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type varchar(20) CHECK (entity_type IN ('student', 'staff')),
  entity_id uuid NOT NULL,
  attendance_date date NOT NULL,
  status varchar(20) CHECK (status IN ('present', 'absent', 'late', 'leave')),
  note text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(entity_type, entity_id, attendance_date)
);

-- Finance & Accounts
CREATE TABLE fee_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES academic_classes(id),
  fee_type varchar(100),
  amount numeric(10, 2) NOT NULL,
  academic_year varchar(20),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no varchar(100) UNIQUE,
  student_id uuid REFERENCES students(id),
  month varchar(20),
  year varchar(20),
  total_amount numeric(10, 2) NOT NULL,
  paid_amount numeric(10, 2) DEFAULT 0,
  due_amount numeric(10, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status varchar(20) DEFAULT 'pending',
  issue_date date DEFAULT CURRENT_DATE,
  due_date date,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE fee_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id),
  student_id uuid REFERENCES students(id),
  amount numeric(10, 2) NOT NULL,
  payment_method varchar(50),
  collection_date date DEFAULT CURRENT_DATE,
  received_by uuid REFERENCES app_users(id),
  receipt_no varchar(100) UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category varchar(100),
  source varchar(255),
  amount numeric(10, 2) NOT NULL,
  income_date date DEFAULT CURRENT_DATE,
  received_by varchar(255),
  description text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category varchar(100),
  title varchar(255) NOT NULL,
  amount numeric(10, 2) NOT NULL,
  expense_date date DEFAULT CURRENT_DATE,
  spent_by varchar(255),
  description text,
  voucher_no varchar(100),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id),
  month varchar(20),
  year varchar(20),
  amount numeric(10, 2) NOT NULL,
  payment_date date DEFAULT CURRENT_DATE,
  payment_method varchar(50),
  status varchar(20) DEFAULT 'paid',
  created_at timestamp with time zone DEFAULT now()
);

-- Exams & Results
CREATE TABLE exam_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  academic_year varchar(20),
  start_date date,
  end_date date,
  status varchar(20) DEFAULT 'upcoming',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE exam_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exam_list(id),
  student_id uuid REFERENCES students(id),
  subject_id uuid REFERENCES academic_subjects(id),
  marks_obtained numeric(5, 2),
  is_absent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(exam_id, student_id, subject_id)
);

-- Notices & Communication
CREATE TABLE notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  content text NOT NULL,
  target_audience varchar(50),
  publish_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Global Settings
CREATE TABLE global_settings (
  id int PRIMARY KEY DEFAULT 1,
  madrasah_name varchar(255) NOT NULL,
  slogan text,
  address text,
  phone varchar(50),
  email varchar(255),
  logo_url text,
  established_year varchar(20),
  principal_name varchar(255),
  currency varchar(10) DEFAULT 'BDT',
  meta_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CHECK (id = 1)
);

-- ========================================================================================
-- ROW LEVEL SECURITY (RLS) SETTINGS
-- Allow all access for easy integration during development
-- ========================================================================================

-- Enable RLS on all tables
ALTER TABLE madrasah_app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (Development Mode)
CREATE POLICY "Allow all" ON madrasah_app_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON academic_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON academic_subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON class_subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON admission_inquiries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON fee_packages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON fee_collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON incomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON salary_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON exam_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON exam_marks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON notices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON global_settings FOR ALL USING (true) WITH CHECK (true);
