-- Add connection tracking columns to projector_floors and turar_medical tables
ALTER TABLE public.projector_floors 
ADD COLUMN IF NOT EXISTS connected_turar_department TEXT,
ADD COLUMN IF NOT EXISTS connected_turar_room TEXT;

ALTER TABLE public.turar_medical 
ADD COLUMN IF NOT EXISTS connected_projector_department TEXT,
ADD COLUMN IF NOT EXISTS connected_projector_room TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projector_floors_connections 
ON public.projector_floors(connected_turar_department, connected_turar_room);

CREATE INDEX IF NOT EXISTS idx_turar_medical_connections 
ON public.turar_medical(connected_projector_department, connected_projector_room);