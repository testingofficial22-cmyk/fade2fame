/*
  # Create profiles table for alumni management

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - Personal info: first_name, last_name, email, phone, photo_url, date_of_birth, gender
      - Academic info: graduation_year, degree, department, roll_number, cgpa
      - Professional info: job_title, company, industry, location, experience_years, linkedin_url
      - Extra info: bio, achievements, skills, hobbies (arrays)
      - Privacy settings: phone_visibility, email_visibility, location_visibility, hidden_from_search
      - Timestamps: created_at, updated_at

  2. Security
    - Enable RLS on `profiles` table
    - Add policy for users to read public profiles
    - Add policy for users to read/write their own profile
    - Add policy for authenticated users to read alumni-only profiles

  3. Changes
    - Add indexes for common query patterns
    - Set up foreign key constraint to auth.users
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Personal Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  photo_url text,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
  
  -- Academic Information
  graduation_year integer NOT NULL,
  degree text NOT NULL,
  department text NOT NULL,
  roll_number text,
  cgpa numeric(4,2),
  
  -- Professional Information
  job_title text,
  company text,
  industry text,
  location text,
  experience_years integer,
  linkedin_url text,
  
  -- Extra Information
  bio text CHECK (length(bio) <= 500),
  achievements text[],
  skills text[],
  hobbies text[],
  
  -- Privacy Settings
  phone_visibility text DEFAULT 'alumni' CHECK (phone_visibility IN ('public', 'alumni', 'private')),
  email_visibility text DEFAULT 'alumni' CHECK (email_visibility IN ('public', 'alumni', 'private')),
  location_visibility text DEFAULT 'alumni' CHECK (location_visibility IN ('public', 'alumni', 'private')),
  hidden_from_search boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Update updated_at on profile changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (
    hidden_from_search = false AND (
      phone_visibility = 'public' OR 
      email_visibility = 'public' OR 
      location_visibility = 'public'
    )
  );

CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can view alumni profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    hidden_from_search = false OR
    auth.uid() = id
  );

-- Indexes for better query performance
CREATE INDEX idx_profiles_graduation_year ON profiles(graduation_year);
CREATE INDEX idx_profiles_department ON profiles(department);
CREATE INDEX idx_profiles_company ON profiles(company);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_hidden_from_search ON profiles(hidden_from_search);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_name ON profiles(first_name, last_name);