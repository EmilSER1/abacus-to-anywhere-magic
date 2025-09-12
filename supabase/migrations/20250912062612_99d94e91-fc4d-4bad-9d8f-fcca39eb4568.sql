-- Удаляем дублированные связи для аллерголога, оставляем только одну
DELETE FROM room_connections 
WHERE projector_room = 'Аллерголог Эндокринолог' 
  AND turar_room = 'кабинет врача аллерголога'
  AND turar_room_id != 'fb865a45-27a0-4331-95fd-b74a5c65f99a';

-- Очищаем старые связи в projector_floors для дублированных записей
UPDATE projector_floors 
SET 
  connected_turar_room = NULL,
  connected_turar_department = NULL,
  connected_turar_room_id = NULL
WHERE "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" = 'Аллерголог Эндокринолог'
  AND connected_turar_room = 'кабинет врача аллерголога'
  AND connected_turar_room_id != 'fb865a45-27a0-4331-95fd-b74a5c65f99a';