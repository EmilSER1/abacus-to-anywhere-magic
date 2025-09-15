-- Полная очистка всех связей в БД

-- Очищаем все связи в projector_floors
UPDATE projector_floors 
SET 
  connected_turar_department = NULL,
  connected_turar_room = NULL,
  connected_turar_room_id = NULL,
  updated_at = NOW();

-- Очищаем все связи в turar_medical  
UPDATE turar_medical 
SET 
  connected_projector_department = NULL,
  connected_projector_room = NULL,
  connected_projector_room_id = NULL,
  updated_at = NOW();

-- Полностью очищаем таблицу связей комнат
DELETE FROM room_connections;

-- Полностью очищаем таблицу связей отделений
DELETE FROM department_mappings;