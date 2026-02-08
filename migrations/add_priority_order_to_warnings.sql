-- Add priority and order columns to warnings table
-- Run this migration in your Supabase SQL editor

ALTER TABLE warnings 
  ADD COLUMN IF NOT EXISTS priority BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Set initial order values based on creation date
-- This ensures existing warnings have proper ordering
UPDATE warnings 
SET "order" = numbered.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_number 
  FROM warnings
) AS numbered
WHERE warnings.id = numbered.id
  AND warnings."order" IS NULL;

-- Optional: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_warnings_priority_order 
ON warnings(priority DESC, "order" ASC);
