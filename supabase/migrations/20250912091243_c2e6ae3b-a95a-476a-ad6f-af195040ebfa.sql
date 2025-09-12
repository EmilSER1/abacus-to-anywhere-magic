-- Создаем отдельную запись для проектировщиков с немного измененным названием
INSERT INTO departments (id, name, created_at, updated_at)
VALUES (gen_random_uuid(), 'Отделение гинекологии (25 коек) - Проектировщики', now(), now());

-- Обновляем department_mappings - заменяем projector_department_id на новый
UPDATE department_mappings 
SET projector_department_id = (
    SELECT id FROM departments 
    WHERE name = 'Отделение гинекологии (25 коек) - Проектировщики'
    LIMIT 1
),
projector_department = 'Отделение гинекологии (25 коек) - Проектировщики',
updated_at = now()
WHERE projector_department = 'Отделение гинекологии (25 коек)' 
AND projector_department_id = '4b6ab32a-66c1-4f96-88e4-befba6d9e81b';

-- Обновляем room_connections - заменяем projector_department_id на новый
UPDATE room_connections 
SET projector_department_id = (
    SELECT id FROM departments 
    WHERE name = 'Отделение гинекологии (25 коек) - Проектировщики'
    LIMIT 1
),
projector_department = 'Отделение гинекологии (25 коек) - Проектировщики',
updated_at = now()
WHERE projector_department = 'Отделение гинекологии (25 коек)';

-- Обновляем projector_floors таблицу
UPDATE projector_floors 
SET department_id = (
    SELECT id FROM departments 
    WHERE name = 'Отделение гинекологии (25 коек) - Проектировщики'
    LIMIT 1
),
updated_at = now()
WHERE "ОТДЕЛЕНИЕ" = 'Отделение гинекологии (25 коек)' 
AND department_id = '4b6ab32a-66c1-4f96-88e4-befba6d9e81b';