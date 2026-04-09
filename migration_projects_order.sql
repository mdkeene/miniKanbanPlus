-- Migration to add project sorting order
ALTER TABLE projects ADD COLUMN IF NOT EXISTS orden_selector INTEGER DEFAULT 0;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
