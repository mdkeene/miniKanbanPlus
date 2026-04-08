-- Migration to add recurring task columns to the tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS es_recurrente BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS frecuencia_recurrencia TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS fecha_fin_recurrencia TEXT;

-- Refresh PostgREST schema cache (optional but recommended)
NOTIFY pgrst, 'reload schema';
