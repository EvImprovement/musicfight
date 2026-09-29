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
  const client = supabase;

  const { roomCode, name, avatar, isHost, onPlayersChange, onEvent, onConnectionStatus } = options;
  const cleanCode = roomCode.toUpperCase().trim();
  const myPlayerId = getOrCreatePlayerSessionId();

  onConnectionStatus?.('connecting');

  // Clean up any lingering channel instance with this topic in Supabase client
  const existingChannel = client.getChannels().find(ch => ch.topic === `realtime:room_${cleanCode}`);
  if (existingChannel) {
    try {
      await client.removeChannel(existingChannel);
    } catch (_) {}
  }

  const channel = client.channel(`room_${cleanCode}`, {
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
  let roomEstablished = isHost;
  let onHostConfirmed: (() => void) | null = null;

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

  const checkHasActiveHost = (state: Record<string, any[]>): boolean => {
    for (const key of Object.keys(state)) {
      const presences = state[key];
      if (presences && presences.some(p => p.isHost && p.id !== myPlayerId)) {
        return true;
      }
    }
    return false;
  };

  // Host answers PING from joining guests with fast PONG
  if (isHost) {
    channel.on('broadcast', { event: 'ROOM_PING' }, () => {
      channel.send({
        type: 'broadcast',
        event: 'ROOM_PONG',
        payload: { hostId: myPlayerId }
      }).catch(() => {});
    });
  } else {
    // Guest immediately confirms room validity upon receiving PONG
    channel.on('broadcast', { event: 'ROOM_PONG' }, () => {
      if (!roomEstablished) {
        roomEstablished = true;
        onHostConfirmed?.();
      }
    });
  }

  const handlePresenceChange = () => {
    currentPresenceState = channel.presenceState();
    const players = parsePlayers(currentPresenceState);

    // If guest was waiting for host presence, confirm now
    if (!roomEstablished && !isHost && checkHasActiveHost(currentPresenceState)) {
      roomEstablished = true;
      onHostConfirmed?.();
    }

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

  // Listen to Presence - MUST be registered BEFORE channel.subscribe()
  channel
    .on('presence', { event: 'sync' }, handlePresenceChange)
    .on('presence', { event: 'join' }, handlePresenceChange)
    .on('presence', { event: 'leave' }, handlePresenceChange);

  let lastQuestionStartEvent: RoomBroadcastEvent | null = null;

  // Listen to Broadcasts - MUST be registered BEFORE channel.subscribe()
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
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let isSettled = false;

    const finish = (result: MultiplayerRoomManager | null) => {
      if (isSettled) return;
      isSettled = true;
      if (globalTimeout) clearTimeout(globalTimeout);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      resolve(result);
    };

    // Absolute safety timeout: guarantees promise settles within 6s under any network condition
    const globalTimeout = setTimeout(() => {
      console.warn(`[Multiplayer] Room connection timed out for "${cleanCode}".`);
      onConnectionStatus?.('error');
      try {
        client.removeChannel(channel);
      } catch (_) {}
      finish(null);
    }, 6000);

    channel.subscribe(async (status: string) => {
      try {
        if (status === 'SUBSCRIBED') {
          // If joining as guest, verify that the room exists and has an active Host
          if (!isHost) {
            // Send instant PING broadcast to see if host is alive
            channel.send({
              type: 'broadcast',
              event: 'ROOM_PING',
              payload: { guestId: myPlayerId }
            }).catch(() => {});

            if (!checkHasActiveHost(channel.presenceState())) {
              const confirmed = await new Promise<boolean>((resolveHostCheck) => {
                onHostConfirmed = () => {
                  if (timeoutTimer) clearTimeout(timeoutTimer);
                  resolveHostCheck(true);
                };

                timeoutTimer = setTimeout(() => {
                  if (checkHasActiveHost(channel.presenceState())) {
                    resolveHostCheck(true);
                  } else {
                    resolveHostCheck(false);
                  }
                }, 2500);
              });

              if (!confirmed) {
                console.warn(`[Multiplayer] Room "${cleanCode}" does not exist or has no active host.`);
                onConnectionStatus?.('error');
                try {
                  await client.removeChannel(channel);
                } catch (_) {}
                finish(null);
                return;
              }
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
                await client.removeChannel(channel);
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

          finish(roomManager);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          onConnectionStatus?.('error');
          try {
            await client.removeChannel(channel);
          } catch (_) {}
          finish(null);
        }
      } catch (err) {
        console.error('[Multiplayer] Subscription error:', err);
        onConnectionStatus?.('error');
        try {
          await client.removeChannel(channel);
        } catch (_) {}
        finish(null);
      }
    });
  });
}
