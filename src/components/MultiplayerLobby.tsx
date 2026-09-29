import React, { useState, useEffect } from 'react';
import { Users, Crown, Copy, Check, Share2, Play, LogOut, Loader2, Music2, ShieldAlert, Disc3, Search } from 'lucide-react';
import type { RoomPlayer, RoomSettings, CategoryTheme, Track, Option } from '../types/game';
import { PRESET_THEMES, getPlaylistTracks, searchAlbums, getAlbumTracks } from '../services/deezerApi';
import type { MultiplayerRoomManager } from '../services/multiplayerRoom';

interface PresetAlbum {
  id: number;
  title: string;
  artistName: string;
  cover: string;
}

const POPULAR_ALBUMS: PresetAlbum[] = [
  { id: 92404172, title: 'Deux Frères', artistName: 'PNL', cover: 'https://e-cdns-images.dzcdn.net/images/cover/b498f3b7f525bfb53eb5ff95dfbbddfa/250x250-000000-80-0-0.jpg' },
  { id: 90967392, title: 'Destin', artistName: 'Ninho', cover: 'https://e-cdns-images.dzcdn.net/images/cover/4b42b6a5059df1bfbbf86e3f524fb7b8/250x250-000000-80-0-0.jpg' },
  { id: 302127, title: 'Discovery', artistName: 'Daft Punk', cover: 'https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/250x250-000000-80-0-0.jpg' },
  { id: 140552052, title: 'Thriller', artistName: 'Michael Jackson', cover: 'https://e-cdns-images.dzcdn.net/images/cover/0c79e7be940562e105e1199a5e810eb7/250x250-000000-80-0-0.jpg' },
  { id: 15858688, title: 'Ipséité', artistName: 'Damso', cover: 'https://e-cdns-images.dzcdn.net/images/cover/a4a984fe7a68393e8e19e71ec29f2709/250x250-000000-80-0-0.jpg' },
  { id: 272186712, title: 'Civilisation', artistName: 'Orelsan', cover: 'https://e-cdns-images.dzcdn.net/images/cover/6c650117f7b39fdf774ee8fcbe33b5c3/250x250-000000-80-0-0.jpg' },
  { id: 136331902, title: 'After Hours', artistName: 'The Weeknd', cover: 'https://e-cdns-images.dzcdn.net/images/cover/c93498de1bb96d744f4d2f8e12ec6824/250x250-000000-80-0-0.jpg' },
  { id: 14682496, title: 'Cyborg', artistName: 'Nekfeu', cover: 'https://e-cdns-images.dzcdn.net/images/cover/4243b9ee3c4456545ebc4a8cf6fb008c/250x250-000000-80-0-0.jpg' }
];

interface MultiplayerLobbyProps {
  manager: MultiplayerRoomManager;
  players: RoomPlayer[];
  initialSettings?: RoomSettings;
  onStartGame: (
    settings: RoomSettings,
    tracks: Track[],
    distractorPool: Track[],
    initialQuestion?: {
      questionIndex: number;
      startTime: number;
      correctOptionId: string | number;
      correctOption: Option;
      options: Option[];
    }
  ) => void;
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

  const [themeTab, setThemeTab] = useState<'presets' | 'albums'>(
    (initialSettings?.themeType === 'album' || initialSettings?.themeId.startsWith('album-')) ? 'albums' : 'presets'
  );
  const [albumQuery, setAlbumQuery] = useState('');
  const [albumResults, setAlbumResults] = useState<any[]>([]);
  const [isSearchingAlbums, setIsSearchingAlbums] = useState(false);

  const isHost = manager.isHost || !!players.find(p => p.id === manager.myPlayerId)?.isHost;

  // Sync settings when initialSettings changes or on broadcast
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      if (initialSettings.themeType === 'album' || initialSettings.themeId.startsWith('album-')) {
        setThemeTab('albums');
      }
    }
  }, [initialSettings]);

  useEffect(() => {
    const unsub = manager.subscribeEvents((event) => {
      if (event.type === 'SETTINGS_UPDATE') {
        setSettings(event.settings);
        if (event.settings.themeType === 'album' || event.settings.themeId.startsWith('album-')) {
          setThemeTab('albums');
        }
      }
    });
    return unsub;
  }, [manager]);

  // Debounced search for albums
  useEffect(() => {
    if (!albumQuery.trim() || themeTab !== 'albums') {
      setAlbumResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingAlbums(true);
      try {
        const res = await searchAlbums(albumQuery);
        setAlbumResults(res);
      } catch (_) {
        setAlbumResults([]);
      } finally {
        setIsSearchingAlbums(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [albumQuery, themeTab]);

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
    const currentThemeIds = settings.themeIds || [settings.themeId];
    let nextThemeIds: string[];

    if (currentThemeIds.includes(theme.id)) {
      // If clicking already selected theme and more than 1 selected, toggle it off
      if (currentThemeIds.length > 1) {
        nextThemeIds = currentThemeIds.filter(id => id !== theme.id);
      } else {
        return;
      }
    } else {
      nextThemeIds = [...currentThemeIds, theme.id];
    }

    const selectedThemes = PRESET_THEMES.filter(t => nextThemeIds.includes(t.id));
    const isMulti = selectedThemes.length > 1;

    const next: RoomSettings = {
      ...settings,
      themeId: nextThemeIds[0],
      themeIds: nextThemeIds,
      themeType: isMulti ? 'mixed' : selectedThemes[0].type,
      themeName: isMulti ? selectedThemes.map(t => t.name).join(' + ') : selectedThemes[0].name,
      themeIcon: isMulti ? '🔀' : selectedThemes[0].icon,
      themeColor: isMulti ? 'linear-gradient(135deg, #ff007f, #7928ca, #00f2fe)' : selectedThemes[0].color,
      albumId: undefined,
      albumArtist: undefined,
      albumCover: undefined
    };
    setSettings(next);
    manager.sendEvent({
      type: 'SETTINGS_UPDATE',
      settings: next
    });
  };

  const selectAlbum = (album: { id: number | string; title: string; artistName: string; cover?: string }) => {
    if (!isHost) return;
    const next: RoomSettings = {
      ...settings,
      themeId: `album-${album.id}`,
      themeIds: [`album-${album.id}`],
      themeType: 'album',
      themeName: `${album.title} • ${album.artistName}`,
      themeIcon: '💿',
      themeColor: 'linear-gradient(135deg, #11998e, #38ef7d)',
      albumId: album.id,
      albumArtist: album.artistName,
      albumCover: album.cover
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

      if (settings.themeType === 'album' || settings.themeId.startsWith('album-')) {
        const albumId = settings.albumId || settings.themeId.replace('album-', '');
        const tr = await getAlbumTracks(albumId, settings.themeName, settings.albumArtist || '', settings.albumCover);
        if (tr.length < 4) {
          setStartError("Cet album ne contient pas assez d'extraits musicaux. Essayez un autre album.");
          setIsStarting(false);
          return;
        }
        selectedTracks = tr;
        distractors = [...tr];

        // If album has fewer than 12 tracks, supplement distractors from the artist or chart so 4 choices always exist
        if (distractors.length < 12) {
          try {
            const chartData = await getPlaylistTracks(PRESET_THEMES[0]);
            distractors = [...distractors, ...chartData.filter(c => !distractors.some(d => d.id === c.id))];
          } catch (_) {}
        }
      } else {
        const currentThemeIds = settings.themeIds || [settings.themeId];
        const selectedThemes = PRESET_THEMES.filter(t => currentThemeIds.includes(t.id));

        if (selectedThemes.length > 1) {
          // Multi-theme selection: combine playlists!
          const mixedTheme: CategoryTheme = {
            id: `mixed-${selectedThemes.map(t => t.id).join('-')}`,
            name: selectedThemes.map(t => t.name).join(' + '),
            description: `Mix combiné de ${selectedThemes.length} playlists`,
            icon: '🔀',
            type: 'mixed',
            combinedThemes: selectedThemes,
            color: settings.themeColor
          };
          const tr = await getPlaylistTracks(mixedTheme);
          selectedTracks = tr;
          distractors = tr;
        } else {
          const currentTheme = selectedThemes[0] || PRESET_THEMES[0];
          if (currentTheme.deezerId) {
            const tr = await getPlaylistTracks(currentTheme);
            selectedTracks = tr;
            distractors = tr;
          }
        }
      }

      if (selectedTracks.length < 4) {
        setStartError("Impossible de charger assez de morceaux pour ce thème. Essayez un autre thème.");
        setIsStarting(false);
        return;
      }

      const trackCount = Math.min(settings.trackCount, selectedTracks.length);
      const shuffled = [...selectedTracks].sort(() => Math.random() - 0.5).slice(0, trackCount);
      const startTimestamp = Date.now() + 3500; // 3.5s synchronized countdown

      // Prepare Question 0 immediately so both Host and Guests start synchronously
      const track0 = shuffled[0];
      const otherTracks = distractors.filter(t => t.id !== track0.id && t.title !== track0.title);
      const shuffledOthers = [...otherTracks].sort(() => Math.random() - 0.5).slice(0, 3);

      const correctOpt: Option = {
        id: track0.id,
        title: track0.title,
        artistName: track0.artist.name,
        isTrackTitle: true
      };

      const distractorOpts: Option[] = shuffledOthers.map((t, idx) => ({
        id: `dist_${idx}_${t.id}`,
        title: t.title,
        artistName: t.artist.name,
        isTrackTitle: true
      }));

      const options = [correctOpt, ...distractorOpts].sort(() => Math.random() - 0.5);

      const initialQuestion = {
        questionIndex: 0,
        startTime: startTimestamp,
        correctOptionId: correctOpt.id,
        correctOption: correctOpt,
        options
      };

      // Broadcast start event to all guests with Question 0 included
      await manager.sendEvent({
        type: 'GAME_STARTING',
        settings,
        tracks: shuffled,
        distractorPool: distractors,
        startTimestamp,
        initialQuestion
      });

      // Launch locally on host
      onStartGame(settings, shuffled, distractors, initialQuestion);
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <label className="section-label" style={{ margin: 0 }}>Thème(s) musical :</label>
              {isHost && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {themeTab === 'presets'
                    ? (settings.themeIds && settings.themeIds.length > 1
                        ? `🔀 ${settings.themeIds.length} styles combinés`
                        : '💡 Cliquez pour combiner plusieurs thèmes')
                    : '💿 Mode Album complet'}
                </span>
              )}
            </div>

            {/* Active Album Banner */}
            {settings.themeType === 'album' && (
              <div className="lobby-active-album-card">
                <div className="lobby-active-album-cover">
                  {settings.albumCover ? (
                    <img src={settings.albumCover} alt={settings.themeName} />
                  ) : (
                    <span>💿</span>
                  )}
                </div>
                <div className="lobby-active-album-details">
                  <span className="lobby-active-album-tag">💿 Album sélectionné</span>
                  <h4 className="lobby-active-album-title">{settings.themeName}</h4>
                </div>
              </div>
            )}

            {/* Theme Tabs (Playlists vs Albums) */}
            {isHost && (
              <div className="lobby-theme-tabs">
                <button
                  type="button"
                  className={`lobby-theme-tab-btn ${themeTab === 'presets' ? 'active' : ''}`}
                  onClick={() => setThemeTab('presets')}
                >
                  <Music2 className="icon-xs" /> Playlists ({PRESET_THEMES.length})
                </button>
                <button
                  type="button"
                  className={`lobby-theme-tab-btn ${themeTab === 'albums' ? 'active' : ''}`}
                  onClick={() => setThemeTab('albums')}
                >
                  <Disc3 className="icon-xs" /> Albums ({POPULAR_ALBUMS.length}+)
                </button>
              </div>
            )}

            {/* Content: Playlists */}
            {themeTab === 'presets' && (
              <div className="themes-mini-grid">
                {PRESET_THEMES.map((t) => {
                  const currentThemeIds = settings.themeIds || [settings.themeId];
                  const isSelected = currentThemeIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      disabled={!isHost}
                      onClick={() => selectTheme(t)}
                      className={`theme-mini-chip ${isSelected ? 'active' : ''}`}
                      style={{
                        borderColor: isSelected ? 'var(--accent-cyan)' : undefined,
                        background: isSelected ? 'rgba(0, 242, 254, 0.18)' : undefined
                      }}
                    >
                      <span className="theme-mini-icon">{t.icon}</span>
                      <span className="theme-mini-name">{t.name}</span>
                      {isSelected && currentThemeIds.length > 1 && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 900 }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Content: Albums */}
            {themeTab === 'albums' && (
              <div className="lobby-albums-container">
                {isHost && (
                  <div className="lobby-album-search-wrapper">
                    <Search className="icon-xs text-muted lobby-album-search-icon" />
                    <input
                      type="text"
                      className="lobby-album-search-input"
                      placeholder="Rechercher un album (ex: PNL, Daft Punk, Orelsan...)"
                      value={albumQuery}
                      onChange={(e) => setAlbumQuery(e.target.value)}
                    />
                    {isSearchingAlbums && <Loader2 className="spinner-mini lobby-album-search-spinner" />}
                  </div>
                )}

                {/* Album Search Results */}
                {albumResults.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Résultats de recherche :
                    </span>
                    <div className="lobby-album-grid" style={{ marginTop: '0.35rem' }}>
                      {albumResults.map((alb) => {
                        const isSelected = settings.albumId === alb.id || settings.themeId === `album-${alb.id}`;
                        return (
                          <button
                            key={alb.id}
                            type="button"
                            disabled={!isHost}
                            onClick={() => selectAlbum(alb)}
                            className={`lobby-album-chip ${isSelected ? 'active' : ''}`}
                          >
                            <img src={alb.cover} alt={alb.title} className="lobby-album-thumb" />
                            <div className="lobby-album-meta">
                              <span className="lobby-album-name">{alb.title}</span>
                              <span className="lobby-album-artist">{alb.artistName}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Preset Iconic Albums */}
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Albums cultes populaires :
                  </span>
                  <div className="lobby-album-grid" style={{ marginTop: '0.35rem' }}>
                    {POPULAR_ALBUMS.map((alb) => {
                      const isSelected = settings.albumId === alb.id || settings.themeId === `album-${alb.id}`;
                      return (
                        <button
                          key={alb.id}
                          type="button"
                          disabled={!isHost}
                          onClick={() => selectAlbum(alb)}
                          className={`lobby-album-chip ${isSelected ? 'active' : ''}`}
                        >
                          <img src={alb.cover} alt={alb.title} className="lobby-album-thumb" />
                          <div className="lobby-album-meta">
                            <span className="lobby-album-name">{alb.title}</span>
                            <span className="lobby-album-artist">{alb.artistName}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
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
