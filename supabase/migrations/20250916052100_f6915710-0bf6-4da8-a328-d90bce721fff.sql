-- Добавляем поля ID для связей в room_connections
ALTER TABLE room_connections 
ADD COLUMN turar_room_id UUID,
ADD COLUMN projector_room_id UUID;

-- Создаем индексы для быстрого поиска по ID
CREATE INDEX IF NOT EXISTS idx_room_connections_turar_room_id ON room_connections (turar_room_id);
CREATE INDEX IF NOT EXISTS idx_room_connections_projector_room_id ON room_connections (projector_room_id);

-- Заполняем ID для существующих связей
UPDATE room_connections 
SET turar_room_id = (
  SELECT tm.id 
  FROM turar_medical tm 
  WHERE tm."Отделение/Блок" = room_connections.turar_department 
    AND tm."Помещение/Кабинет" = room_connections.turar_room 
  LIMIT 1
),
projector_room_id = (
  SELECT pf.id 
  FROM projector_floors pf 
  WHERE pf."ОТДЕЛЕНИЕ" = room_connections.projector_department 
    AND pf."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" = room_connections.projector_room 
  LIMIT 1
);

-- Создаем функцию для получения связанных комнат по ID
CREATE OR REPLACE FUNCTION get_room_connections_with_details()
RETURNS TABLE (
  connection_id UUID,
  turar_room_id UUID,
  turar_department TEXT,
  turar_room TEXT,
  projector_room_id UUID,
  projector_department TEXT,
  projector_room TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    rc.id as connection_id,
    rc.turar_room_id,
    tm."Отделение/Блок" as turar_department,
    tm."Помещение/Кабинет" as turar_room,
    rc.projector_room_id,
    pf."ОТДЕЛЕНИЕ" as projector_department,
    pf."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" as projector_room,
    rc.created_at,
    rc.updated_at
  FROM room_connections rc
  LEFT JOIN turar_medical tm ON tm.id = rc.turar_room_id
  LEFT JOIN projector_floors pf ON pf.id = rc.projector_room_id
  WHERE rc.turar_room_id IS NOT NULL AND rc.projector_room_id IS NOT NULL
  ORDER BY tm."Отделение/Блок", tm."Помещение/Кабинет";
$$;