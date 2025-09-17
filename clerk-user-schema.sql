-- Clerk-based User Schema for Neon Database
-- This schema uses Clerk user IDs (strings) instead of UUID references

-- User profiles table (using Clerk user IDs)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL, -- Clerk user ID (string)
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  bio TEXT,
  phone VARCHAR(50),
  address VARCHAR(500),
  city VARCHAR(255),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User permit searches
CREATE TABLE IF NOT EXISTS user_permit_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID (string)
  search_name VARCHAR(255),
  search_query TEXT,
  location_data JSONB,
  results_count INTEGER DEFAULT 0,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- User favorites (permit offices)
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID (string)
  permit_office_id UUID NOT NULL REFERENCES permit_offices(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permit_office_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permit_searches_user_id ON user_permit_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_permit_office_id ON user_favorites(permit_office_id);

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_user_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_updated_at_column();
