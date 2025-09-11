-- Создаем справочные таблицы для отделений и кабинетов
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department_id, name)
);

-- Добавляем RLS политики
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view departments" 
ON public.departments 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage departments" 
ON public.departments 
FOR ALL 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can view rooms" 
ON public.rooms 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage rooms" 
ON public.rooms 
FOR ALL 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);

-- Добавляем новые колонки в существующие таблицы
ALTER TABLE public.turar_medical 
ADD COLUMN department_id UUID REFERENCES public.departments(id),
ADD COLUMN room_id UUID REFERENCES public.rooms(id);

ALTER TABLE public.projector_floors 
ADD COLUMN department_id UUID REFERENCES public.departments(id),
ADD COLUMN room_id UUID REFERENCES public.rooms(id);

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_turar_medical_department_id ON public.turar_medical(department_id);
CREATE INDEX idx_turar_medical_room_id ON public.turar_medical(room_id);
CREATE INDEX idx_projector_floors_department_id ON public.projector_floors(department_id);
CREATE INDEX idx_projector_floors_room_id ON public.projector_floors(room_id);
CREATE INDEX idx_rooms_department_id ON public.rooms(department_id);

-- Добавляем триггеры для обновления updated_at
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Заполняем справочную таблицу отделений уникальными данными
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
WHERE normalized_name != '';

-- Заполняем справочную таблицу кабинетов
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
WHERE cr.normalized_room_name != '';

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

-- Обновляем room_connections чтобы использовать новые ID
ALTER TABLE public.room_connections 
ADD COLUMN turar_department_id UUID REFERENCES public.departments(id),
ADD COLUMN turar_room_id_new UUID REFERENCES public.rooms(id),
ADD COLUMN projector_department_id UUID REFERENCES public.departments(id),
ADD COLUMN projector_room_id_new UUID REFERENCES public.rooms(id);

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