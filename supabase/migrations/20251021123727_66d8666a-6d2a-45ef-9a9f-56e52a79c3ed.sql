-- Drop the old function that uses user_role enum
DROP FUNCTION IF EXISTS public.update_user_role_secure(uuid, user_role);

-- Ensure only the app_role version exists
-- The function should already exist, but we'll recreate it to be sure
CREATE OR REPLACE FUNCTION public.update_user_role_secure(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role public.app_role;
BEGIN
  -- Only super admin can change roles
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Only super admins can change user roles';
  END IF;

  -- Get current role
  SELECT role INTO old_role 
  FROM public.user_roles 
  WHERE user_id = target_user_id
  LIMIT 1;
  
  -- Insert audit record
  INSERT INTO public.role_change_audit (changed_by, target_user, old_role, new_role)
  VALUES (auth.uid(), target_user_id, old_role::user_role, new_role::user_role);
  
  -- Delete old role
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role);

  RETURN TRUE;
END;
$$;