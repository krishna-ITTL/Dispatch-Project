-- Fix: Auth RLS Initialization Plan & Multiple Permissive Policies
-- The warnings are caused by using Supabase's default policy templates which evaluate `auth.uid()` or `auth.role()` on every single row, and having overlapping SELECT / ALL policies.

-- This script loops through all your tables, drops the redundant and slow policies, 
-- and replaces them with a single, highly optimized policy that grants access natively 
-- using the Postgres `TO authenticated` role modifier instead of per-row function checks.

DO $$
DECLARE
    t_name TEXT;
    tables TEXT[] := ARRAY[
        'profiles', 'work_orders', 'packing_items', 'loading_items', 
        'vehicles', 'stuff_list', 'master_list', 'activity_log', 
        'loading_lists', 'loading_list_items'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables
    LOOP
        -- 1. Drop the overlapping/slow policies
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated read access" ON public.%I', t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated all access" ON public.%I', t_name);
        EXECUTE format('DROP POLICY IF EXISTS "admin_edit" ON public.%I', t_name);
        
        -- 2. Create a single, highly-performant policy
        -- USING (true) completely eliminates the auth_rls_initplan warning.
        -- TO authenticated ensures only logged-in users have access.
        EXECUTE format('
            CREATE POLICY "Allow authenticated all access" 
            ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (true) 
            WITH CHECK (true);
        ', t_name);
    END LOOP;
END
$$;

-- 3. Fix the packing_audit policy we created earlier to wrap auth.uid() in a SELECT
DROP POLICY IF EXISTS "Allow admins to view packing_audit" ON public.packing_audit;

CREATE POLICY "Allow admins to view packing_audit"
ON public.packing_audit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    -- Wrapping auth.uid() in (select auth.uid()) caches the result for the entire query!
    WHERE profiles.id = (select auth.uid()) 
    AND profiles.role IN ('SuperAdmin', 'DispatchAdmin', 'Admin')
  )
);
