-- Run this SQL in your Supabase SQL Editor to create the necessary table for the Madrasa App

CREATE TABLE IF NOT EXISTS madrasah_app_state (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL
);

-- If you want to enable Row Level Security (RLS) to restrict access, uncomment the following:
-- ALTER TABLE madrasah_app_state ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON madrasah_app_state FOR SELECT USING (true);
-- CREATE POLICY "Enable insert/update for all users" ON madrasah_app_state FOR ALL USING (true) WITH CHECK (true);
