-- Add technical specifications fields to equipment table
ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS dimensions text,
ADD COLUMN IF NOT EXISTS humidity_temperature text,
ADD COLUMN IF NOT EXISTS voltage text,
ADD COLUMN IF NOT EXISTS frequency text,
ADD COLUMN IF NOT EXISTS power_watts text,
ADD COLUMN IF NOT EXISTS power_watts_peak text,
ADD COLUMN IF NOT EXISTS ups text,
ADD COLUMN IF NOT EXISTS floor_load text,
ADD COLUMN IF NOT EXISTS floor_load_heaviest text,
ADD COLUMN IF NOT EXISTS ceiling_load_heaviest text,
ADD COLUMN IF NOT EXISTS chiller boolean,
ADD COLUMN IF NOT EXISTS exhaust text,
ADD COLUMN IF NOT EXISTS drainage text,
ADD COLUMN IF NOT EXISTS hot_water text,
ADD COLUMN IF NOT EXISTS cold_water text,
ADD COLUMN IF NOT EXISTS distilled_water text,
ADD COLUMN IF NOT EXISTS neutralization_tank text,
ADD COLUMN IF NOT EXISTS data_requirements text,
ADD COLUMN IF NOT EXISTS emergency_buttons text,
ADD COLUMN IF NOT EXISTS xray_warning_lamps text,
ADD COLUMN IF NOT EXISTS raised_floor text,
ADD COLUMN IF NOT EXISTS ceiling_drops text,
ADD COLUMN IF NOT EXISTS precision_ac boolean,
ADD COLUMN IF NOT EXISTS medical_gas_o2 text,
ADD COLUMN IF NOT EXISTS medical_gas_ma4 text,
ADD COLUMN IF NOT EXISTS medical_gas_ma7 text,
ADD COLUMN IF NOT EXISTS medical_gas_n2o text,
ADD COLUMN IF NOT EXISTS medical_gas_other text,
ADD COLUMN IF NOT EXISTS other_requirements text;

COMMENT ON COLUMN public.equipment.dimensions IS 'Размеры (Ш/Д/В), мм';
COMMENT ON COLUMN public.equipment.humidity_temperature IS 'Влажность и температура';
COMMENT ON COLUMN public.equipment.voltage IS 'Вольт';
COMMENT ON COLUMN public.equipment.frequency IS 'Частота';
COMMENT ON COLUMN public.equipment.power_watts IS 'Мощность в Ватт';
COMMENT ON COLUMN public.equipment.power_watts_peak IS 'Мощность Ватт пиковая';
COMMENT ON COLUMN public.equipment.ups IS 'Источник бесперебойного питания';
COMMENT ON COLUMN public.equipment.floor_load IS 'Нагрузка на пол';
COMMENT ON COLUMN public.equipment.floor_load_heaviest IS 'Нагрузка на пол - Самая тяжелая часть';
COMMENT ON COLUMN public.equipment.ceiling_load_heaviest IS 'Нагрузка на потолок - Самая тяжелая часть';
COMMENT ON COLUMN public.equipment.chiller IS 'Чиллер Да/Нет';
COMMENT ON COLUMN public.equipment.exhaust IS 'Вытяжка Диаметр и расход';
COMMENT ON COLUMN public.equipment.drainage IS 'Дренаж Диаметр и расход';
COMMENT ON COLUMN public.equipment.hot_water IS 'Горячая вода Диаметр и расход';
COMMENT ON COLUMN public.equipment.cold_water IS 'Холодная вода Диаметр и расход';
COMMENT ON COLUMN public.equipment.distilled_water IS 'Дистиллированная вода Диаметр и расход';
COMMENT ON COLUMN public.equipment.neutralization_tank IS 'Дренаж - резервуар для нейтрализации';
COMMENT ON COLUMN public.equipment.data_requirements IS 'Требования к данным Тип и количество';
COMMENT ON COLUMN public.equipment.emergency_buttons IS 'Кнопки экстренного вызова Количество';
COMMENT ON COLUMN public.equipment.xray_warning_lamps IS 'Рентгеновские предупреждающие лампы Количество и напряжение';
COMMENT ON COLUMN public.equipment.raised_floor IS 'Фальшпол Да/Нет и Глубина';
COMMENT ON COLUMN public.equipment.ceiling_drops IS 'Опуски плит Да/Нет и Глубина';
COMMENT ON COLUMN public.equipment.precision_ac IS 'Прецизионный кондиционер Да/Нет';
COMMENT ON COLUMN public.equipment.medical_gas_o2 IS 'Медгазы (O2) (Прямое подключение устройства)';
COMMENT ON COLUMN public.equipment.medical_gas_ma4 IS 'Медгазы (MA4) (Прямое подключение устройства)';
COMMENT ON COLUMN public.equipment.medical_gas_ma7 IS 'Медгазы (MA7) (Прямое подключение устройства)';
COMMENT ON COLUMN public.equipment.medical_gas_n2o IS 'Медгазы (N2O) (Прямое подключение устройства)';
COMMENT ON COLUMN public.equipment.medical_gas_other IS 'Медгазы (Другие) (Прямое подключение устройства)';
COMMENT ON COLUMN public.equipment.other_requirements IS 'Прочие требования';