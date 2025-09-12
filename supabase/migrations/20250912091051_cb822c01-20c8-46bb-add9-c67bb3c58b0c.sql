-- Создаем новый ID для отделения проектировщиков "Отделение гинекологии (25 коек)"
-- и обновляем все связанные таблицы

-- Сначала создаем новую запись в departments для проектировщиков с новым ID
INSERT INTO departments (id, name, created_at, updated_at)
VALUES (gen_random_uuid(), 'Отделение гинекологии (25 коек)', now(), now());

-- Получаем новый ID (для справки - он будет создан автоматически)
-- Теперь обновляем department_mappings - заменяем projector_department_id на новый
UPDATE department_mappings 
SET projector_department_id = (
    SELECT id FROM departments 
    WHERE name = 'Отделение гинекологии (25 коек)' 
    AND id != '4b6ab32a-66c1-4f96-88e4-befba6d9e81b'
    LIMIT 1
),
updated_at = now()
WHERE projector_department_id = '4b6ab32a-66c1-4f96-88e4-befba6d9e81b';

-- Обновляем room_connections - заменяем projector_department_id на новый
UPDATE room_connections 
SET projector_department_id = (
    SELECT id FROM departments 
    WHERE name = 'Отделение гинекологии (25 коек)' 
    AND id != '4b6ab32a-66c1-4f96-88e4-befba6d9e81b'
    LIMIT 1
),
updated_at = now()
WHERE projector_department_id = '4b6ab32a-66c1-4f96-88e4-befba6d9e81b';

-- Удаляем старую запись для проектировщиков (оставляем только для Турар)
DELETE FROM departments 
WHERE id = '4b6ab32a-66c1-4f96-88e4-befba6d9e81b' 
AND name = 'Отделение гинекологии (25 коек)';

-- Создаем заново запись для Турар с тем же ID
INSERT INTO departments (id, name, created_at, updated_at)
VALUES ('4b6ab32a-66c1-4f96-88e4-befba6d9e81b', 'Отделение гинекологии (25 коек)', now(), now())
ON CONFLICT (id) DO UPDATE SET updated_at = now();