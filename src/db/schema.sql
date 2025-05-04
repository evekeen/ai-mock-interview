-- Enable Row Level Security
ALTER DATABASE postgres SET "anon.auth.jwt.claims" TO 'preferred_username';

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  personality_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TYPE upload_type AS ENUM ('resume', 'jd');

CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type upload_type NOT NULL,
  url TEXT NOT NULL,
  parsed_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  bullet_points JSONB,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practice_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  audio_url TEXT,
  wpm INTEGER,
  filler_rate REAL,
  sentiment REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_runs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only read/write their own data
CREATE POLICY users_policy ON users
  USING (clerk_id = current_user)
  WITH CHECK (clerk_id = current_user);

CREATE POLICY uploads_select_policy ON uploads
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_user));

CREATE POLICY uploads_insert_policy ON uploads
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = current_user));

CREATE POLICY stories_select_policy ON stories
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_user));

CREATE POLICY stories_insert_policy ON stories
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = current_user));

CREATE POLICY practice_runs_select_policy ON practice_runs
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_user));

CREATE POLICY practice_runs_insert_policy ON practice_runs
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = current_user)); 