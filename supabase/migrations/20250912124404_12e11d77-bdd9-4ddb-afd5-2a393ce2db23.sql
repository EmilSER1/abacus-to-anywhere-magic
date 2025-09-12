-- Добавляем новые колонки для оборудования
ALTER TABLE projector_floors 
ADD COLUMN IF NOT EXISTS equipment_supplier TEXT,
ADD COLUMN IF NOT EXISTS equipment_price DECIMAL(15,2);

-- Создаем комментарии для новых колонок
COMMENT ON COLUMN projector_floors.equipment_supplier IS 'Поставщик оборудования (видно только администраторам)';
COMMENT ON COLUMN projector_floors.equipment_price IS 'Цена оборудования (видно только администраторам)';

-- Проверяем существование триггера и создаем если нужно
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_projector_floors_updated_at'
    ) THEN
        CREATE TRIGGER update_projector_floors_updated_at
        BEFORE UPDATE ON projector_floors
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;