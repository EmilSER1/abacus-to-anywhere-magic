-- Create a temporary mapping table to find the correct room_id for each room code
WITH room_mapping AS (
  SELECT DISTINCT ON ("КОД ПОМЕЩЕНИЯ")
    "КОД ПОМЕЩЕНИЯ",
    id as correct_room_id,
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ",
    "ЭТАЖ",
    "ОТДЕЛЕНИЕ",
    "БЛОК"
  FROM projector_floors
  WHERE "КОД ПОМЕЩЕНИЯ" IS NOT NULL AND "КОД ПОМЕЩЕНИЯ" != ''
  ORDER BY "КОД ПОМЕЩЕНИЯ", created_at
)
-- Update equipment to use the correct room_id based on the room code
UPDATE equipment e
SET room_id = rm.correct_room_id
FROM projector_floors pf
JOIN room_mapping rm ON pf."КОД ПОМЕЩЕНИЯ" = rm."КОД ПОМЕЩЕНИЯ"
WHERE e.room_id = pf.id;