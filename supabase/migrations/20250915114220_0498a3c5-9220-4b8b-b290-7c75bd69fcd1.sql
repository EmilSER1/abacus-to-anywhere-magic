-- Обновляем turar_medical записи для отделения "Дневной стационар (30 коек)"
-- чтобы показать связь с проектировщиками
UPDATE turar_medical 
SET 
  connected_projector_department = 'Дневной стационар терапевтический профиль (12 коек)',
  updated_at = NOW()
WHERE "Отделение/Блок" = 'Дневной стационар (30 коек)';

-- Создаем связи комнат между проектировщиками и турар для этого отделения
-- Берем первые 10 комнат из каждого отделения и связываем их
WITH projector_rooms AS (
  SELECT DISTINCT 
    "ОТДЕЛЕНИЕ" as projector_dept,
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" as projector_room,
    id as projector_room_id,
    ROW_NUMBER() OVER (ORDER BY "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ") as rn
  FROM projector_floors 
  WHERE "ОТДЕЛЕНИЕ" = 'Дневной стационар терапевтический профиль (12 коек)'
  LIMIT 10
),
turar_rooms AS (
  SELECT DISTINCT 
    "Отделение/Блок" as turar_dept,
    "Помещение/Кабинет" as turar_room,
    id as turar_room_id,
    ROW_NUMBER() OVER (ORDER BY "Помещение/Кабинет") as rn
  FROM turar_medical 
  WHERE "Отделение/Блок" = 'Дневной стационар (30 коек)'
  LIMIT 10
)
INSERT INTO room_connections (
  projector_department, 
  projector_room, 
  turar_department, 
  turar_room,
  projector_room_id,
  turar_room_id
)
SELECT 
  p.projector_dept,
  p.projector_room,
  t.turar_dept,
  t.turar_room,
  p.projector_room_id,
  t.turar_room_id
FROM projector_rooms p
JOIN turar_rooms t ON p.rn = t.rn;

-- Обновляем projector_floors с конкретными связями комнат
UPDATE projector_floors 
SET 
  connected_turar_room = rc.turar_room,
  connected_turar_room_id = rc.turar_room_id,
  updated_at = NOW()
FROM room_connections rc
WHERE projector_floors."ОТДЕЛЕНИЕ" = rc.projector_department
  AND projector_floors."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" = rc.projector_room
  AND projector_floors."ОТДЕЛЕНИЕ" = 'Дневной стационар терапевтический профиль (12 коек)';

-- Обновляем turar_medical с конкретными связями комнат  
UPDATE turar_medical
SET 
  connected_projector_room = rc.projector_room,
  connected_projector_room_id = rc.projector_room_id,
  updated_at = NOW()
FROM room_connections rc
WHERE turar_medical."Отделение/Блок" = rc.turar_department
  AND turar_medical."Помещение/Кабинет" = rc.turar_room
  AND turar_medical."Отделение/Блок" = 'Дневной стационар (30 коек)';