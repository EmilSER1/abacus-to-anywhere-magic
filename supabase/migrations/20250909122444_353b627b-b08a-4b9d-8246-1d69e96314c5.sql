-- Удаляем старые таблицы
DROP TABLE IF EXISTS projector_equipment CASCADE;
DROP TABLE IF EXISTS turar_equipment CASCADE;
DROP TABLE IF EXISTS room_connections CASCADE;

-- Создаем таблицу проектировщиков точно по JSON структуре
CREATE TABLE IF NOT EXISTS projector_floors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "ЭТАЖ" NUMERIC NOT NULL,
  "БЛОК" TEXT NOT NULL,
  "ОТДЕЛЕНИЕ" TEXT NOT NULL,
  "КОД ПОМЕЩЕНИЯ" TEXT NOT NULL,
  "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ" TEXT NOT NULL,
  "Код помещения" TEXT,
  "Наименование помещения" TEXT,
  "Площадь (м2)" NUMERIC,
  "Код оборудования" TEXT,
  "Наименование оборудования" TEXT,
  "Ед. изм." TEXT,
  "Кол-во" TEXT,
  "Примечания" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Создаем таблицу турар точно по JSON структуре
CREATE TABLE IF NOT EXISTS turar_medical (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "Отделение/Блок" TEXT NOT NULL,
  "Помещение/Кабинет" TEXT NOT NULL,
  "Код оборудования" TEXT NOT NULL,
  "Наименование" TEXT NOT NULL,
  "Кол-во" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Создаем таблицу для связей комнат
CREATE TABLE IF NOT EXISTS room_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  turar_department TEXT NOT NULL,
  turar_room TEXT NOT NULL,
  projector_department TEXT NOT NULL,
  projector_room TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_projector_floors_etazh ON projector_floors ("ЭТАЖ");
CREATE INDEX IF NOT EXISTS idx_projector_floors_otdelenie ON projector_floors ("ОТДЕЛЕНИЕ");
CREATE INDEX IF NOT EXISTS idx_projector_floors_kod_pomeshcheniya ON projector_floors ("КОД ПОМЕЩЕНИЯ");

CREATE INDEX IF NOT EXISTS idx_turar_medical_otdelenie ON turar_medical ("Отделение/Блок");
CREATE INDEX IF NOT EXISTS idx_turar_medical_pomeshchenie ON turar_medical ("Помещение/Кабинет");

CREATE INDEX IF NOT EXISTS idx_room_connections_turar ON room_connections (turar_department, turar_room);
CREATE INDEX IF NOT EXISTS idx_room_connections_projector ON room_connections (projector_department, projector_room);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_projector_floors_updated_at 
BEFORE UPDATE ON projector_floors 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turar_medical_updated_at 
BEFORE UPDATE ON turar_medical 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_connections_updated_at 
BEFORE UPDATE ON room_connections 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включение Row Level Security (RLS)
ALTER TABLE projector_floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE turar_medical ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_connections ENABLE ROW LEVEL SECURITY;

-- Создание политик для полного доступа
CREATE POLICY "Allow all operations on projector_floors" ON projector_floors FOR ALL USING (true);
CREATE POLICY "Allow all operations on turar_medical" ON turar_medical FOR ALL USING (true);
CREATE POLICY "Allow all operations on room_connections" ON room_connections FOR ALL USING (true);