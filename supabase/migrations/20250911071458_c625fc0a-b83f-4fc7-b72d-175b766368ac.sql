-- Обновляем turar_medical с ID ссылками
UPDATE public.turar_medical tm
SET 
  department_id = d.id,
  room_id = r.id
FROM public.departments d
JOIN public.rooms r ON r.department_id = d.id
WHERE d.name = TRIM(REGEXP_REPLACE(tm."Отделение/Блок", '\s+', ' ', 'g'))
  AND r.name = TRIM(REGEXP_REPLACE(tm."Помещение/Кабинет", '\s+', ' ', 'g'));

-- Обновляем projector_floors с ID ссылками  
UPDATE public.projector_floors pf
SET 
  department_id = d.id,
  room_id = r.id
FROM public.departments d
JOIN public.rooms r ON r.department_id = d.id
WHERE d.name = TRIM(REGEXP_REPLACE(pf."ОТДЕЛЕНИЕ", '\s+', ' ', 'g'))
  AND r.name = TRIM(REGEXP_REPLACE(pf."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", '\s+', ' ', 'g'));

-- Заполняем новые ID колонки в room_connections
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
  AND pr.name = rc.projector_room;

-- Исправляем security warning для функции
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';