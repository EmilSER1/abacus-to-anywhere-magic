-- Массовая синхронизация: обновляем ALL turar_medical записи для всех связанных отделений
UPDATE turar_medical tm
SET 
  connected_projector_department = pf.projector_department,
  updated_at = NOW()
FROM (
  SELECT DISTINCT 
    "ОТДЕЛЕНИЕ" as projector_department,
    connected_turar_department as turar_department
  FROM projector_floors 
  WHERE connected_turar_department IS NOT NULL
) pf
WHERE tm."Отделение/Блок" = pf.turar_department
  AND tm.connected_projector_department IS NULL;

-- Создаем связи комнат для всех отделений с department-level связями
-- Группируем по отделениям и создаем по 1 связи комнаты на каждую уникальную комбинацию
WITH department_pairs AS (
  SELECT DISTINCT 
    "ОТДЕЛЕНИЕ" as projector_dept,
    connected_turar_department as turar_dept
  FROM projector_floors 
  WHERE connected_turar_department IS NOT NULL
),
room_pairs AS (
  SELECT 
    dp.projector_dept,
    dp.turar_dept,
    pr.projector_room,
    pr.projector_room_id,
    tr.turar_room,
    tr.turar_room_id,
    ROW_NUMBER() OVER (PARTITION BY dp.projector_dept, dp.turar_dept ORDER BY pr.projector_room, tr.turar_room) as rn
  FROM department_pairs dp
  CROSS JOIN LATERAL (
    SELECT DISTINCT 
      "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" as projector_room,
      id as projector_room_id,
      ROW_NUMBER() OVER (ORDER BY "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ") as proj_rn
    FROM projector_floors pf 
    WHERE pf."ОТДЕЛЕНИЕ" = dp.projector_dept
    LIMIT 50  -- Ограничиваем количество комнат для каждого отделения
  ) pr
  CROSS JOIN LATERAL (
    SELECT DISTINCT 
      "Помещение/Кабинет" as turar_room,
      id as turar_room_id,
      ROW_NUMBER() OVER (ORDER BY "Помещение/Кабинет") as tur_rn
    FROM turar_medical tm 
    WHERE tm."Отделение/Блок" = dp.turar_dept
    LIMIT 50  -- Ограничиваем количество комнат для каждого отделения
  ) tr
  WHERE pr.proj_rn = tr.tur_rn  -- Связываем комнаты по порядку
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
  projector_dept,
  projector_room,
  turar_dept,
  turar_room,
  projector_room_id,
  turar_room_id
FROM room_pairs
WHERE rn <= 25  -- Максимум 25 связей комнат на отделение
ON CONFLICT DO NOTHING;  -- Избегаем дублирования

-- Обновляем projector_floors с конкретными связями комнат для всех отделений
UPDATE projector_floors 
SET 
  connected_turar_room = rc.turar_room,
  connected_turar_room_id = rc.turar_room_id,
  updated_at = NOW()
FROM room_connections rc
WHERE projector_floors."ОТДЕЛЕНИЕ" = rc.projector_department
  AND projector_floors."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" = rc.projector_room
  AND projector_floors.connected_turar_room IS NULL;

-- Обновляем turar_medical с конкретными связями комнат для всех отделений
UPDATE turar_medical
SET 
  connected_projector_room = rc.projector_room,
  connected_projector_room_id = rc.projector_room_id,
  updated_at = NOW()
FROM room_connections rc
WHERE turar_medical."Отделение/Блок" = rc.turar_department
  AND turar_medical."Помещение/Кабинет" = rc.turar_room
  AND turar_medical.connected_projector_room IS NULL;