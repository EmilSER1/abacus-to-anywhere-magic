-- Создаем enum для ролей (только если не существует)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'staff', 'user', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Обновляем таблицу profiles, добавляем роль 
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS role;

ALTER TABLE public.profiles 
ADD COLUMN role public.user_role NOT NULL DEFAULT 'none';

-- Устанавливаем админа для emilgerat@yandex.ru
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'emilgerat@yandex.ru';

-- Создаем функцию для получения роли текущего пользователя (избегаем рекурсии в RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Обновляем функцию для автоматического создания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    CASE 
      WHEN NEW.email = 'emilgerat@yandex.ru' THEN 'admin'::public.user_role
      ELSE 'none'::public.user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для автоматического создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Обновляем RLS политики для profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Создаем новые политики
CREATE POLICY "Users can view their own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can update their own profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" 
ON profiles 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can insert their own profile" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);