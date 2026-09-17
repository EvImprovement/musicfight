import { createClient } from '@supabase/supabase-js';
import type { LeaderboardEntry, GameModeType } from '../types/game';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_SCORES_KEY = 'musicfight_leaderboard_v1';
const LOCAL_USER_KEY = 'musicfight_user_name';

export function getStoredPlayerName(): string {
  return localStorage.getItem(LOCAL_USER_KEY) || 'Melomane' + Math.floor(Math.random() * 8999 + 1000);
}

export function setStoredPlayerName(name: string): void {
  localStorage.setItem(LOCAL_USER_KEY, name);
}

export async function saveGameScore(entry: Omit<LeaderboardEntry, 'id' | 'created_at'>): Promise<LeaderboardEntry> {
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    created_at: new Date().toISOString()
  };

  // 1. Always save in LocalStorage fallback
  try {
    const existing: LeaderboardEntry[] = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || '[]');
    existing.push(newEntry);
    // Sort descending by score
    existing.sort((a, b) => b.score - a.score);
    // Keep top 100
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch (err) {
    console.warn('Erreur sauvegarde locale score:', err);
  }

  // 2. Try saving to Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase.from('leaderboard').insert([entry]).select().single();
      if (!error && data) {
        return data as LeaderboardEntry;
      }
    } catch (e) {
      console.warn('Supabase save score fallback to local:', e);
    }
  }

  return newEntry;
}

export async function fetchLeaderboard(mode?: GameModeType): Promise<LeaderboardEntry[]> {
  // 1. Try Supabase first if available
  if (supabase) {
    try {
      let query = supabase.from('leaderboard').select('*').order('score', { ascending: false }).limit(50);
      if (mode) {
        query = query.eq('mode', mode);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as LeaderboardEntry[];
      }
    } catch (e) {
      console.warn('Supabase fetch leaderboard error, fallback local:', e);
    }
  }

  // 2. Fallback to LocalStorage + mock entries if empty for immediate demo
  try {
    let local: LeaderboardEntry[] = JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || '[]');
    
    // Seed default fun high scores if empty
    if (local.length === 0) {
      local = [
        { id: '1', player_name: 'Mozart2.0', score: 980, accuracy: 100, mode: 'classic', category_name: 'Top 50 France', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', player_name: 'DJ_Neon', score: 920, accuracy: 90, mode: 'classic', category_name: 'Electro & Dance', created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', player_name: 'RapMaster', score: 870, accuracy: 90, mode: 'classic', category_name: 'Rap Français', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: '4', player_name: 'RockFan80', score: 810, accuracy: 80, mode: 'classic', category_name: 'Rock & Metal', created_at: new Date(Date.now() - 172800000).toISOString() }
      ];
      localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(local));
    }

    if (mode) {
      local = local.filter(e => e.mode === mode);
    }
    return local.sort((a, b) => b.score - a.score);
  } catch (_) {
    return [];
  }
}
