-- Create a new public bucket for warning images
INSERT INTO storage.buckets (id, name, public)
VALUES ('warning-images', 'warning-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'warning-images');

-- Policy to allow authenticated users to update their files
CREATE POLICY "Allow authenticated users to update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'warning-images');

-- Policy to allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'warning-images');

-- Policy to allow public to view files (since it's a public bucket for display)
CREATE POLICY "Allow public to view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'warning-images');
