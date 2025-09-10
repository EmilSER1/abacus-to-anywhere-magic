-- Создаем функцию для получения уникальных отделений Турар
CREATE OR REPLACE FUNCTION get_unique_turar_departments()
RETURNS TABLE(department_name text)
LANGUAGE sql
AS $$
  SELECT DISTINCT "Отделение/Блок" as department_name
  FROM turar_medical 
  WHERE "Отделение/Блок" IS NOT NULL
  ORDER BY "Отделение/Блок";
$$;

-- Создаем функцию для получения уникальных отделений Проектировщиков
CREATE OR REPLACE FUNCTION get_unique_projector_departments()
RETURNS TABLE(department_name text)
LANGUAGE sql
AS $$
  SELECT DISTINCT TRIM(REGEXP_REPLACE("ОТДЕЛЕНИЕ", '\s+', ' ', 'g')) as department_name
  FROM projector_floors 
  WHERE "ОТДЕЛЕНИЕ" IS NOT NULL 
    AND TRIM("ОТДЕЛЕНИЕ") != ''
  ORDER BY TRIM(REGEXP_REPLACE("ОТДЕЛЕНИЕ", '\s+', ' ', 'g'));
$$;