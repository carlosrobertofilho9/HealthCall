-- Migration: Add audio_url to warnings table
-- This stores pre-generated TTS audio for each warning

ALTER TABLE warnings ADD COLUMN audio_url TEXT;
