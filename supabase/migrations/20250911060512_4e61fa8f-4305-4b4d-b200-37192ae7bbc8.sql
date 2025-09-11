-- Исправляем синхронизацию с учетом пробелов в названиях
UPDATE projector_floors pf
SET 
  connected_turar_department = rc.turar_department,
  connected_turar_room = rc.turar_room,
  updated_at = NOW()
FROM room_connections rc
WHERE TRIM(pf."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ") = TRIM(rc.projector_room)
  AND TRIM(pf."ОТДЕЛЕНИЕ") = TRIM(rc.projector_department);