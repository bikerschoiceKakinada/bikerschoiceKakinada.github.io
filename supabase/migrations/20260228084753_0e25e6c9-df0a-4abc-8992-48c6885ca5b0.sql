
-- Fix all RLS policies: change from RESTRICTIVE to PERMISSIVE
-- The current RESTRICTIVE policies prevent public reads from working

-- Drop and recreate all policies as PERMISSIVE

-- delivery_categories
DROP POLICY IF EXISTS "Public can read delivery_categories" ON public.delivery_categories;
DROP POLICY IF EXISTS "Admins can manage delivery_categories" ON public.delivery_categories;
CREATE POLICY "Public can read delivery_categories" ON public.delivery_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage delivery_categories" ON public.delivery_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- delivery_items
DROP POLICY IF EXISTS "Public can read delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "Admins can manage delivery_items" ON public.delivery_items;
CREATE POLICY "Public can read delivery_items" ON public.delivery_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage delivery_items" ON public.delivery_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- gallery
DROP POLICY IF EXISTS "Public can read gallery" ON public.gallery;
DROP POLICY IF EXISTS "Admins can manage gallery" ON public.gallery;
CREATE POLICY "Public can read gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Admins can manage gallery" ON public.gallery FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- signature_work
DROP POLICY IF EXISTS "Public can read signature_work" ON public.signature_work;
DROP POLICY IF EXISTS "Admins can manage signature_work" ON public.signature_work;
CREATE POLICY "Public can read signature_work" ON public.signature_work FOR SELECT USING (true);
CREATE POLICY "Admins can manage signature_work" ON public.signature_work FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- site_settings
DROP POLICY IF EXISTS "Public can read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;
CREATE POLICY "Public can read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site_settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles - keep read-only for admins but make it PERMISSIVE
DROP POLICY IF EXISTS "Admins can read user_roles" ON public.user_roles;
CREATE POLICY "Admins can read user_roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
