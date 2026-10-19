-- Source-health counters + authorized image attribution for live event sync.
-- Does not create bookable inventory.

ALTER TABLE events ADD COLUMN IF NOT EXISTS image_attribution text;

ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS created_count integer NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS updated_count integer NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS rejected_count integer NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS failed_image_count integer NOT NULL DEFAULT 0;

ALTER TABLE event_sources ADD COLUMN IF NOT EXISTS last_success_at timestamptz;
ALTER TABLE event_sources ADD COLUMN IF NOT EXISTS last_error text;

UPDATE event_sources
SET last_success_at = last_synced_at
WHERE last_success_at IS NULL
  AND last_synced_at IS NOT NULL
  AND consecutive_failures = 0;

INSERT INTO schema_migrations (id)
VALUES ('007_event_pipeline_health')
ON CONFLICT (id) DO NOTHING;
