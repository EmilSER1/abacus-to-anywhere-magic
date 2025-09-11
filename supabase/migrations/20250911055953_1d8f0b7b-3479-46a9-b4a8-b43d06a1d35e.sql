-- Выполняем синхронизацию данных напрямую
UPDATE projector_floors pf
SET 
  connected_turar_department = rc.turar_department,
  connected_turar_room = rc.turar_room,
  updated_at = NOW()
FROM room_connections rc
WHERE pf."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" = rc.projector_room
  AND pf."ОТДЕЛЕНИЕ" = rc.projector_department;