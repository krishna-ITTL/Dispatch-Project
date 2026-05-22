-- RBAC to prevent Security role from deleting records

CREATE OR REPLACE FUNCTION check_security_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Get the role from the profiles table for the current user
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  
  IF v_role = 'Security' THEN
    RAISE EXCEPTION 'Security users are not permitted to delete records.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_prevent_security_delete ON vehicles;

-- Create trigger on vehicles table
CREATE TRIGGER trg_prevent_security_delete
BEFORE DELETE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION check_security_delete();
