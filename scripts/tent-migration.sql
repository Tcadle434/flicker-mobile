-- Tent Placements Table
-- Stores user's placed decoration items in tent rooms

CREATE TABLE public.tent_placements (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  room_id TEXT NOT NULL DEFAULT 'main',
  tile_x INTEGER NOT NULL,
  tile_y INTEGER NOT NULL,
  direction TEXT NOT NULL DEFAULT 'down',
  scale DOUBLE PRECISION NOT NULL DEFAULT 1,
  placed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast per-user lookups
CREATE INDEX idx_tent_placements_user_id ON public.tent_placements(user_id);

-- Row Level Security
ALTER TABLE public.tent_placements ENABLE ROW LEVEL SECURITY;

-- Users can only see their own placements
CREATE POLICY "Users can view own tent placements"
  ON public.tent_placements FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own placements
CREATE POLICY "Users can insert own tent placements"
  ON public.tent_placements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own placements
CREATE POLICY "Users can update own tent placements"
  ON public.tent_placements FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own placements
CREATE POLICY "Users can delete own tent placements"
  ON public.tent_placements FOR DELETE
  USING (auth.uid() = user_id);


-- ── Tent Owned Items ──────────────────────────────────────────────
-- Dedicated table for item ownership (no more fragile regex on currency txns)
-- Each row = one owned copy of an item (buy twice → two rows)

CREATE TABLE public.tent_owned_items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_tent_owned_items_user_id ON public.tent_owned_items(user_id);

ALTER TABLE public.tent_owned_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tent items"
  ON public.tent_owned_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tent items"
  ON public.tent_owned_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tent items"
  ON public.tent_owned_items FOR DELETE
  USING (auth.uid() = user_id);
