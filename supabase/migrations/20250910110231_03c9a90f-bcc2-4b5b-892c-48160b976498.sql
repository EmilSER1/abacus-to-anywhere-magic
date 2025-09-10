-- Исправляем функции с корректным search_path для безопасности
CREATE OR REPLACE FUNCTION get_unique_turar_departments()
RETURNS TABLE(department_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT "Отделение/Блок" as department_name
  FROM turar_medical 
  WHERE "Отделение/Блок" IS NOT NULL
  ORDER BY "Отделение/Блок";
$$;

CREATE OR REPLACE FUNCTION get_unique_projector_departments()
RETURNS TABLE(department_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT TRIM(REGEXP_REPLACE("ОТДЕЛЕНИЕ", '\s+', ' ', 'g')) as department_name
  FROM projector_floors 
  WHERE "ОТДЕЛЕНИЕ" IS NOT NULL 
    AND TRIM("ОТДЕЛЕНИЕ") != ''
  ORDER BY TRIM(REGEXP_REPLACE("ОТДЕЛЕНИЕ", '\s+', ' ', 'g'));
$$;