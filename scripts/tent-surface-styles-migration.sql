-- Tent Surface Styles
-- Stores purchased floor / wallpaper styles and the equipped selection per room.

CREATE TABLE public.tent_owned_surface_styles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  style_id TEXT NOT NULL,
  surface_type TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, style_id)
);

CREATE INDEX idx_tent_owned_surface_styles_user_id
  ON public.tent_owned_surface_styles(user_id);

ALTER TABLE public.tent_owned_surface_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tent surface styles"
  ON public.tent_owned_surface_styles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tent surface styles"
  ON public.tent_owned_surface_styles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tent surface styles"
  ON public.tent_owned_surface_styles FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE public.tent_room_styles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_id TEXT NOT NULL,
  floor_style_id TEXT,
  wall_style_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, room_id)
);

CREATE INDEX idx_tent_room_styles_user_id
  ON public.tent_room_styles(user_id);

ALTER TABLE public.tent_room_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tent room styles"
  ON public.tent_room_styles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tent room styles"
  ON public.tent_room_styles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tent room styles"
  ON public.tent_room_styles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tent room styles"
  ON public.tent_room_styles FOR DELETE
  USING (auth.uid() = user_id);
