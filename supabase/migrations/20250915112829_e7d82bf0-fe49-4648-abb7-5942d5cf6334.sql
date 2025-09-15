-- Создаем функцию для обновления конфигурации Edge Functions
-- Эта функция не требует изменений схемы, просто проверим что все готово для Edge Functions

-- Проверяем что у нас есть необходимые таблицы
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('room_connections', 'projector_floors', 'turar_medical');