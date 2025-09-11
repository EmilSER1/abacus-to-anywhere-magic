-- Исправляем RLS политики для profiles, избегая рекурсии

-- Удаляем проблемные политики
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Создаем функцию для получения роли текущего пользователя
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = 'public';

-- Создаем новые безопасные политики
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" 
ON profiles 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin');