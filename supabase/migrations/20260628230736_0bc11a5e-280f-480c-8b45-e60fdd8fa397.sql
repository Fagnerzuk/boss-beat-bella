
-- Player progress (anonymous session-based)
CREATE TABLE public.player_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  player_name TEXT NOT NULL DEFAULT 'Bella',
  current_stage INTEGER NOT NULL DEFAULT 0,
  bosses_defeated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.player_progress TO anon, authenticated;
GRANT ALL ON public.player_progress TO service_role;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read progress" ON public.player_progress FOR SELECT USING (true);
CREATE POLICY "anyone can insert progress" ON public.player_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update progress" ON public.player_progress FOR UPDATE USING (true) WITH CHECK (true);

-- Achievements unlocked
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, achievement_key)
);
GRANT SELECT, INSERT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "anyone can insert achievements" ON public.achievements FOR INSERT WITH CHECK (true);

-- Game run history
CREATE TABLE public.game_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  boss_key TEXT NOT NULL,
  victory BOOLEAN NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.game_runs TO anon, authenticated;
GRANT ALL ON public.game_runs TO service_role;
ALTER TABLE public.game_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read runs" ON public.game_runs FOR SELECT USING (true);
CREATE POLICY "anyone can insert runs" ON public.game_runs FOR INSERT WITH CHECK (true);

-- Public leaderboard
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  player_name TEXT NOT NULL,
  max_stage INTEGER NOT NULL DEFAULT 0,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.leaderboard TO anon, authenticated;
GRANT ALL ON public.leaderboard TO service_role;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read leaderboard" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "anyone can insert leaderboard" ON public.leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update leaderboard" ON public.leaderboard FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX idx_achievements_session ON public.achievements(session_id);
CREATE INDEX idx_game_runs_session ON public.game_runs(session_id);
CREATE INDEX idx_leaderboard_stage ON public.leaderboard(max_stage DESC, total_time_seconds ASC);
