-- Flicker App: Database migration
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
-- Session logs (single source of truth for all sessions)
-- ==========================================
-- NOTE: The `resets` table has been removed. All session data (including
-- streak tracking) now lives in session_logs.
-- Migration for existing DBs: DROP TABLE IF EXISTS public.resets;

CREATE TABLE public.session_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('reset', 'focus', 'move')),
  target_seconds INTEGER NOT NULL,
  elapsed_seconds INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'abandoned')),
  light_earned INTEGER NOT NULL DEFAULT 0,
  activity_tag TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, id)
);

CREATE INDEX idx_session_logs_user_created ON public.session_logs (user_id, created_at DESC);

ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own session_logs"
  ON public.session_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own session_logs"
  ON public.session_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);



-- ==========================================
-- Currency transactions
-- ==========================================

CREATE TABLE public.currency_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_currency_tx_user_created ON public.currency_transactions (user_id, created_at DESC);

ALTER TABLE public.currency_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own currency_transactions"
  ON public.currency_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own currency_transactions"
  ON public.currency_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- Sanctuary unlocks
-- ==========================================

CREATE TABLE public.sanctuary_unlocks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  zone_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, zone_id)
);

ALTER TABLE public.sanctuary_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sanctuary_unlocks"
  ON public.sanctuary_unlocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sanctuary_unlocks"
  ON public.sanctuary_unlocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- Sanctuary placements
-- ==========================================

CREATE TABLE public.sanctuary_placements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  zone_id TEXT NOT NULL,
  anchor_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  placed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_sanctuary_placements_user ON public.sanctuary_placements (user_id);

ALTER TABLE public.sanctuary_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sanctuary_placements"
  ON public.sanctuary_placements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sanctuary_placements"
  ON public.sanctuary_placements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own sanctuary_placements"
  ON public.sanctuary_placements FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- Add light_balance + lifetime_earned to users
-- ==========================================

ALTER TABLE public.users
  ADD COLUMN light_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN lifetime_earned INTEGER NOT NULL DEFAULT 0;

-- Trigger to auto-update balance on transaction insert
CREATE OR REPLACE FUNCTION update_light_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET light_balance = light_balance + NEW.amount,
      lifetime_earned = CASE
        WHEN NEW.amount > 0 THEN lifetime_earned + NEW.amount
        ELSE lifetime_earned
      END
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_currency_balance
  AFTER INSERT ON public.currency_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_light_balance();

-- ==========================================
-- Onboarding completed flag
-- ==========================================

ALTER TABLE public.users
  ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;
