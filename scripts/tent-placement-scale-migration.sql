-- Adds persistent item scaling to tent placements.
-- Run this against existing databases that already have public.tent_placements.

ALTER TABLE public.tent_placements
ADD COLUMN IF NOT EXISTS scale DOUBLE PRECISION NOT NULL DEFAULT 1;
