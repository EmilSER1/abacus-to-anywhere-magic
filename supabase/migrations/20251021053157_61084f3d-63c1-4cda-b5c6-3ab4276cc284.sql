-- Удаляем колонки связей из projector_floors
ALTER TABLE projector_floors 
DROP COLUMN IF EXISTS connected_turar_department,
DROP COLUMN IF EXISTS connected_turar_room,
DROP COLUMN IF EXISTS connected_turar_room_id;

-- Удаляем таблицы
DROP TABLE IF EXISTS room_connections CASCADE;
DROP TABLE IF EXISTS turar_medical CASCADE;
DROP TABLE IF EXISTS department_mappings CASCADE;

-- Удаляем связанные функции
DROP FUNCTION IF EXISTS get_unique_turar_departments() CASCADE;
DROP FUNCTION IF EXISTS get_room_connections_with_details() CASCADE;
DROP FUNCTION IF EXISTS sync_projector_room_connections() CASCADE;