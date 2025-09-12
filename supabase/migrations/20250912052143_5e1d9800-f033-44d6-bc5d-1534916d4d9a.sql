-- Fix security vulnerabilities in profile access and role management

-- 1. First, ensure users cannot update their own role (critical security fix)
ALTER TABLE public.profiles DROP POLICY IF EXISTS "Users can update their own profile";

-- Create a new policy that excludes role updates for regular users
CREATE POLICY "Users can update their own profile (excluding role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent users from modifying their own role
  (OLD.role IS NOT DISTINCT FROM NEW.role)
);

-- 2. Create a more secure admin verification system
-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3. Create a super admin verification function for the most sensitive operations
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow access to the specific admin email
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND email = 'emilgerat@yandex.ru' 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 4. Create a verified admin function for general admin operations (no email access)
CREATE OR REPLACE FUNCTION public.is_verified_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    -- Add additional verification if needed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 5. Create a view for admin user management WITHOUT email addresses
CREATE OR REPLACE VIEW public.user_management_view AS
SELECT 
  id,
  full_name,
  role,
  created_at,
  updated_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.user_management_view SET (security_barrier = true);

-- 6. Create restricted admin policies
-- Super admins can see full profiles (including emails) - only for the original admin
CREATE POLICY "Super admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_super_admin());

-- Super admin can update roles and all fields
CREATE POLICY "Super admin can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_super_admin());

-- Verified admins can view user management data (no email access)
CREATE POLICY "Verified admins can view user management" 
ON public.user_management_view
FOR SELECT 
USING (public.is_verified_admin());

-- 7. Create a secure role update function that logs changes
CREATE OR REPLACE FUNCTION public.update_user_role(
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
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW() 
  WHERE id = target_user_id;

  -- Log the role change (you can extend this to insert into an audit table)
  RAISE NOTICE 'Role changed for user %: % -> %', target_user_id, old_role, new_role;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create audit table for role changes
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

-- 9. Update the role change function to include auditing
CREATE OR REPLACE FUNCTION public.update_user_role_with_audit(
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
  
  -- Insert audit record
  INSERT INTO public.role_change_audit (changed_by, target_user, old_role, new_role)
  VALUES (auth.uid(), target_user_id, old_role, new_role);
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW() 
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;