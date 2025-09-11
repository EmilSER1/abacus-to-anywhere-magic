-- Рефакторинг системы связей для использования ID вместо строк

-- 1. Обновляем таблицу room_connections для использования ID
ALTER TABLE room_connections 
ADD COLUMN projector_room_id UUID REFERENCES projector_floors(id),
ADD COLUMN turar_room_id UUID REFERENCES turar_medical(id);

-- 2. Обновляем projector_floors для использования ID
ALTER TABLE projector_floors 
ADD COLUMN connected_turar_room_id UUID REFERENCES turar_medical(id);

-- 3. Обновляем turar_medical для использования ID  
ALTER TABLE turar_medical
ADD COLUMN connected_projector_room_id UUID REFERENCES projector_floors(id);

-- 4. Заполняем новые ID колонки на основе существующих текстовых связей
UPDATE room_connections rc
SET 
  projector_room_id = pf.id,
  turar_room_id = tm.id
FROM projector_floors pf, turar_medical tm
WHERE TRIM(pf."НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ") = TRIM(rc.projector_room)
  AND TRIM(pf."ОТДЕЛЕНИЕ") = TRIM(rc.projector_department)
  AND TRIM(tm."Помещение/Кабинет") = TRIM(rc.turar_room)
  AND TRIM(tm."Отделение/Блок") = TRIM(rc.turar_department);

-- 5. Обновляем projector_floors на основе room_connections
UPDATE projector_floors pf
SET connected_turar_room_id = rc.turar_room_id
FROM room_connections rc
WHERE rc.projector_room_id = pf.id;

-- 6. Обновляем turar_medical на основе room_connections
UPDATE turar_medical tm
SET connected_projector_room_id = rc.projector_room_id  
FROM room_connections rc
WHERE rc.turar_room_id = tm.id;

-- 7. Создаем индексы для производительности
CREATE INDEX idx_projector_floors_connected_turar ON projector_floors(connected_turar_room_id);
CREATE INDEX idx_turar_medical_connected_projector ON turar_medical(connected_projector_room_id);
CREATE INDEX idx_room_connections_projector_id ON room_connections(projector_room_id);
CREATE INDEX idx_room_connections_turar_id ON room_connections(turar_room_id);