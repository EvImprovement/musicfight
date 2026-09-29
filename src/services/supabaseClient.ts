import { createClient } from '@supabase/supabase-js';
import type { LeaderboardEntry, GameModeType } from '../types/game';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Clean URL: automatically remove /rest/v1 or trailing slashes if accidentally included
const supabaseUrl = rawSupabaseUrl
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/rest\/?$/i, '')
  .replace(/\/+$/, '');

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConnected(): boolean {
  return !!supabase;
}

export interface PlayerProfile {
  id: string;
  username: string;
  pin?: string;
  created_at?: string;
}

const LOCAL_SCORES_KEY = 'musicfight_leaderboard_v1';
const LOCAL_USER_KEY = 'musicfight_user_name';
const LOCAL_PROFILE_KEY = 'musicfight_registered_player_v1';

export function getStoredPlayerProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_e) {}
  return null;
}

export function setStoredPlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(LOCAL_USER_KEY, profile.username);
  } catch (_e) {}
}

export function clearStoredPlayerProfile(): void {
  try {
    localStorage.removeItem(LOCAL_PROFILE_KEY);
  } catch (_e) {}
}

export function getStoredPlayerName(): string {
  const profile = getStoredPlayerProfile();
  if (profile?.username) return profile.username;
  return localStorage.getItem(LOCAL_USER_KEY) || 'Joueur' + Math.floor(Math.random() * 8999 + 1000);
}

export function setStoredPlayerName(name: string): void {
  localStorage.setItem(LOCAL_USER_KEY, name);
  const profile = getStoredPlayerProfile();
  if (profile) {
    profile.username = name;
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    } catch (_e) {}
  }
}

export async function registerPlayer(
  username: string,
  pin?: string
): Promise<{ success: boolean; profile?: PlayerProfile; error?: string }> {
  const cleanUsername = username.trim().slice(0, 16);
  if (!cleanUsername || cleanUsername.length < 2) {
    return { success: false, error: 'Le pseudo doit contenir au moins 2 caractères.' };
  }

  // 1. If Supabase is available, verify uniqueness in the "players" table
  if (supabase) {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('players')
        .select('id, username')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (!checkError && existing) {
        return {
          success: false,
          error: `Le pseudo "${cleanUsername}" est déjà réservé ! Si c'est votre compte, connectez-vous.`
        };
      }

      // Insert new player
      const { data: created, error: insertError } = await supabase
        .from('players')
        .insert([{
          username: cleanUsername,
          pin: pin ? pin.trim() : null
        }])
        .select()
        .single();

      if (!insertError && created) {
        const profile: PlayerProfile = {
          id: created.id,
          username: created.username,
          pin: created.pin,
          created_at: created.created_at
        };
        setStoredPlayerProfile(profile);
        return { success: true, profile };
      }
    } catch (_e) {
      // If table doesn't exist yet, fallback to local registration
    }
  }

  // Fallback to local profile
  const localProfile: PlayerProfile = {
    id: 'local_' + Date.now(),
    username: cleanUsername,
    pin: pin ? pin.trim() : undefined,
    created_at: new Date().toISOString()
  };
  setStoredPlayerProfile(localProfile);
  return { success: true, profile: localProfile };
}

export async function loginPlayer(
  username: string,
  pin?: string
): Promise<{ success: boolean; profile?: PlayerProfile; error?: string }> {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    return { success: false, error: 'Veuillez saisir votre pseudo.' };
  }

  if (supabase) {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('players')
        .select('id, username, pin, created_at')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (!fetchError && existing) {
        if (existing.pin && existing.pin !== (pin ? pin.trim() : '')) {
          return { success: false, error: 'Code PIN incorrect pour ce pseudo.' };
        }
        const profile: PlayerProfile = {
          id: existing.id,
          username: existing.username,
          pin: existing.pin,
          created_at: existing.created_at
        };
        setStoredPlayerProfile(profile);
        return { success: true, profile };
      } else if (!fetchError && !existing) {
        return { success: false, error: `Aucun joueur trouvé avec le pseudo "${cleanUsername}".` };
      }
    } catch (_e) {}
  }

  // Fallback local
  const localProfile: PlayerProfile = {
    id: 'local_' + Date.now(),
    username: cleanUsername,
    created_at: new Date().toISOString()
  };
  setStoredPlayerProfile(localProfile);
  return { success: true, profile: localProfile };
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
  } catch (_err) {
    // Local storage fallback
  }

  // 2. Try saving to Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase.from('leaderboard').insert([entry]).select().single();
      if (!error && data) {
        return data as LeaderboardEntry;
      }
    } catch (_e) {
      // Fallback to local
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
    } catch (_e) {
      // Fallback to local
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
