-- Добавляем колонки для ID в department_mappings если их еще нет
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'department_mappings' 
                AND column_name = 'turar_department_id') THEN
    ALTER TABLE public.department_mappings 
    ADD COLUMN turar_department_id UUID REFERENCES public.departments(id),
    ADD COLUMN projector_department_id UUID REFERENCES public.departments(id);
  END IF;
END$$;

-- Заполняем ID в department_mappings на основе названий
UPDATE public.department_mappings dm
SET 
  turar_department_id = td.id,
  projector_department_id = pd.id
FROM 
  public.departments td,
  public.departments pd
WHERE 
  td.name = TRIM(dm.turar_department)
  AND pd.name = TRIM(dm.projector_department)
  AND dm.turar_department_id IS NULL;