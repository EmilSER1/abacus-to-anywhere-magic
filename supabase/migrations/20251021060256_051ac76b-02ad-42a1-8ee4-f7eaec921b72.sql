-- Создание таблицы equipment для хранения оборудования
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.projector_floors(id) ON DELETE CASCADE,
  equipment_code TEXT,
  equipment_name TEXT,
  equipment_type TEXT CHECK (equipment_type IN ('МИ', 'не МИ')),
  brand TEXT,
  country TEXT,
  specification TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  standard TEXT,
  quantity TEXT,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Включение Row Level Security
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Создание политик доступа
CREATE POLICY "All authenticated users can view equipment" 
ON public.equipment 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert equipment" 
ON public.equipment 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::text, 'staff'::text]));

CREATE POLICY "Authenticated users can update equipment" 
ON public.equipment 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'staff'::text]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::text, 'staff'::text]));

CREATE POLICY "Authenticated users can delete equipment" 
ON public.equipment 
FOR DELETE 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'staff'::text]));

-- Создание триггера для автоматического обновления updated_at
CREATE TRIGGER update_equipment_updated_at 
BEFORE UPDATE ON public.equipment 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_equipment_room_id ON public.equipment(room_id);
CREATE INDEX IF NOT EXISTS idx_equipment_code ON public.equipment(equipment_code);

-- Миграция существующих данных из projector_floors в equipment
INSERT INTO public.equipment (
  room_id,
  equipment_code,
  equipment_name,
  quantity,
  unit,
  notes
)
SELECT 
  pf.id as room_id,
  pf."Код оборудования" as equipment_code,
  pf."Наименование оборудования" as equipment_name,
  pf."Кол-во" as quantity,
  pf."Ед. изм." as unit,
  pf."Примечания" as notes
FROM public.projector_floors pf
WHERE pf."Код оборудования" IS NOT NULL
  AND pf."Код оборудования" != '';

-- Удаление старых колонок оборудования из projector_floors (опционально, можно оставить для совместимости)
-- ALTER TABLE public.projector_floors DROP COLUMN IF EXISTS "Код оборудования";
-- ALTER TABLE public.projector_floors DROP COLUMN IF EXISTS "Наименование оборудования";
-- ALTER TABLE public.projector_floors DROP COLUMN IF EXISTS "Ед. изм.";
-- ALTER TABLE public.projector_floors DROP COLUMN IF EXISTS "Кол-во";
-- ALTER TABLE public.projector_floors DROP COLUMN IF EXISTS "Примечания";