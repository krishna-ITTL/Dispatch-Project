-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  INDOTECH Dispatch Management System                           ║
-- ║  Security Remediation — RLS Policy Overhaul                    ║
-- ║  Version: 1.0 | Date: 2026-05-28                              ║
-- ║  DB Roles: Admin, Supervisor, User, Dashboard User, Security   ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  PRE-MIGRATION: Export current policies for backup               │
-- │  Run this query FIRST and save the output:                       │
-- │                                                                  │
-- │  SELECT tablename, policyname, cmd, qual, with_check            │
-- │  FROM pg_policies WHERE schemaname = 'public';                   │
-- └──────────────────────────────────────────────────────────────────┘


-- ════════════════════════════════════════════════════════════════════
-- STEP 1: Create helper function (SECURITY DEFINER bypasses RLS)
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ════════════════════════════════════════════════════════════════════
-- STEP 2: Drop ALL existing policies on all tables
-- ════════════════════════════════════════════════════════════════════

-- profiles
DROP POLICY IF EXISTS "Allow authenticated select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated update profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated delete profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.profiles;
DROP POLICY IF EXISTS "Secure authenticated access" ON public.profiles;

-- work_orders
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.work_orders;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.work_orders;

-- packing_items
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.packing_items;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.packing_items;

-- loading_items
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.loading_items;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.loading_items;

-- loading_lists
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.loading_lists;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.loading_lists;

-- loading_list_items
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.loading_list_items;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.loading_list_items;

-- vehicles
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.vehicles;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.vehicles;

-- stuff_list
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.stuff_list;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.stuff_list;

-- master_list
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.master_list;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.master_list;

-- activity_log
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.activity_log;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.activity_log;

-- master_packing_items
DROP POLICY IF EXISTS "Allow authenticated all access" ON public.master_packing_items;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.master_packing_items;


-- ════════════════════════════════════════════════════════════════════
-- STEP 3: Create granular per-operation policies
-- ════════════════════════════════════════════════════════════════════


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: profiles                                                 │
-- │  Non-recursive: auth.uid() for own-row, get_my_role()           │
-- │  (SECURITY DEFINER) for admin checks — no infinite loop          │
-- └──────────────────────────────────────────────────────────────────┘

-- Users can read their own profile (needed for session/role loading)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Admin can read ALL profiles (for User Management page)
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Admin');

-- Users can insert their own profile, Admin can insert any
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR get_my_role() = 'Admin');

-- Users can update their own profile (name only — role change blocked by frontend)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can update ANY profile (including role assignment)
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'Admin');

-- Only Admin can delete profiles
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (get_my_role() = 'Admin');


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: work_orders                                              │
-- │  Security role CANNOT see work orders                            │
-- └──────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "work_orders_select" ON public.work_orders;
CREATE POLICY "work_orders_select" ON public.work_orders
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User', 'Dashboard User'));

DROP POLICY IF EXISTS "work_orders_insert" ON public.work_orders;
CREATE POLICY "work_orders_insert" ON public.work_orders
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "work_orders_update" ON public.work_orders;
CREATE POLICY "work_orders_update" ON public.work_orders
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));

DROP POLICY IF EXISTS "work_orders_delete" ON public.work_orders;
CREATE POLICY "work_orders_delete" ON public.work_orders
  FOR DELETE TO authenticated
  USING (get_my_role() = 'Admin');


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: packing_items                                            │
-- └──────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "packing_items_select" ON public.packing_items;
CREATE POLICY "packing_items_select" ON public.packing_items
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User', 'Dashboard User'));

DROP POLICY IF EXISTS "packing_items_insert" ON public.packing_items;
CREATE POLICY "packing_items_insert" ON public.packing_items
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "packing_items_update" ON public.packing_items;
CREATE POLICY "packing_items_update" ON public.packing_items
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "packing_items_delete" ON public.packing_items;
CREATE POLICY "packing_items_delete" ON public.packing_items
  FOR DELETE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: loading_items                                            │
-- └──────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "loading_items_select" ON public.loading_items;
CREATE POLICY "loading_items_select" ON public.loading_items
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User', 'Dashboard User'));

DROP POLICY IF EXISTS "loading_items_insert" ON public.loading_items;
CREATE POLICY "loading_items_insert" ON public.loading_items
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "loading_items_update" ON public.loading_items;
CREATE POLICY "loading_items_update" ON public.loading_items
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "loading_items_delete" ON public.loading_items;
CREATE POLICY "loading_items_delete" ON public.loading_items
  FOR DELETE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: loading_lists                                            │
-- └──────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "loading_lists_select" ON public.loading_lists;
CREATE POLICY "loading_lists_select" ON public.loading_lists
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User', 'Dashboard User'));

DROP POLICY IF EXISTS "loading_lists_insert" ON public.loading_lists;
CREATE POLICY "loading_lists_insert" ON public.loading_lists
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "loading_lists_update" ON public.loading_lists;
CREATE POLICY "loading_lists_update" ON public.loading_lists
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "loading_lists_delete" ON public.loading_lists;
CREATE POLICY "loading_lists_delete" ON public.loading_lists
  FOR DELETE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: loading_list_items                                       │
-- └──────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "ll_items_select" ON public.loading_list_items;
CREATE POLICY "ll_items_select" ON public.loading_list_items
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User', 'Dashboard User'));

DROP POLICY IF EXISTS "ll_items_insert" ON public.loading_list_items;
CREATE POLICY "ll_items_insert" ON public.loading_list_items
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "ll_items_update" ON public.loading_list_items;
CREATE POLICY "ll_items_update" ON public.loading_list_items
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "ll_items_delete" ON public.loading_list_items;
CREATE POLICY "ll_items_delete" ON public.loading_list_items
  FOR DELETE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: vehicles                                                 │
-- │  Security CAN read and update (gate tracking)                    │
-- └──────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
CREATE POLICY "vehicles_select" ON public.vehicles
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User', 'Dashboard User', 'Security'));

DROP POLICY IF EXISTS "vehicles_insert" ON public.vehicles;
CREATE POLICY "vehicles_insert" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin', 'Supervisor'));

DROP POLICY IF EXISTS "vehicles_update" ON public.vehicles;
CREATE POLICY "vehicles_update" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'Security'));

DROP POLICY IF EXISTS "vehicles_delete" ON public.vehicles;
CREATE POLICY "vehicles_delete" ON public.vehicles
  FOR DELETE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: stuff_list                                               │
-- └──────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "stuff_list_select" ON public.stuff_list;
CREATE POLICY "stuff_list_select" ON public.stuff_list
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User', 'Dashboard User'));

DROP POLICY IF EXISTS "stuff_list_insert" ON public.stuff_list;
CREATE POLICY "stuff_list_insert" ON public.stuff_list
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "stuff_list_update" ON public.stuff_list;
CREATE POLICY "stuff_list_update" ON public.stuff_list
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "stuff_list_delete" ON public.stuff_list;
CREATE POLICY "stuff_list_delete" ON public.stuff_list
  FOR DELETE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: master_list                                              │
-- │  All authenticated can read (needed for dropdowns everywhere)    │
-- └──────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "master_list_select" ON public.master_list;
CREATE POLICY "master_list_select" ON public.master_list
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "master_list_insert" ON public.master_list;
CREATE POLICY "master_list_insert" ON public.master_list
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "master_list_update" ON public.master_list;
CREATE POLICY "master_list_update" ON public.master_list
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));

DROP POLICY IF EXISTS "master_list_delete" ON public.master_list;
CREATE POLICY "master_list_delete" ON public.master_list
  FOR DELETE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: activity_log                                             │
-- │  Immutable audit trail — NO UPDATE or DELETE policies            │
-- └──────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;
CREATE POLICY "activity_log_select" ON public.activity_log
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));

DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;
CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- No UPDATE or DELETE policies — activity_log is immutable


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: master_packing_items                                     │
-- └──────────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "master_packing_items_select" ON public.master_packing_items;
CREATE POLICY "master_packing_items_select" ON public.master_packing_items
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "master_packing_items_insert" ON public.master_packing_items;
CREATE POLICY "master_packing_items_insert" ON public.master_packing_items
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "master_packing_items_update" ON public.master_packing_items;
CREATE POLICY "master_packing_items_update" ON public.master_packing_items
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor', 'User'));

DROP POLICY IF EXISTS "master_packing_items_delete" ON public.master_packing_items;
CREATE POLICY "master_packing_items_delete" ON public.master_packing_items
  FOR DELETE TO authenticated
  USING (get_my_role() IN ('Admin', 'Supervisor'));


-- ════════════════════════════════════════════════════════════════════
-- STEP 4: Update handle_new_user trigger (default role → 'User')
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'User'  -- Always default to User. Admin assigns roles via /users page.
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ════════════════════════════════════════════════════════════════════
-- STEP 5: Add status column to master_list (pending/approved flow)
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.master_list ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Mark all existing entries as approved (non-destructive)
UPDATE public.master_list SET status = 'approved' WHERE status IS NULL;


-- ════════════════════════════════════════════════════════════════════
-- STEP 6: Fix category_key casing inconsistency
-- Normalize 'Packing list items' → 'Packing List Items'
-- ════════════════════════════════════════════════════════════════════

UPDATE public.master_list
SET category_key = 'Packing List Items'
WHERE category_key = 'Packing list items';


-- ════════════════════════════════════════════════════════════════════
-- POST-MIGRATION VERIFICATION QUERIES
-- (Run these in SQL Editor after migration completes)
-- ════════════════════════════════════════════════════════════════════

-- 1. Verify all policies are in place:
--    SELECT tablename, policyname, cmd
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    ORDER BY tablename, cmd;
--
-- 2. Verify trigger default role is 'User':
--    SELECT routine_definition
--    FROM information_schema.routines
--    WHERE routine_name = 'handle_new_user';
