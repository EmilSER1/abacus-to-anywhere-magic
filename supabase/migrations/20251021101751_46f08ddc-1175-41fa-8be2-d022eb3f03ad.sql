-- ========================================
-- CRITICAL SECURITY FIX: Migrate to separate user_roles table
-- This prevents privilege escalation attacks
-- ========================================

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user', 'none');

-- 2. Create user_roles table (separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'staff' THEN 2
      WHEN 'user' THEN 3
      WHEN 'none' THEN 4
    END
  LIMIT 1
$$;

-- 5. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::public.app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Update is_super_admin to use has_role
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND email = 'emilgerat@yandex.ru'
  ) AND public.has_role(auth.uid(), 'admin');
END;
$$;

-- 7. Update is_verified_admin to use has_role
CREATE OR REPLACE FUNCTION public.is_verified_admin()
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.has_role(auth.uid(), 'admin');
END;
$$;

-- 8. Update get_current_user_role to use new system
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_primary_role(auth.uid())::text;
$$;

-- 9. Update handle_new_user trigger to use user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Determine role
  IF NEW.email = 'emilgerat@yandex.ru' THEN
    user_role := 'admin';
  ELSE
    user_role := 'none';
  END IF;

  -- Insert into profiles (without role)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );

  -- Insert role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$$;

-- 10. Update role change function to use user_roles
CREATE OR REPLACE FUNCTION public.update_user_role_secure(target_user_id UUID, new_role public.app_role)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
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

-- 11. RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admin can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admin can manage roles"
ON public.user_roles FOR ALL
USING (public.is_super_admin());

-- ========================================
-- FIX: Restrict equipment table to admin/staff only
-- ========================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "All authenticated users can view equipment" ON equipment;

-- Create restricted policy
CREATE POLICY "Admin and staff can view equipment"
ON equipment FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Update other equipment policies to use has_role
DROP POLICY IF EXISTS "Authenticated users can insert equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users can update equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users can delete equipment" ON equipment;

CREATE POLICY "Admin and staff can insert equipment"
ON equipment FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admin and staff can update equipment"
ON equipment FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admin and staff can delete equipment"
ON equipment FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- ========================================
-- FIX: Update projector_floors policies
-- ========================================

DROP POLICY IF EXISTS "Authenticated users can insert projector floors" ON projector_floors;
DROP POLICY IF EXISTS "Authenticated users can update projector floors" ON projector_floors;
DROP POLICY IF EXISTS "Authenticated users can delete projector floors" ON projector_floors;

CREATE POLICY "Admin and staff can insert projector floors"
ON projector_floors FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admin and staff can update projector floors"
ON projector_floors FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admin and staff can delete projector floors"
ON projector_floors FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));