-- Migration: Add audio_url to patients table
-- This stores pre-generated TTS audio for patient calls

ALTER TABLE patients ADD COLUMN audio_url TEXT;
