-- Добавление полей для закупочной информации в таблицу equipment
ALTER TABLE equipment
ADD COLUMN purchase_price numeric,
ADD COLUMN price_updated_at timestamp with time zone,
ADD COLUMN incoterms text,
ADD COLUMN supplier text,
ADD COLUMN supplier_status text CHECK (supplier_status IN ('Завод', 'Представительство', 'Дилер', 'Перекуп', 'Дистрибутор')),
ADD COLUMN supplier_contacts jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN equipment.purchase_price IS 'Цена закупа';
COMMENT ON COLUMN equipment.price_updated_at IS 'Дата обновления цены';
COMMENT ON COLUMN equipment.incoterms IS 'Условия инкотермс';
COMMENT ON COLUMN equipment.supplier IS 'Поставщик';
COMMENT ON COLUMN equipment.supplier_status IS 'Статус поставщика';
COMMENT ON COLUMN equipment.supplier_contacts IS 'Контакты поставщика в формате JSON массива объектов с полями: name, phones[], emails[], address, city';