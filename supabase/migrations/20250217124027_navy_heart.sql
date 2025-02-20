/*
  # Create storage bucket for message images

  1. Storage
    - Create a new storage bucket called 'message-images' for storing chat images
    - Set up public access policies for the bucket

  2. Security
    - Enable RLS policies for authenticated users to upload and read images
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true);

-- Set up storage policies
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'message-images');

CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);