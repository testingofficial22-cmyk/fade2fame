/*
  # Create jobs table for job postings

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `posted_by` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text)
      - `company` (text)
      - `location` (text, nullable)
      - `job_type` (enum: full-time, part-time, internship, contract)
      - `application_url` (text, nullable)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on `jobs` table
    - Add policies for authenticated users to read active jobs
    - Add policies for users to manage their own job postings

  3. Indexes
    - Index on `is_active` for filtering active jobs
    - Index on `created_at` for sorting by date
    - Index on `posted_by` for user's job listings
*/

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  posted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  company text NOT NULL,
  location text,
  job_type text NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'internship', 'contract')),
  application_url text,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active jobs"
  ON jobs
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Users can update their own jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = posted_by)
  WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Users can delete their own jobs"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = posted_by);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_jobs_updated_at'
  ) THEN
    CREATE TRIGGER update_jobs_updated_at
      BEFORE UPDATE ON jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;