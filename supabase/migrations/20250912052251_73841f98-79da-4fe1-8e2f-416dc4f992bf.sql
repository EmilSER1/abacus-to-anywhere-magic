-- Fix security vulnerabilities in profile access and role management

-- 1. First, ensure users cannot update their own role (critical security fix)
DROP POLICY "Users can update their own profile" ON public.profiles;

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

-- 2. Drop existing admin policies
DROP POLICY "Admins can view all profiles" ON public.profiles;
DROP POLICY "Admins can update all profiles" ON public.profiles;

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
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;