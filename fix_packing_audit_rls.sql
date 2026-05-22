-- Fix: RLS Enabled No Policy for packing_audit
-- Using a direct subquery instead of relying on the has_role function to avoid missing function errors.

DROP POLICY IF EXISTS "Allow admins to view packing_audit" ON public.packing_audit;

CREATE POLICY "Allow admins to view packing_audit"
ON public.packing_audit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('SuperAdmin', 'DispatchAdmin', 'Admin')
  )
);
