import React, { useState } from 'react';
import { Users, Crown, Copy, Check, Share2, Play, LogOut, Loader2, Music2, ShieldAlert } from 'lucide-react';
import type { RoomPlayer, RoomSettings, CategoryTheme, Track } from '../types/game';
import { PRESET_THEMES, getPlaylistTracks } from '../services/deezerApi';
import type { MultiplayerRoomManager } from '../services/multiplayerRoom';

interface MultiplayerLobbyProps {
  manager: MultiplayerRoomManager;
  players: RoomPlayer[];
  initialSettings?: RoomSettings;
  onStartGame: (settings: RoomSettings, tracks: Track[], distractorPool: Track[]) => void;
  onLeaveRoom: () => void;
}

const DEFAULT_SETTINGS: RoomSettings = {
  themeId: 'rap-fr',
  themeName: 'Rap Français',
  themeIcon: '🎙️',
  themeColor: 'linear-gradient(135deg, #8e2de2, #4a00e0)',
  trackCount: 10,
  timePerTrack: 10,
  gameplayMode: 'buzzer'
};

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  manager,
  players,
  initialSettings,
  onStartGame,
  onLeaveRoom
}) => {
  const [settings, setSettings] = useState<RoomSettings>(initialSettings || DEFAULT_SETTINGS);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const isHost = manager.isHost;

  // Synchronize settings changes if host updates them
  const updateSetting = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) => {
    if (!isHost) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    manager.sendEvent({
      type: 'SETTINGS_UPDATE',
      settings: next
    });
  };

  const selectTheme = (theme: CategoryTheme) => {
    if (!isHost) return;
    const next: RoomSettings = {
      ...settings,
      themeId: theme.id,
      themeName: theme.name,
      themeIcon: theme.icon,
      themeColor: theme.color
    };
    setSettings(next);
    manager.sendEvent({
      type: 'SETTINGS_UPDATE',
      settings: next
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(manager.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(manager.roomCode)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleHostLaunchGame = async () => {
    if (!isHost || isStarting) return;
    setIsStarting(true);
    setStartError(null);

    try {
      let selectedTracks: Track[] = [];
      let distractors: Track[] = [];

      if (settings.themeId === 'mix-all') {
        // Fetch from multiple preset themes
        const themesToSample = PRESET_THEMES.slice(0, 4);
        for (const t of themesToSample) {
          if (t.deezerId) {
            const tr = await getPlaylistTracks(t);
            selectedTracks.push(...tr.slice(0, 6));
            distractors.push(...tr);
          }
        }
      } else {
        const currentTheme = PRESET_THEMES.find(t => t.id === settings.themeId) || PRESET_THEMES[0];
        if (currentTheme.deezerId) {
          const tr = await getPlaylistTracks(currentTheme);
          selectedTracks = tr;
          distractors = tr;
        }
      }

      if (selectedTracks.length < 5) {
        setStartError("Impossible de charger assez de morceaux pour ce thème. Essayez un autre thème.");
        setIsStarting(false);
        return;
      }

      const shuffled = [...selectedTracks].sort(() => Math.random() - 0.5).slice(0, settings.trackCount);
      const startTimestamp = Date.now() + 3500; // 3.5s countdown

      // Broadcast start event to all guests
      await manager.sendEvent({
        type: 'GAME_STARTING',
        settings,
        tracks: shuffled,
        distractorPool: distractors,
        startTimestamp
      });

      // Launch locally on host
      onStartGame(settings, shuffled, distractors);
    } catch (err) {
      console.error(err);
      setStartError("Erreur réseau lors de la récupération des morceaux.");
      setIsStarting(false);
    }
  };

  return (
    <div className="lobby-container">
      {/* Top Header */}
      <div className="lobby-header-bar">
        <div className="lobby-code-badge-group">
          <span className="lobby-code-label">Salon :</span>
          <span className="lobby-code-value">{manager.roomCode}</span>
          <button
            onClick={handleCopyCode}
            className="lobby-code-action-btn"
            title="Copier le code"
            aria-label="Copier le code"
          >
            {copiedCode ? <Check className="icon-xs text-success" /> : <Copy className="icon-xs" />}
          </button>
          <button
            onClick={handleCopyLink}
            className="lobby-code-action-btn"
            title="Partager le lien d'invitation"
            aria-label="Partager le lien"
          >
            {copiedLink ? <Check className="icon-xs text-success" /> : <Share2 className="icon-xs" />}
          </button>
        </div>

        <button className="btn-secondary btn-sm lobby-leave-btn" onClick={onLeaveRoom}>
          <LogOut className="icon-xs" /> Quitter
        </button>
      </div>

      <div className="lobby-grid">
        {/* LEFT COLUMN: Players in room */}
        <div className="lobby-panel players-panel">
          <div className="lobby-panel-header">
            <div className="lobby-panel-title">
              <Users className="icon-sm text-cyan" />
              <h3>Joueurs connectés ({players.length})</h3>
            </div>
            <span className="live-status-pill">
              <span className="pulse-dot" /> En direct
            </span>
          </div>

          <div className="lobby-players-list">
            {players.map((player) => (
              <div
                key={player.id}
                className={`lobby-player-row ${player.id === manager.myPlayerId ? 'is-me' : ''}`}
              >
                <div className="player-avatar-circle">{player.avatar}</div>
                <div className="player-row-info">
                  <span className="player-row-name">
                    {player.name}
                    {player.id === manager.myPlayerId && <span className="you-tag">(Moi)</span>}
                  </span>
                  {player.isHost && (
                    <span className="host-badge">
                      <Crown className="icon-xs text-gold" /> Hôte
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="lobby-share-invite-box">
            <p className="invite-desc">Invite tes amis en leur partageant le code :</p>
            <div className="invite-code-pill" onClick={handleCopyCode}>
              <strong>{manager.roomCode}</strong>
              <Copy className="icon-xs text-muted" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings / Status */}
        <div className="lobby-panel settings-panel">
          <div className="lobby-panel-header">
            <div className="lobby-panel-title">
              <Music2 className="icon-sm text-pink" />
              <h3>Paramètres de la partie</h3>
            </div>
            {!isHost && (
              <span className="guest-waiting-badge">
                <span className="spinner-mini" /> Contrôlé par l'hôte
              </span>
            )}
          </div>

          {/* Theme selector */}
          <div className="settings-section">
            <label className="section-label">Thème musical :</label>
            <div className="themes-mini-grid">
              {PRESET_THEMES.map((t) => (
                <button
                  key={t.id}
                  disabled={!isHost}
                  onClick={() => selectTheme(t)}
                  className={`theme-mini-chip ${settings.themeId === t.id ? 'active' : ''}`}
                  style={{
                    borderColor: settings.themeId === t.id ? '#00f2fe' : undefined,
                    background: settings.themeId === t.id ? 'rgba(0, 242, 254, 0.15)' : undefined
                  }}
                >
                  <span className="theme-mini-icon">{t.icon}</span>
                  <span className="theme-mini-name">{t.name}</span>
                </button>
              ))}

              {/* Mix all option */}
              <button
                disabled={!isHost}
                onClick={() => updateSetting('themeId', 'mix-all')}
                className={`theme-mini-chip ${settings.themeId === 'mix-all' ? 'active' : ''}`}
                style={{
                  borderColor: settings.themeId === 'mix-all' ? '#ff007f' : undefined,
                  background: settings.themeId === 'mix-all' ? 'rgba(255, 0, 127, 0.15)' : undefined
                }}
              >
                <span className="theme-mini-icon">🎲</span>
                <span className="theme-mini-name">Mix de tous les thèmes</span>
              </button>
            </div>
          </div>

          {/* Gameplay mode */}
          <div className="settings-section">
            <label className="section-label">Mode de jeu :</label>
            <div className="gameplay-mode-selector">
              <button
                disabled={!isHost}
                onClick={() => updateSetting('gameplayMode', 'buzzer')}
                className={`mode-choice-btn ${settings.gameplayMode === 'buzzer' ? 'active' : ''}`}
              >
                <div className="mode-btn-header">
                  <span className="mode-emoji">⚡</span>
                  <strong>Buzzer Express</strong>
                </div>
                <span className="mode-btn-desc">Le premier qui trouve vole le point et bloque les autres !</span>
              </button>

              <button
                disabled={!isHost}
                onClick={() => updateSetting('gameplayMode', 'everyone')}
                className={`mode-choice-btn ${settings.gameplayMode === 'everyone' ? 'active' : ''}`}
              >
                <div className="mode-btn-header">
                  <span className="mode-emoji">🏆</span>
                  <strong>Classique (Chacun répond)</strong>
                </div>
                <span className="mode-btn-desc">Tout le monde peut répondre et gagne des points selon sa rapidité.</span>
              </button>
            </div>
          </div>

          {/* Track count */}
          <div className="settings-section">
            <label className="section-label">Nombre de morceaux :</label>
            <div className="track-counts-row">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  disabled={!isHost}
                  onClick={() => updateSetting('trackCount', num)}
                  className={`count-pill-btn ${settings.trackCount === num ? 'active' : ''}`}
                >
                  {num} titres
                </button>
              ))}
            </div>
          </div>

          {startError && (
            <div className="auth-alert error-alert">
              <ShieldAlert className="icon-xs" /> {startError}
            </div>
          )}

          {/* Bottom Action Button */}
          <div className="lobby-launch-footer">
            {isHost ? (
              <button
                className="btn-primary lobby-start-btn"
                onClick={handleHostLaunchGame}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="spinner-icon" /> Chargement des titres...
                  </>
                ) : (
                  <>
                    <Play className="icon-sm" /> Lancer la partie ({players.length} joueur{players.length > 1 ? 's' : ''})
                  </>
                )}
              </button>
            ) : (
              <div className="guest-waiting-indicator">
                <Loader2 className="spinner-icon text-cyan" />
                <span>En attente que l'hôte lance la partie...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
