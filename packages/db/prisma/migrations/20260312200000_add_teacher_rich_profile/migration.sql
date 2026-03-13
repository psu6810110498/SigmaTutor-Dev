-- Add rich profile fields to Teacher model
ALTER TABLE "teachers"
  ADD COLUMN IF NOT EXISTS "educationHistory" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "achievements"     TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "quote"            TEXT,
  ADD COLUMN IF NOT EXISTS "facebookUrl"      TEXT,
  ADD COLUMN IF NOT EXISTS "instagramUrl"     TEXT,
  ADD COLUMN IF NOT EXISTS "tiktokUrl"        TEXT,
  ADD COLUMN IF NOT EXISTS "linkedinUrl"      TEXT;
