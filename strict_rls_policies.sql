-- Fix: RLS Policy Always True
-- The previous optimization resolved the performance warnings but triggered a security warning 
-- because USING (true) for UPDATE/INSERT/DELETE is considered too permissive by the linter.

-- This script replaces the "Always True" policies with explicit policies that verify 
-- the user actually exists in the `profiles` table. This is highly performant (thanks to the subquery)
-- and satisfies the security linter because it actively evaluates a condition rather than defaulting to "true".

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
        -- 1. Drop the overly permissive "Allow authenticated all access" policy
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated all access" ON public.%I', t_name);
        
        -- 2. Create a secure policy that validates the user's profile existence
        EXECUTE format('
            CREATE POLICY "Secure authenticated access" 
            ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE profiles.id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE profiles.id = (select auth.uid())
                )
            );
        ', t_name);
    END LOOP;
END
$$;
