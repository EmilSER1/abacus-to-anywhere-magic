-- Создаем таблицы для хранения данных сопоставленных отделений

-- Таблица для данных проектировщиков сопоставленного отделения
CREATE TABLE IF NOT EXISTS public.mapped_projector_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Связь с mapping
  department_mapping_id UUID NOT NULL REFERENCES department_mappings(id) ON DELETE CASCADE,
  
  -- Связь с исходной записью
  original_record_id UUID NOT NULL REFERENCES projector_floors(id) ON DELETE CASCADE,
  
  -- Копии данных из projector_floors
  floor_number NUMERIC NOT NULL,
  block_name TEXT NOT NULL,
  department_name TEXT NOT NULL,
  room_code TEXT NOT NULL,
  room_name TEXT NOT NULL,
  room_area NUMERIC,
  equipment_code TEXT,
  equipment_name TEXT,
  equipment_unit TEXT,
  equipment_quantity TEXT,
  equipment_notes TEXT,
  
  -- Поля для связок с Турар
  linked_turar_room_id UUID REFERENCES mapped_turar_rooms(id) ON DELETE SET NULL,
  is_linked BOOLEAN NOT NULL DEFAULT false
);

-- Таблица для данных Турар сопоставленного отделения  
CREATE TABLE IF NOT EXISTS public.mapped_turar_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Связь с mapping
  department_mapping_id UUID NOT NULL REFERENCES department_mappings(id) ON DELETE CASCADE,
  
  -- Связь с исходной записью
  original_record_id UUID NOT NULL REFERENCES turar_medical(id) ON DELETE CASCADE,
  
  -- Копии данных из turar_medical
  department_name TEXT NOT NULL,
  room_name TEXT NOT NULL,
  equipment_code TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  equipment_quantity INTEGER NOT NULL,
  
  -- Поля для связок с проектировщиками
  linked_projector_room_id UUID REFERENCES mapped_projector_rooms(id) ON DELETE SET NULL,
  is_linked BOOLEAN NOT NULL DEFAULT false
);

-- Добавляем обратную ссылку в mapped_projector_rooms после создания mapped_turar_rooms
ALTER TABLE public.mapped_projector_rooms 
ADD CONSTRAINT fk_linked_turar_room 
FOREIGN KEY (linked_turar_room_id) REFERENCES mapped_turar_rooms(id) ON DELETE SET NULL;

-- Включаем RLS
ALTER TABLE public.mapped_projector_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapped_turar_rooms ENABLE ROW LEVEL SECURITY;

-- Создаем политики доступа
CREATE POLICY "Allow all operations on mapped_projector_rooms" 
ON public.mapped_projector_rooms 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on mapped_turar_rooms" 
ON public.mapped_turar_rooms 
FOR ALL 
USING (true);

-- Создаем индексы для производительности
CREATE INDEX idx_mapped_projector_department_mapping ON mapped_projector_rooms(department_mapping_id);
CREATE INDEX idx_mapped_projector_original ON mapped_projector_rooms(original_record_id);
CREATE INDEX idx_mapped_projector_room_name ON mapped_projector_rooms(room_name);

CREATE INDEX idx_mapped_turar_department_mapping ON mapped_turar_rooms(department_mapping_id);
CREATE INDEX idx_mapped_turar_original ON mapped_turar_rooms(original_record_id);
CREATE INDEX idx_mapped_turar_room_name ON mapped_turar_rooms(room_name);

-- Триггеры для обновления timestamps
CREATE TRIGGER update_mapped_projector_rooms_updated_at
  BEFORE UPDATE ON public.mapped_projector_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mapped_turar_rooms_updated_at
  BEFORE UPDATE ON public.mapped_turar_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();