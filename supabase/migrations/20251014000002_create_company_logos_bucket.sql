-- ====================================
-- CREATE STORAGE BUCKET FOR COMPANY LOGOS
-- ====================================

-- Create bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload company logos
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos' AND
  (storage.foldername(name))[1] = 'logos'
);

-- Allow anyone to view company logos (public bucket)
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Allow users to update logos they uploaded
CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos' AND
  (storage.foldername(name))[1] = 'logos' AND
  auth.uid()::text = (regexp_split_to_array((storage.filename(name)), '_'))[1]
);

-- Allow users to delete logos they uploaded
CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos' AND
  (storage.foldername(name))[1] = 'logos' AND
  auth.uid()::text = (regexp_split_to_array((storage.filename(name)), '_'))[1]
);
