-- Включаем расширения для cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Создаем cron job для автоматического заполнения промежуточных таблиц
-- Запускается каждые 30 минут и проверяет новые сопоставления
SELECT cron.schedule(
  'auto-populate-mapped-departments',
  '*/30 * * * *', -- каждые 30 минут
  $$
  SELECT
    net.http_post(
        url:='https://yfmxvrpiqmwrcnkeskqc.supabase.co/functions/v1/bulk-populate-mapped-departments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmbXh2cnBpcW13cmNua2Vza3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMjg3OTEsImV4cCI6MjA3MjkwNDc5MX0.RWDRhlYenNrFSUXVcXtNRCDpXHOAiZzbDqOGHGAwBcI"}'::jsonb
    ) as request_id;
  $$
);