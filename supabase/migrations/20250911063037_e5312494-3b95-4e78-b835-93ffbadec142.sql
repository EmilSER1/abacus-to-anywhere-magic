-- Очищаем промежуточные таблицы с CASCADE
TRUNCATE TABLE mapped_projector_rooms, mapped_turar_rooms CASCADE;

-- Добавляем индексы для быстрого поиска по original_record_id
CREATE INDEX IF NOT EXISTS idx_mapped_projector_rooms_original_id ON mapped_projector_rooms (original_record_id);
CREATE INDEX IF NOT EXISTS idx_mapped_turar_rooms_original_id ON mapped_turar_rooms (original_record_id);

-- Добавляем индексы для быстрого поиска по department_mapping_id
CREATE INDEX IF NOT EXISTS idx_mapped_projector_rooms_dept_mapping ON mapped_projector_rooms (department_mapping_id);
CREATE INDEX IF NOT EXISTS idx_mapped_turar_rooms_dept_mapping ON mapped_turar_rooms (department_mapping_id);