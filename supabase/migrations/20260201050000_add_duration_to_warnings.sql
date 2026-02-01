-- Add duration field to warnings table
-- Duration is stored in seconds for video/youtube warnings
ALTER TABLE warnings ADD COLUMN duration INTEGER;

COMMENT ON COLUMN warnings.duration IS 'Duration in seconds for video/youtube warnings. Used to control how long the warning is displayed.';
