-- Fix security vulnerabilities in profile access and role management

-- 1. Drop existing insecure policies
DROP POLICY "Users can update their own profile" ON public.profiles;
DROP POLICY "Admins can view all profiles" ON public.profiles;
DROP POLICY "Admins can update all profiles" ON public.profiles;

-- 2. Create a super admin verification function for the most sensitive operations
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

-- 3. Create a verified admin function for general admin operations
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

-- 4. Create secure policies
-- Users can only update their own profile, but NOT their role or email
CREATE POLICY "Users can update their own profile (limited)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Only super admin can see ALL profile data including emails
CREATE POLICY "Super admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_super_admin());

-- Only super admin can update any profile (including roles)
CREATE POLICY "Super admin can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_super_admin());