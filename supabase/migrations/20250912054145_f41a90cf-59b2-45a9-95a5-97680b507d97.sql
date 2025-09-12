-- Fix critical security issue: Restrict write access to authorized roles only

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "All authenticated users can manage department mappings" ON department_mappings;
DROP POLICY IF EXISTS "All authenticated users can manage departments" ON departments;
DROP POLICY IF EXISTS "All authenticated users can manage room connections" ON room_connections;
DROP POLICY IF EXISTS "All authenticated users can manage projector floors" ON projector_floors;
DROP POLICY IF EXISTS "All authenticated users can manage turar medical" ON turar_medical;
DROP POLICY IF EXISTS "Authenticated users can manage mapped projector rooms" ON mapped_projector_rooms;
DROP POLICY IF EXISTS "Authenticated users can manage mapped turar rooms" ON mapped_turar_rooms;
DROP POLICY IF EXISTS "Authenticated users can manage rooms" ON rooms;

-- Create secure policies for department_mappings
CREATE POLICY "Authenticated users can insert department mappings" 
ON department_mappings FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can update department mappings" 
ON department_mappings FOR UPDATE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can delete department mappings" 
ON department_mappings FOR DELETE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'));

-- Create secure policies for departments
CREATE POLICY "Authenticated users can insert departments" 
ON departments FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can update departments" 
ON departments FOR UPDATE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can delete departments" 
ON departments FOR DELETE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'));

-- Create secure policies for room_connections
CREATE POLICY "Authenticated users can insert room connections" 
ON room_connections FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can update room connections" 
ON room_connections FOR UPDATE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can delete room connections" 
ON room_connections FOR DELETE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'));

-- Create secure policies for projector_floors
CREATE POLICY "Authenticated users can insert projector floors" 
ON projector_floors FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can update projector floors" 
ON projector_floors FOR UPDATE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can delete projector floors" 
ON projector_floors FOR DELETE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'));

-- Create secure policies for turar_medical
CREATE POLICY "Authenticated users can insert turar medical" 
ON turar_medical FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can update turar medical" 
ON turar_medical FOR UPDATE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can delete turar medical" 
ON turar_medical FOR DELETE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'));

-- Create secure policies for mapped_projector_rooms
CREATE POLICY "Authenticated users can insert mapped projector rooms" 
ON mapped_projector_rooms FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can update mapped projector rooms" 
ON mapped_projector_rooms FOR UPDATE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can delete mapped projector rooms" 
ON mapped_projector_rooms FOR DELETE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'));

-- Create secure policies for mapped_turar_rooms
CREATE POLICY "Authenticated users can insert mapped turar rooms" 
ON mapped_turar_rooms FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can update mapped turar rooms" 
ON mapped_turar_rooms FOR UPDATE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can delete mapped turar rooms" 
ON mapped_turar_rooms FOR DELETE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'));

-- Create secure policies for rooms
CREATE POLICY "Authenticated users can insert rooms" 
ON rooms FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can update rooms" 
ON rooms FOR UPDATE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'))
WITH CHECK (get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can delete rooms" 
ON rooms FOR DELETE 
TO authenticated 
USING (get_current_user_role() IN ('admin', 'staff'));