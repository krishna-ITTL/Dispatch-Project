-- Fix: Function Search Path Mutable for set_packing_dates()
-- This ensures the function executes within a known schema context, preventing search path hijacking.
ALTER FUNCTION public.set_packing_dates() SET search_path = public;

-- Fix: Public/Signed-In Users Can Execute SECURITY DEFINER Function for rls_auto_enable()
-- This function is likely meant to be run internally (e.g. by a database trigger or migration), 
-- not exposed via the REST API to end users or anonymous users.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
