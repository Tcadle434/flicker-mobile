-- Tent surface styles tables + transactional RPC
-- Safe to run in environments where the style tables have not been created yet.

CREATE TABLE IF NOT EXISTS public.tent_owned_surface_styles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  style_id TEXT NOT NULL,
  surface_type TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, style_id)
);

CREATE INDEX IF NOT EXISTS idx_tent_owned_surface_styles_user_id
  ON public.tent_owned_surface_styles(user_id);

ALTER TABLE public.tent_owned_surface_styles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tent_owned_surface_styles'
      AND policyname = 'Users can view own tent surface styles'
  ) THEN
    CREATE POLICY "Users can view own tent surface styles"
      ON public.tent_owned_surface_styles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tent_owned_surface_styles'
      AND policyname = 'Users can insert own tent surface styles'
  ) THEN
    CREATE POLICY "Users can insert own tent surface styles"
      ON public.tent_owned_surface_styles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tent_owned_surface_styles'
      AND policyname = 'Users can delete own tent surface styles'
  ) THEN
    CREATE POLICY "Users can delete own tent surface styles"
      ON public.tent_owned_surface_styles FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.tent_room_styles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_id TEXT NOT NULL,
  floor_style_id TEXT,
  wall_style_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_tent_room_styles_user_id
  ON public.tent_room_styles(user_id);

ALTER TABLE public.tent_room_styles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tent_room_styles'
      AND policyname = 'Users can view own tent room styles'
  ) THEN
    CREATE POLICY "Users can view own tent room styles"
      ON public.tent_room_styles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tent_room_styles'
      AND policyname = 'Users can insert own tent room styles'
  ) THEN
    CREATE POLICY "Users can insert own tent room styles"
      ON public.tent_room_styles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tent_room_styles'
      AND policyname = 'Users can update own tent room styles'
  ) THEN
    CREATE POLICY "Users can update own tent room styles"
      ON public.tent_room_styles FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tent_room_styles'
      AND policyname = 'Users can delete own tent room styles'
  ) THEN
    CREATE POLICY "Users can delete own tent room styles"
      ON public.tent_room_styles FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.commit_tent_surface_style(
  p_room_id TEXT,
  p_surface_type TEXT,
  p_style_id TEXT,
  p_price INTEGER
)
RETURNS TABLE (
  ok BOOLEAN,
  error_code TEXT,
  purchased BOOLEAN,
  floor_style_id TEXT,
  wall_style_id TEXT,
  light_balance INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance INTEGER;
  v_was_owned BOOLEAN;
  v_inserted_rows INTEGER;
  v_purchased BOOLEAN := false;
  v_price INTEGER := GREATEST(COALESCE(p_price, 0), 0);
  v_tx_id TEXT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'auth_required', false, NULL::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  IF p_surface_type NOT IN ('floor', 'wall') THEN
    RETURN QUERY SELECT false, 'invalid_surface_type', false, NULL::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  SELECT u.light_balance
  INTO v_current_balance
  FROM public.users AS u
  WHERE u.id = v_user_id;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 'unknown_error', false, NULL::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.tent_owned_surface_styles AS styles
    WHERE styles.user_id = v_user_id
      AND styles.style_id = p_style_id
  )
  INTO v_was_owned;

  IF NOT v_was_owned AND v_price > 0 AND v_current_balance < v_price THEN
    RETURN QUERY SELECT false, 'insufficient_funds', false, NULL::TEXT, NULL::TEXT, v_current_balance;
    RETURN;
  END IF;

  IF NOT v_was_owned THEN
    INSERT INTO public.tent_owned_surface_styles (user_id, style_id, surface_type)
    VALUES (v_user_id, p_style_id, p_surface_type)
    ON CONFLICT (user_id, style_id) DO NOTHING;

    GET DIAGNOSTICS v_inserted_rows = ROW_COUNT;
    v_purchased := v_inserted_rows > 0;

    IF v_purchased AND v_price > 0 THEN
      v_tx_id := 'tx_tent_surface_'
        || p_style_id
        || '_'
        || FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT
        || '_'
        || SUBSTR(MD5(random()::TEXT || clock_timestamp()::TEXT || p_style_id), 1, 8);

      INSERT INTO public.currency_transactions (id, user_id, amount, type, source)
      VALUES (v_tx_id, v_user_id, -v_price, 'spend', 'tent_surface_purchase');
    END IF;
  END IF;

  INSERT INTO public.tent_room_styles (user_id, room_id, floor_style_id, wall_style_id)
  VALUES (
    v_user_id,
    p_room_id,
    CASE WHEN p_surface_type = 'floor' THEN p_style_id ELSE NULL END,
    CASE WHEN p_surface_type = 'wall' THEN p_style_id ELSE NULL END
  )
  ON CONFLICT (user_id, room_id) DO UPDATE
  SET
    floor_style_id = CASE
      WHEN p_surface_type = 'floor' THEN EXCLUDED.floor_style_id
      ELSE public.tent_room_styles.floor_style_id
    END,
    wall_style_id = CASE
      WHEN p_surface_type = 'wall' THEN EXCLUDED.wall_style_id
      ELSE public.tent_room_styles.wall_style_id
    END,
    updated_at = now();

  SELECT trs.floor_style_id, trs.wall_style_id, u.light_balance
  INTO floor_style_id, wall_style_id, light_balance
  FROM public.tent_room_styles AS trs
  JOIN public.users AS u
    ON u.id = trs.user_id
  WHERE trs.user_id = v_user_id
    AND trs.room_id = p_room_id;

  RETURN QUERY
  SELECT true, NULL::TEXT, v_purchased, floor_style_id, wall_style_id, light_balance;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'unknown_error', false, NULL::TEXT, NULL::TEXT, NULL::INTEGER;
END;
$$;

GRANT EXECUTE ON FUNCTION public.commit_tent_surface_style(TEXT, TEXT, TEXT, INTEGER)
  TO authenticated;
