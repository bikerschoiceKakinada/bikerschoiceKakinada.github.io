
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles: only admins can read
CREATE POLICY "Admins can read user_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Signature work table
CREATE TABLE public.signature_work (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.signature_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read signature_work" ON public.signature_work
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage signature_work" ON public.signature_work
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Gallery table
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read gallery" ON public.gallery
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage gallery" ON public.gallery
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Delivery categories
CREATE TABLE public.delivery_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read delivery_categories" ON public.delivery_categories
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage delivery_categories" ON public.delivery_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Delivery items
CREATE TABLE public.delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.delivery_categories(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read delivery_items" ON public.delivery_items
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage delivery_items" ON public.delivery_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Site settings (single row)
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_subtitle TEXT DEFAULT 'Premium aggressive custom-styled bikes with LED mods, painting, wraps, touring setups & precision finishing.',
  instagram_followers TEXT DEFAULT '4,800+',
  map_embed TEXT DEFAULT '',
  working_hours TEXT DEFAULT 'Mon–Sat: 9 AM – 8 PM | Sunday: Closed',
  logo_url TEXT DEFAULT '',
  online_delivery_button_enabled BOOLEAN DEFAULT true,
  facebook_link TEXT DEFAULT '',
  instagram_link TEXT DEFAULT 'https://www.instagram.com/bikers_choice_kakinada?igsh=MXN4NHd0bnRzY2p3dg==',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site_settings" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage site_settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default site_settings row
INSERT INTO public.site_settings (id) VALUES (gen_random_uuid());

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

CREATE POLICY "Public can read uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Admins can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update uploads" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
