-- Complete the security implementation with additional protections

-- 1. Create audit table for role changes with proper security
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by UUID REFERENCES auth.users(id),
  target_user UUID REFERENCES auth.users(id),
  old_role public.user_role,
  new_role public.user_role,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only super admin can view audit logs
CREATE POLICY "Super admin can view audit logs" 
ON public.role_change_audit 
FOR SELECT 
USING (public.is_super_admin());

-- 2. Create secure role update function with auditing
CREATE OR REPLACE FUNCTION public.update_user_role_secure(
  target_user_id UUID,
  new_role public.user_role
)
RETURNS BOOLEAN AS $$
DECLARE
  old_role public.user_role;
BEGIN
  -- Only super admin can change roles
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Only super admins can change user roles';
  END IF;

  -- Get the current role for logging
  SELECT role INTO old_role FROM public.profiles WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Insert audit record FIRST
  INSERT INTO public.role_change_audit (changed_by, target_user, old_role, new_role)
  VALUES (auth.uid(), target_user_id, old_role, new_role);
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW() 
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create a trigger to prevent direct role updates outside of the secure function
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS TRIGGER AS $$
BEGIN  
  -- Prevent role changes if not super admin
  IF OLD.role IS DISTINCT FROM NEW.role AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Role changes must be performed through the secure update function';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply the trigger
CREATE TRIGGER prevent_unauthorized_role_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_update();