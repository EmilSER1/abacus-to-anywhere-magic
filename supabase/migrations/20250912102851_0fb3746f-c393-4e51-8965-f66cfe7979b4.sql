-- Добавляем новые поля для оборудования проектировщиков
ALTER TABLE projector_floors 
ADD COLUMN IF NOT EXISTS equipment_status TEXT DEFAULT 'Не найдено',
ADD COLUMN IF NOT EXISTS equipment_specification TEXT,
ADD COLUMN IF NOT EXISTS equipment_documents TEXT;

-- Создаем тип для статуса оборудования
CREATE TYPE equipment_status_type AS ENUM ('Согласовано', 'Не согласовано', 'Не найдено');

-- Изменяем колонку статуса чтобы использовать enum
ALTER TABLE projector_floors 
ALTER COLUMN equipment_status DROP DEFAULT,
ALTER COLUMN equipment_status TYPE equipment_status_type USING equipment_status::equipment_status_type,
ALTER COLUMN equipment_status SET DEFAULT 'Не найдено';