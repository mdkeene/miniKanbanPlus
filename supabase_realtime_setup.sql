-- ==========================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- ==========================================
-- Run this in your Supabase Dashboard -> SQL Editor
-- This allows the application to "listen" for changes in these tables.

-- 1. Enable Realtime for the 'tasks' table
alter publication supabase_realtime add table tasks;
alter table tasks replica identity full;

-- 2. Enable Realtime for the 'profiles' table
alter publication supabase_realtime add table profiles;
alter table profiles replica identity full;

-- 3. (Verification) You can check if they are enabled by running:
-- select * from pg_publication_tables where pubname = 'supabase_realtime';
