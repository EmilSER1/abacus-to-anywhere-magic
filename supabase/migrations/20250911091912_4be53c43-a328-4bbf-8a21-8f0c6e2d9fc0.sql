-- Обновляем RLS политики для общего доступа к данным связей

-- Удаляем старые политики для room_connections
DROP POLICY IF EXISTS "Authenticated users can view room connections" ON room_connections;
DROP POLICY IF EXISTS "Authenticated users can manage room connections" ON room_connections;

-- Создаем новые политики для общего доступа
CREATE POLICY "All authenticated users can view room connections" 
ON room_connections 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can manage room connections" 
ON room_connections 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Обновляем политики для projector_floors
DROP POLICY IF EXISTS "Authenticated users can view projector floors" ON projector_floors;
DROP POLICY IF EXISTS "Authenticated users can manage projector floors" ON projector_floors;

CREATE POLICY "All authenticated users can view projector floors" 
ON projector_floors 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can manage projector floors" 
ON projector_floors 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Обновляем политики для turar_medical
DROP POLICY IF EXISTS "Authenticated users can view turar medical" ON turar_medical;
DROP POLICY IF EXISTS "Authenticated users can manage turar medical" ON turar_medical;

CREATE POLICY "All authenticated users can view turar medical" 
ON turar_medical 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can manage turar medical" 
ON turar_medical 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Обновляем политики для departments
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;
DROP POLICY IF EXISTS "Authenticated users can manage departments" ON departments;

CREATE POLICY "All authenticated users can view departments" 
ON departments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can manage departments" 
ON departments 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Обновляем политики для department_mappings
DROP POLICY IF EXISTS "Allow all operations on department_mappings" ON department_mappings;
DROP POLICY IF EXISTS "Authenticated users can manage department mappings" ON department_mappings;
DROP POLICY IF EXISTS "Authenticated users can view department mappings" ON department_mappings;

CREATE POLICY "All authenticated users can view department mappings" 
ON department_mappings 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can manage department mappings" 
ON department_mappings 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);