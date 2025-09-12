-- Исправляем проблему с одинаковыми ID для отделения гинекологии
-- Создаем новую запись для проектировщиков с уникальным именем

-- 1. Сначала создаем новую запись для проектировщиков с немного измененным именем
INSERT INTO departments (id, name, created_at, updated_at)
VALUES (gen_random_uuid(), 'Отделение гинекологии (25 коек) - Проектировщики', now(), now());

-- 2. Получаем новый ID проектировщиков
DO $$
DECLARE
    new_projector_id uuid;
BEGIN
    -- Получаем ID новой записи проектировщиков
    SELECT id INTO new_projector_id 
    FROM departments 
    WHERE name = 'Отделение гинекологии (25 коек) - Проектировщики';
    
    -- Обновляем department_mappings
    UPDATE department_mappings 
    SET projector_department_id = new_projector_id,
        projector_department = 'Отделение гинекологии (25 коек) - Проектировщики',
        updated_at = now()
    WHERE projector_department_id = '4b6ab32a-66c1-4f96-88e4-befba6d9e81b';
    
    -- Обновляем room_connections
    UPDATE room_connections 
    SET projector_department_id = new_projector_id,
        projector_department = 'Отделение гинекологии (25 коек) - Проектировщики',
        updated_at = now()
    WHERE projector_department_id = '4b6ab32a-66c1-4f96-88e4-befba6d9e81b';
    
    -- Обновляем projector_floors
    UPDATE projector_floors 
    SET department_id = new_projector_id,
        updated_at = now()
    WHERE "ОТДЕЛЕНИЕ" = 'Отделение гинекологии (25 коек)';
    
END $$;