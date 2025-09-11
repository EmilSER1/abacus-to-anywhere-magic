-- Очищаем все связи между кабинетами
DELETE FROM room_connections;

-- Очищаем все поля связей в projector_floors
UPDATE projector_floors 
SET 
  connected_turar_room_id = NULL,
  connected_turar_department = NULL,
  connected_turar_room = NULL,
  updated_at = NOW();

-- Очищаем все поля связей в turar_medical
UPDATE turar_medical 
SET 
  connected_projector_room_id = NULL,
  connected_projector_department = NULL,
  connected_projector_room = NULL,
  updated_at = NOW();