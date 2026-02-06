-- Sona App: Database migration
-- Run this migration against your Supabase database

-- ==========================================
-- Users table (profile data linked to auth)
-- ==========================================

CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false NOT NULL,
  subscription_status TEXT DEFAULT 'free' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ==========================================
-- Resets table (streak tracking)
-- ==========================================

CREATE TABLE public.resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  duration_minutes SMALLINT NOT NULL CHECK (duration_minutes IN (3, 5, 15)),
  mood_after TEXT CHECK (mood_after IS NULL OR mood_after IN ('calmer', 'same', 'worse')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_resets_user_completed ON public.resets (user_id, completed_at DESC);

ALTER TABLE public.resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own resets"
  ON public.resets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own resets"
  ON public.resets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
