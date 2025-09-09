-- Создание таблицы для связей комнат
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
CREATE INDEX IF NOT EXISTS idx_room_connections_turar ON room_connections (turar_department, turar_room);
CREATE INDEX IF NOT EXISTS idx_room_connections_projector ON room_connections (projector_department, projector_room);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для автоматического обновления updated_at
CREATE TRIGGER update_room_connections_updated_at BEFORE UPDATE ON room_connections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Включение Row Level Security (RLS)
ALTER TABLE room_connections ENABLE ROW LEVEL SECURITY;

-- Создание политики для полного доступа (можно настроить более детально)
CREATE POLICY "Allow all operations" ON room_connections FOR ALL USING (true);