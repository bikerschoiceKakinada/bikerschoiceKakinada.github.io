-- Validation migration: ensures site_settings table has the required structure.
-- The table was created in migration 20260227091010; this file is a reference only.
-- Run this ONLY if the table doesn't already exist.

DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings') THEN
    CREATE TABLE public.site_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hero_subtitle TEXT DEFAULT 'Premium aggressive custom-styled bikes with LED mods, painting, wraps, touring setups & precision finishing.',
      instagram_followers TEXT DEFAULT '4,800+',
      map_embed TEXT DEFAULT '',
      working_hours TEXT DEFAULT 'Mon–Sat: 9 AM – 8 PM | Sunday: Closed',
      logo_url TEXT DEFAULT '',
      online_delivery_button_enabled BOOLEAN DEFAULT true,
      facebook_link TEXT DEFAULT '',
      instagram_link TEXT DEFAULT 'https://www.instagram.com/bikers_choice_kakinada',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Public can read site_settings" ON public.site_settings
      FOR SELECT USING (true);

    CREATE POLICY "Admins can manage site_settings" ON public.site_settings
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));

    -- Insert default row
    INSERT INTO public.site_settings (id) VALUES (gen_random_uuid());

    RAISE NOTICE 'site_settings table created with default row.';
  ELSE
    RAISE NOTICE 'site_settings table already exists — no changes made.';
  END IF;
END $$;
