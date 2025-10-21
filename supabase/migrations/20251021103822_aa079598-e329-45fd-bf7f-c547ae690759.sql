-- Ограничить редактирование отделений и кабинетов только для админов
-- Удаляем старые политики для INSERT, UPDATE и DELETE
DROP POLICY IF EXISTS "Admin and staff can insert projector floors" ON public.projector_floors;
DROP POLICY IF EXISTS "Admin and staff can update projector floors" ON public.projector_floors;
DROP POLICY IF EXISTS "Admin and staff can delete projector floors" ON public.projector_floors;

-- Создаём новые политики только для админов
CREATE POLICY "Only admins can insert projector floors"
ON public.projector_floors
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update projector floors"
ON public.projector_floors
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete projector floors"
ON public.projector_floors
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));