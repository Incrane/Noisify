-- =====================================================
-- Enable Realtime for Tournament Tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable realtime for t_seasons
ALTER PUBLICATION supabase_realtime ADD TABLE t_seasons;

-- Enable realtime for t_match_days  
ALTER PUBLICATION supabase_realtime ADD TABLE t_match_days;

-- Enable realtime for t_player_stats
ALTER PUBLICATION supabase_realtime ADD TABLE t_player_stats;

-- Enable realtime for t_match_events
ALTER PUBLICATION supabase_realtime ADD TABLE t_match_events;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
