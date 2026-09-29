import { supabase } from './supabaseClient';
import type { RoomPlayer, RoomBroadcastEvent } from '../types/game';

const AVATARS = ['🦊', '🦁', '🐯', '🐼', '🚀', '🎧', '⚡', '👑', '🔥', '💎', '🎸', '🕹️', '🐺', '🦄'];

export function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'MF-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getOrCreatePlayerSessionId(): string {
  try {
    let id = sessionStorage.getItem('musicfight_room_session_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      sessionStorage.setItem('musicfight_room_session_id', id);
    }
    return id;
  } catch (_) {
    return 'usr_' + Math.random().toString(36).substring(2, 9);
  }
}

export interface MultiplayerRoomManager {
  channel: any;
  roomCode: string;
  myPlayerId: string;
  isHost: boolean;
  sendEvent: (event: RoomBroadcastEvent) => Promise<void>;
  updateMyPresence: (updates: Partial<RoomPlayer>) => Promise<void>;
  leaveRoom: () => Promise<void>;
  subscribeEvents: (callback: (event: RoomBroadcastEvent) => void) => () => void;
}

export interface ConnectRoomOptions {
  roomCode: string;
  name: string;
  avatar: string;
  isHost: boolean;
  onPlayersChange: (players: RoomPlayer[]) => void;
  onEvent?: (event: RoomBroadcastEvent) => void;
  onConnectionStatus?: (status: 'connecting' | 'connected' | 'error' | 'disconnected') => void;
}

export async function connectToMultiplayerRoom(options: ConnectRoomOptions): Promise<MultiplayerRoomManager | null> {
  if (!supabase) {
    console.error('Supabase is not configured.');
    options.onConnectionStatus?.('error');
    return null;
  }

  const { roomCode, name, avatar, isHost, onPlayersChange, onEvent, onConnectionStatus } = options;
  const cleanCode = roomCode.toUpperCase().trim();
  const myPlayerId = getOrCreatePlayerSessionId();

  onConnectionStatus?.('connecting');

  const channel = supabase.channel(`room_${cleanCode}`, {
    config: {
      presence: { key: myPlayerId },
      broadcast: { self: false }
    }
  });

  let currentPresenceState: Record<string, any[]> = {};
  const eventListeners = new Set<(event: RoomBroadcastEvent) => void>();
  if (onEvent) {
    eventListeners.add(onEvent);
  }

  let roomManager: MultiplayerRoomManager | null = null;

  const parsePlayers = (presenceState: Record<string, any[]>): RoomPlayer[] => {
    const players: RoomPlayer[] = [];
    for (const key of Object.keys(presenceState)) {
      const presences = presenceState[key];
      if (presences && presences.length > 0) {
        const p = presences[presences.length - 1]; // latest
        players.push({
          id: p.id || key,
          name: p.name || 'Joueur',
          avatar: p.avatar || '🎧',
          isHost: !!p.isHost,
          score: p.score || 0,
          streak: p.streak || 0,
          isReady: !!p.isReady,
          isLockedOut: !!p.isLockedOut,
          lastPoints: p.lastPoints || 0
        });
      }
    }

    // Sort: Host first in lobby, otherwise by score desc
    return players.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  };

  let roomEstablished = isHost;

  const handlePresenceChange = () => {
    currentPresenceState = channel.presenceState();
    const players = parsePlayers(currentPresenceState);

    // Auto-host migration only if host left after room was established
    if (roomEstablished && players.length > 0 && !players.some(p => p.isHost)) {
      const newHost = players[0];
      if (newHost.id === myPlayerId && roomManager) {
        roomManager.isHost = true;
        roomManager.updateMyPresence({ isHost: true });
        newHost.isHost = true;
      }
    }

    onPlayersChange(players);
  };

  // Listen to Presence
  channel
    .on('presence', { event: 'sync' }, handlePresenceChange)
    .on('presence', { event: 'join' }, handlePresenceChange)
    .on('presence', { event: 'leave' }, handlePresenceChange);

  let lastQuestionStartEvent: RoomBroadcastEvent | null = null;

  // Listen to Broadcasts
  channel.on('broadcast', { event: 'ROOM_EVENT' }, (envelope: any) => {
    if (envelope && envelope.payload) {
      const event = envelope.payload as RoomBroadcastEvent;
      if (event.type === 'QUESTION_START') {
        lastQuestionStartEvent = event;
      } else if (event.type === 'GAME_OVER' || event.type === 'RETURN_TO_LOBBY') {
        lastQuestionStartEvent = null;
      }

      eventListeners.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error('Error in room event listener:', err);
        }
      });
    }
  });

  return new Promise((resolve) => {
    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        // If joining as guest, verify that the room exists and has an active Host
        if (!isHost) {
          const checkHostPresence = (): boolean => {
            const state = channel.presenceState();
            const currentPlayers = parsePlayers(state);
            return currentPlayers.some(p => p.isHost && p.id !== myPlayerId);
          };

          let hasHost = checkHostPresence();
          if (!hasHost) {
            // Wait up to 800ms for presence sync from Supabase
            await new Promise<void>((resolveCheck) => {
              const timer = setTimeout(resolveCheck, 800);
              const onSync = () => {
                if (checkHostPresence()) {
                  hasHost = true;
                  clearTimeout(timer);
                  resolveCheck();
                }
              };
              channel.on('presence', { event: 'sync' }, onSync);
            });
          }

          if (!hasHost) {
            console.warn(`[Multiplayer] Room "${cleanCode}" does not exist or has no active host.`);
            onConnectionStatus?.('error');
            try {
              await channel.unsubscribe();
            } catch (_) {}
            resolve(null);
            return;
          }

          roomEstablished = true;
        }

        onConnectionStatus?.('connected');

        // Track our presence
        await channel.track({
          id: myPlayerId,
          name,
          avatar,
          isHost,
          score: 0,
          streak: 0,
          isReady: true,
          joinedAt: Date.now()
        });

        roomManager = {
          channel,
          roomCode: cleanCode,
          myPlayerId,
          isHost,
          sendEvent: async (event: RoomBroadcastEvent) => {
            try {
              await channel.send({
                type: 'broadcast',
                event: 'ROOM_EVENT',
                payload: event
              });
            } catch (err) {
              console.error('Failed to broadcast room event:', err);
            }
          },
          updateMyPresence: async (updates: Partial<RoomPlayer>) => {
            try {
              const current = currentPresenceState[myPlayerId]?.[0] || {};
              await channel.track({
                ...current,
                ...updates,
                id: myPlayerId
              });
            } catch (err) {
              console.error('Failed to update presence:', err);
            }
          },
          leaveRoom: async () => {
            try {
              await channel.untrack();
              await channel.unsubscribe();
            } catch (_) {}
          },
          subscribeEvents: (callback: (event: RoomBroadcastEvent) => void) => {
            eventListeners.add(callback);
            if (lastQuestionStartEvent) {
              try {
                callback(lastQuestionStartEvent);
              } catch (err) {
                console.error('Failed to replay buffered QUESTION_START:', err);
              }
            }
            return () => {
              eventListeners.delete(callback);
            };
          }
        };

        resolve(roomManager);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onConnectionStatus?.('error');
        resolve(null);
      }
    });
  });
}
