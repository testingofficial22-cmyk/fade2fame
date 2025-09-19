/*
  # Add role field to profiles table

  1. Changes
    - Add `role` column to profiles table with values 'student' or 'alumni'
    - Make graduation_year nullable for students
    - Add default role as 'student'

  2. Security
    - No changes to existing RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'student' CHECK (role IN ('student', 'alumni'));
  END IF;
END $$;

-- Make graduation_year nullable for students
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'graduation_year' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN graduation_year DROP NOT NULL;
  END IF;
END $$;