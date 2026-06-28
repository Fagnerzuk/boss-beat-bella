import { supabase } from "@/integrations/supabase/client";
import type { AchievementKey, BossKey } from "./types";

const KEY = "bella_session_id";
const NAME_KEY = "bella_player_name";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getPlayerName(): string {
  if (typeof window === "undefined") return "Bella";
  return localStorage.getItem(NAME_KEY) || "Bella";
}

export function setPlayerName(name: string) {
  localStorage.setItem(NAME_KEY, name);
}

export async function ensureProgress() {
  const session_id = getSessionId();
  const player_name = getPlayerName();
  try {
    const { data } = await supabase
      .from("player_progress")
      .select("*")
      .eq("session_id", session_id)
      .maybeSingle();
    if (!data) {
      await supabase.from("player_progress").insert({ session_id, player_name });
    }
  } catch (e) { console.warn("ensureProgress", e); }
}

export async function saveProgress(stage: number, bossesDefeated: number) {
  const session_id = getSessionId();
  const player_name = getPlayerName();
  try {
    await supabase.from("player_progress")
      .upsert({ session_id, player_name, current_stage: stage, bosses_defeated: bossesDefeated, updated_at: new Date().toISOString() }, { onConflict: "session_id" });
    await supabase.from("leaderboard")
      .upsert({ session_id, player_name, max_stage: stage, updated_at: new Date().toISOString() }, { onConflict: "session_id" });
  } catch (e) { console.warn("saveProgress", e); }
}

export async function logAchievement(key: AchievementKey) {
  const session_id = getSessionId();
  try {
    await supabase.from("achievements").insert({ session_id, achievement_key: key });
  } catch (e) { /* unique violation = already had it, ignore */ }
}

export async function logRun(boss: BossKey, victory: boolean, seconds: number) {
  const session_id = getSessionId();
  try {
    await supabase.from("game_runs").insert({ session_id, boss_key: boss, victory, duration_seconds: seconds });
  } catch (e) { console.warn("logRun", e); }
}

export async function fetchAchievements(): Promise<string[]> {
  const session_id = getSessionId();
  const { data } = await supabase.from("achievements").select("achievement_key").eq("session_id", session_id);
  return data?.map(d => d.achievement_key) ?? [];
}

export async function fetchLeaderboard() {
  const { data } = await supabase
    .from("leaderboard")
    .select("player_name, max_stage, total_time_seconds, updated_at")
    .order("max_stage", { ascending: false })
    .limit(10);
  return data ?? [];
}