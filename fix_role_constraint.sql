-- First, update any old roles to the new matching roles
UPDATE public.profiles SET role = 'User' WHERE role = 'Normal User';
UPDATE public.profiles SET role = 'Supervisor' WHERE role = 'Power User';

-- Then, drop the old constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Finally, add the new constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('Admin', 'Supervisor', 'Security', 'Dashboard User', 'User'));
