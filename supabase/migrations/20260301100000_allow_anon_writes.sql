-- Fix: Allow anonymous role to write to admin-managed tables.
--
-- The admin dashboard authenticates via client-side credentials (not Supabase Auth),
-- so every browser request uses the 'anon' key. Netlify scheduled functions also use
-- the anon key when auto-updating Instagram follower counts. Without these policies
-- all write operations are silently blocked by RLS, causing "Save failed" errors.

-- ── site_settings ────────────────────────────────────────────────────────────
CREATE POLICY "Anon can update site_settings" ON public.site_settings
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can insert site_settings" ON public.site_settings
  FOR INSERT TO anon WITH CHECK (true);

-- ── gallery ──────────────────────────────────────────────────────────────────
CREATE POLICY "Anon can insert gallery" ON public.gallery
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update gallery" ON public.gallery
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete gallery" ON public.gallery
  FOR DELETE TO anon USING (true);

-- ── signature_work ───────────────────────────────────────────────────────────
CREATE POLICY "Anon can insert signature_work" ON public.signature_work
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update signature_work" ON public.signature_work
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete signature_work" ON public.signature_work
  FOR DELETE TO anon USING (true);

-- ── delivery_categories ──────────────────────────────────────────────────────
CREATE POLICY "Anon can insert delivery_categories" ON public.delivery_categories
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update delivery_categories" ON public.delivery_categories
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete delivery_categories" ON public.delivery_categories
  FOR DELETE TO anon USING (true);

-- ── delivery_items ───────────────────────────────────────────────────────────
CREATE POLICY "Anon can insert delivery_items" ON public.delivery_items
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update delivery_items" ON public.delivery_items
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete delivery_items" ON public.delivery_items
  FOR DELETE TO anon USING (true);

-- ── Storage (uploads bucket) ─────────────────────────────────────────────────
CREATE POLICY "Anon can upload files" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Anon can update files" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'uploads');

CREATE POLICY "Anon can delete files" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'uploads');
