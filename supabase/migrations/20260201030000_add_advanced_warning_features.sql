-- Add advanced features columns to warnings table

-- media_type: 'image', 'video', 'youtube'
ALTER TABLE warnings 
ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'image';

-- qrcode_url: Optional URL for QR Code generation
ALTER TABLE warnings 
ADD COLUMN IF NOT EXISTS qrcode_url text;

-- Scheduling: Optional start and end times
ALTER TABLE warnings 
ADD COLUMN IF NOT EXISTS start_time time;

ALTER TABLE warnings 
ADD COLUMN IF NOT EXISTS end_time time;

-- Add a check constraint for media_type
ALTER TABLE warnings 
ADD CONSTRAINT warnings_media_type_check 
CHECK (media_type IN ('image', 'video', 'youtube'));
