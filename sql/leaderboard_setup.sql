-- -----------------------------------------------------------------------------
-- LEADERBOARD OPTIMIZATION SCRIPT (Materialized View + pg_cron)
-- Run this entire script in your Supabase Dashboard > SQL Editor
-- -----------------------------------------------------------------------------

-- 1. Enable pg_cron for scheduling automatic updates (if supported by your tier)
--    If this fails, you can skip it and manually refresh, or use Edge Functions.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Drop existing view if it exists (for clean setup)
DROP MATERIALIZED VIEW IF EXISTS leaderboard_snapshot;

-- 3. Create the Materialized View
--    This creates a static snapshot of the leaderboard with pre-calculated ranks.
CREATE MATERIALIZED VIEW leaderboard_snapshot AS
SELECT
  id,
  full_name,
  email,
  avatar_url,
  COALESCE(level, 1) as level,
  COALESCE(current_xp, 0) as current_xp,
  COALESCE(streak, 0) as streak,
  -- Pre-calculate Rank based on XP (Level Descending, then XP Descending)
  ROW_NUMBER() OVER (
    ORDER BY 
      COALESCE(level, 1) DESC, 
      COALESCE(current_xp, 0) DESC
  ) as rank_xp,
  -- Pre-calculate Rank based on Streak
  ROW_NUMBER() OVER (
    ORDER BY 
      COALESCE(streak, 0) DESC
  ) as rank_streak
FROM profiles;

-- 4. Create a Unique Index
--    Required to allow 'REFRESH MATERIALIZED VIEW CONCURRENTLY' (updates without locking the table)
CREATE UNIQUE INDEX leaderboard_snapshot_id_idx ON leaderboard_snapshot (id);

-- 5. Schedule Automatic Refresh (Every 5 Minutes)
--    This command tells Supabase to update the view automatically.
SELECT cron.schedule(
  'refresh_leaderboard_daily', -- Job Name
  '*/5 * * * *',               -- Schedule: Every 5 minutes
  'REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_snapshot'
);

-- -----------------------------------------------------------------------------
-- VERIFICATION COMMANDS (Run these separately to test)
-- -----------------------------------------------------------------------------
-- Check if it works:
-- SELECT * FROM leaderboard_snapshot WHERE rank_xp <= 10;
-- 
-- Manually force an update:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_snapshot;
