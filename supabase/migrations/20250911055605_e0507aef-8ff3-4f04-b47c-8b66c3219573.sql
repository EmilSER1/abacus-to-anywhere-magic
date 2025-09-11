-- Создаем функцию для синхронизации связей из room_connections в projector_floors
CREATE OR REPLACE FUNCTION sync_projector_room_connections()
RETURNS void AS $$
BEGIN
  -- Обновляем projector_floors на основе данных из room_connections
  UPDATE projector_floors pf
  SET 
    connected_turar_department = rc.turar_department,
    connected_turar_room = rc.turar_room,
    updated_at = NOW()
  FROM room_connections rc
  WHERE pf."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" = rc.projector_room
    AND pf."ОТДЕЛЕНИЕ" = rc.projector_department;
    
  -- Очищаем связи для помещений, которых нет в room_connections
  UPDATE projector_floors 
  SET 
    connected_turar_department = NULL,
    connected_turar_room = NULL,
    updated_at = NOW()
  WHERE (connected_turar_department IS NOT NULL OR connected_turar_room IS NOT NULL)
    AND NOT EXISTS (
      SELECT 1 FROM room_connections rc 
      WHERE projector_floors."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" = rc.projector_room
        AND projector_floors."ОТДЕЛЕНИЕ" = rc.projector_department
    );
END;
$$ LANGUAGE plpgsql;