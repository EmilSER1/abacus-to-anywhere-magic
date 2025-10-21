-- Create storage bucket for equipment documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-documents', 'equipment-documents', false);

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view equipment documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'equipment-documents');

-- Allow admin and staff to upload files
CREATE POLICY "Admin and staff can upload equipment documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'equipment-documents' 
  AND (get_current_user_role() = ANY (ARRAY['admin'::text, 'staff'::text]))
);

-- Allow admin and staff to delete files
CREATE POLICY "Admin and staff can delete equipment documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'equipment-documents' 
  AND (get_current_user_role() = ANY (ARRAY['admin'::text, 'staff'::text]))
);