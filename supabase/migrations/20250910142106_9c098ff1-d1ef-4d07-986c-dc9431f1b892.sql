-- First, create a profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies for all medical facility tables to require authentication

-- Update department_mappings policies
DROP POLICY IF EXISTS "Allow all operations" ON public.department_mappings;
CREATE POLICY "Authenticated users can view department mappings" 
ON public.department_mappings 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage department mappings" 
ON public.department_mappings 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Update mapped_projector_rooms policies
DROP POLICY IF EXISTS "Allow all operations on mapped_projector_rooms" ON public.mapped_projector_rooms;
CREATE POLICY "Authenticated users can view mapped projector rooms" 
ON public.mapped_projector_rooms 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage mapped projector rooms" 
ON public.mapped_projector_rooms 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Update mapped_turar_rooms policies
DROP POLICY IF EXISTS "Allow all operations on mapped_turar_rooms" ON public.mapped_turar_rooms;
CREATE POLICY "Authenticated users can view mapped turar rooms" 
ON public.mapped_turar_rooms 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage mapped turar rooms" 
ON public.mapped_turar_rooms 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Update projector_floors policies
DROP POLICY IF EXISTS "Allow all operations on projector_floors" ON public.projector_floors;
CREATE POLICY "Authenticated users can view projector floors" 
ON public.projector_floors 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage projector floors" 
ON public.projector_floors 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Update room_connections policies
DROP POLICY IF EXISTS "Allow all operations on room_connections" ON public.room_connections;
CREATE POLICY "Authenticated users can view room connections" 
ON public.room_connections 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage room connections" 
ON public.room_connections 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Update turar_medical policies
DROP POLICY IF EXISTS "Allow all operations on turar_medical" ON public.turar_medical;
CREATE POLICY "Authenticated users can view turar medical" 
ON public.turar_medical 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage turar medical" 
ON public.turar_medical 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');