-- Create a new storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true);

-- Allow authenticated users to upload voice messages
CREATE POLICY "Allow authenticated users to upload voice messages"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-messages');

-- Allow public access to voice messages
CREATE POLICY "Allow public access to voice messages"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'voice-messages');