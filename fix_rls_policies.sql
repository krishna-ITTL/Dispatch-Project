-- =============================================
-- FIX: Missing RLS Policies for loading_lists & loading_list_items
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Enable RLS (in case it's already enabled, these are safe to re-run)
ALTER TABLE public.loading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loading_list_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.loading_lists;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.loading_lists;
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.loading_list_items;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.loading_list_items;

-- 3. Create full access policies for authenticated users
CREATE POLICY "Allow authenticated all access" ON public.loading_lists
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.loading_lists
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated all access" ON public.loading_list_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.loading_list_items
  FOR SELECT USING (auth.role() = 'authenticated');
