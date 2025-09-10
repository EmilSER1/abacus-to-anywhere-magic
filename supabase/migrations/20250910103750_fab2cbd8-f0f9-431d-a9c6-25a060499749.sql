-- Создаем таблицу для связей между отделениями
CREATE TABLE public.department_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turar_department TEXT NOT NULL,
  projector_department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(turar_department, projector_department)
);

-- Включаем RLS
ALTER TABLE public.department_mappings ENABLE ROW LEVEL SECURITY;

-- Создаем политики для полного доступа
CREATE POLICY "Allow all operations on department_mappings" 
ON public.department_mappings 
FOR ALL 
USING (true);

-- Создаем триггер для обновления updated_at
CREATE TRIGGER update_department_mappings_updated_at
BEFORE UPDATE ON public.department_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();