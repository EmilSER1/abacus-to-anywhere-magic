-- Удаляем лишние таблицы, созданные в предыдущих миграциях
DROP TABLE IF EXISTS mapped_projector_rooms CASCADE;
DROP TABLE IF EXISTS mapped_turar_rooms CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- Удаляем лишние колонки из projector_floors
ALTER TABLE projector_floors 
DROP COLUMN IF EXISTS equipment_specification,
DROP COLUMN IF EXISTS equipment_price,
DROP COLUMN IF EXISTS department_id,
DROP COLUMN IF EXISTS room_id,
DROP COLUMN IF EXISTS equipment_status,
DROP COLUMN IF EXISTS equipment_documents,
DROP COLUMN IF EXISTS equipment_supplier;

-- Удаляем лишние колонки из turar_medical
ALTER TABLE turar_medical 
DROP COLUMN IF EXISTS room_id,
DROP COLUMN IF EXISTS department_id;

-- Удаляем лишние колонки из department_mappings
ALTER TABLE department_mappings 
DROP COLUMN IF EXISTS turar_department_id,
DROP COLUMN IF EXISTS projector_department_id;

-- Удаляем лишние колонки из room_connections  
ALTER TABLE room_connections 
DROP COLUMN IF EXISTS turar_room_id_new,
DROP COLUMN IF EXISTS projector_room_id_new,
DROP COLUMN IF EXISTS projector_department_id,
DROP COLUMN IF EXISTS turar_department_id,
DROP COLUMN IF EXISTS turar_room_id,
DROP COLUMN IF EXISTS projector_room_id;

-- Удаляем лишние типы данных
DROP TYPE IF EXISTS equipment_status_type CASCADE;