-- Supabase SQL Schema for Madania's Project
-- Execute this directly in your Supabase SQL Editor

-- 1. Madrasah App State (Key-Value storage for the current UI implementation)
-- This table is currently used by the frontend to sync localStorage data seamlessly without breaking any existing features.
CREATE TABLE IF NOT EXISTS madrasah_app_state (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- RELATIONAL SCHEMA (For future deep integration or reporting tools)
-- =========================================================================

-- 2. Students
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name varchar(255) NOT NULL,
  father_name varchar(255),
  mother_name varchar(255),
  dob date,
  guardian_mobile varchar(20),
  address text,
  jamat_class varchar(100),
  registration_id varchar(100),
  roll_number varchar(50),
  student_type varchar(50),
  somoman varchar(100),
  academic_year varchar(100),
  meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Applications (Admissions)
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id varchar(100) UNIQUE,
  name varchar(255) NOT NULL,
  mobile varchar(20) NOT NULL,
  alt_mobile varchar(20),
  class varchar(100),
  father_name varchar(255),
  mother_name varchar(255),
  dob date,
  birth_reg_no varchar(100),
  address text,
  full_address text,
  apply_date date DEFAULT CURRENT_DATE,
  status varchar(50) DEFAULT 'pending',
  student_type varchar(50),
  academic_year varchar(100),
  jamat varchar(100),
  marhala varchar(100),
  somoman varchar(100),
  email varchar(255),
  blood_group varchar(10),
  prev_madrasa varchar(255),
  prev_class varchar(100),
  messaging_apps varchar(255),
  roll varchar(50),
  comment text,
  meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Staff
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  designation varchar(150),
  mobile varchar(20),
  joining_date date,
  salary numeric(10, 2) DEFAULT 0,
  photo_url text,
  meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Attendance (Students & Staff)
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type varchar(20) CHECK (entity_type IN ('student', 'staff')),
  entity_id varchar(255) NOT NULL, -- Storing as string to support both uuid and legacy IDs
  attendance_date date NOT NULL,
  attendance_time time,
  status varchar(20) CHECK (status IN ('present', 'absent', 'late', 'leave')),
  note text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(entity_type, entity_id, attendance_date)
);

-- 6. Invoices (Fee Records)
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id varchar(255) NOT NULL, -- Storing as string to support legacy IDs
  month varchar(50),
  year varchar(50),
  amount numeric(10, 2) NOT NULL,
  original_amount numeric(10, 2),
  due_amount numeric(10, 2),
  type varchar(50),
  payment_date date,
  payment_time time,
  status varchar(20) CHECK (status IN ('paid', 'pending', 'partial')),
  method varchar(50),
  received_by varchar(100),
  meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 7. Salary Payments
CREATE TABLE IF NOT EXISTS salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id varchar(255) NOT NULL,
  month varchar(50),
  year varchar(50),
  amount numeric(10, 2) NOT NULL,
  payment_date date,
  payment_time time,
  method varchar(50),
  note text,
  created_at timestamp with time zone DEFAULT now()
);

-- 8. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  category varchar(100),
  amount numeric(10, 2) NOT NULL,
  expense_date date,
  description text,
  spent_by varchar(100),
  meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 9. Madrasah Branding / Settings
CREATE TABLE IF NOT EXISTS madrasah_settings (
  id int PRIMARY KEY DEFAULT 1,
  name varchar(255) NOT NULL,
  slogan text,
  logo_url text,
  established_year varchar(20),
  founder varchar(255),
  principal varchar(255),
  mobile varchar(20),
  email varchar(255),
  address text,
  website text,
  colors jsonb,
  meta_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CHECK (id = 1) -- Ensures only one row exists for global settings
);

-- =========================================================================
-- OPTIONAL: Row Level Security (RLS) Setup
-- Uncomment below if you want to allow all access directly from frontend 
-- without any restrictions (useful for rapid dev mode).
-- =========================================================================

-- ALTER TABLE madrasah_app_state ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all access" ON madrasah_app_state FOR ALL USING (true) WITH CHECK (true);
