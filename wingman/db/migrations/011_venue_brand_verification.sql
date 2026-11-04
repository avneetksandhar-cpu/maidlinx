-- Brand profile + verification gates for venue partner applications.
-- Applications stay pending. Admin approval still required.

ALTER TABLE venue_applications
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS contact_title text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS city text DEFAULT 'Miami',
  ADD COLUMN IF NOT EXISTS hero_photo_url text,
  ADD COLUMN IF NOT EXISTS authority_attested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accuracy_attested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS media_rights_attested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_checklist jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS contact_title text;
