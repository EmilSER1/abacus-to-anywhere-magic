-- Проверим что у нас есть и заполним данные
-- Сначала заполняем отделения если их нет
INSERT INTO public.departments (name)
SELECT DISTINCT normalized_name
FROM (
  SELECT TRIM(REGEXP_REPLACE("Отделение/Блок", '\s+', ' ', 'g')) as normalized_name 
  FROM turar_medical 
  WHERE "Отделение/Блок" IS NOT NULL
  UNION
  SELECT TRIM(REGEXP_REPLACE("ОТДЕЛЕНИЕ", '\s+', ' ', 'g')) as normalized_name 
  FROM projector_floors 
  WHERE "ОТДЕЛЕНИЕ" IS NOT NULL AND TRIM("ОТДЕЛЕНИЕ") != ''
) combined_departments
WHERE normalized_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.departments 
    WHERE name = normalized_name
  );

-- Заполняем кабинеты если их нет
WITH combined_rooms AS (
  SELECT DISTINCT 
    TRIM(REGEXP_REPLACE("Отделение/Блок", '\s+', ' ', 'g')) as dept_name,
    TRIM(REGEXP_REPLACE("Помещение/Кабинет", '\s+', ' ', 'g')) as normalized_room_name
  FROM turar_medical 
  WHERE "Отделение/Блок" IS NOT NULL AND "Помещение/Кабинет" IS NOT NULL
  UNION
  SELECT DISTINCT 
    TRIM(REGEXP_REPLACE("ОТДЕЛЕНИЕ", '\s+', ' ', 'g')) as dept_name,
    TRIM(REGEXP_REPLACE("НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", '\s+', ' ', 'g')) as normalized_room_name
  FROM projector_floors 
  WHERE "ОТДЕЛЕНИЕ" IS NOT NULL AND "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" IS NOT NULL 
    AND TRIM("ОТДЕЛЕНИЕ") != '' AND TRIM("НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ") != ''
)
INSERT INTO public.rooms (department_id, name)
SELECT d.id, cr.normalized_room_name
FROM combined_rooms cr
JOIN public.departments d ON d.name = cr.dept_name
WHERE cr.normalized_room_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.rooms 
    WHERE department_id = d.id AND name = cr.normalized_room_name
  );

-- Обновляем turar_medical с ID ссылками если еще не обновлены
UPDATE public.turar_medical tm
SET 
  department_id = d.id,
  room_id = r.id
FROM public.departments d
JOIN public.rooms r ON r.department_id = d.id
WHERE d.name = TRIM(REGEXP_REPLACE(tm."Отделение/Блок", '\s+', ' ', 'g'))
  AND r.name = TRIM(REGEXP_REPLACE(tm."Помещение/Кабинет", '\s+', ' ', 'g'))
  AND tm.department_id IS NULL;

-- Обновляем projector_floors с ID ссылками если еще не обновлены
UPDATE public.projector_floors pf
SET 
  department_id = d.id,
  room_id = r.id
FROM public.departments d
JOIN public.rooms r ON r.department_id = d.id
WHERE d.name = TRIM(REGEXP_REPLACE(pf."ОТДЕЛЕНИЕ", '\s+', ' ', 'g'))
  AND r.name = TRIM(REGEXP_REPLACE(pf."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", '\s+', ' ', 'g'))
  AND pf.department_id IS NULL;

-- Добавляем новые колонки в room_connections если их нет
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'room_connections' 
                AND column_name = 'turar_department_id') THEN
    ALTER TABLE public.room_connections 
    ADD COLUMN turar_department_id UUID REFERENCES public.departments(id),
    ADD COLUMN turar_room_id_new UUID REFERENCES public.rooms(id),
    ADD COLUMN projector_department_id UUID REFERENCES public.departments(id),
    ADD COLUMN projector_room_id_new UUID REFERENCES public.rooms(id);
  END IF;
END$$;

-- Заполняем новые ID колонки в room_connections если еще не заполнены
UPDATE public.room_connections rc
SET 
  turar_department_id = td.id,
  turar_room_id_new = tr.id,
  projector_department_id = pd.id,
  projector_room_id_new = pr.id
FROM 
  public.departments td,
  public.rooms tr,
  public.departments pd,
  public.rooms pr
WHERE 
  td.name = TRIM(REGEXP_REPLACE(rc.turar_department, '\s+', ' ', 'g'))
  AND tr.department_id = td.id 
  AND tr.name = rc.turar_room
  AND pd.name = TRIM(REGEXP_REPLACE(rc.projector_department, '\s+', ' ', 'g'))
  AND pr.department_id = pd.id 
  AND pr.name = rc.projector_room
  AND rc.turar_department_id IS NULL;