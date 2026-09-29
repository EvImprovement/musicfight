import React, { useState, useEffect } from 'react';
import { Search, Music2, Sparkles, Disc, Loader2, Play, Library, Users, Shuffle, Check } from 'lucide-react';
import { PRESET_THEMES, searchArtists, searchAlbums } from '../services/deezerApi';
import type { CategoryTheme } from '../types/game';

interface ThemeSelectorProps {
  onSelectTheme: (theme: CategoryTheme) => void;
  onOpenMultiplayer?: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onSelectTheme, onOpenMultiplayer }) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'search' | 'albums'>('themes');
  
  // Multi-theme selection (Mix Mode)
  const [isMixMode, setIsMixMode] = useState(false);
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  
  // Artist search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Album search
  const [albumQuery, setAlbumQuery] = useState('');
  const [albumResults, setAlbumResults] = useState<any[]>([]);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);

  // Debounce search query for Artists
  useEffect(() => {
    if (!searchQuery.trim() || activeTab !== 'search') {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSearch(true);
      const results = await searchArtists(searchQuery);
      setSearchResults(results);
      setIsLoadingSearch(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Debounce search query for Albums
  useEffect(() => {
    if (!albumQuery.trim() || activeTab !== 'albums') {
      setAlbumResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingAlbums(true);
      const results = await searchAlbums(albumQuery);
      setAlbumResults(results);
      setIsLoadingAlbums(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [albumQuery, activeTab]);

  const handleSelectArtist = (artist: any) => {
    const customTheme: CategoryTheme = {
      id: `artist-${artist.id}`,
      name: artist.name,
      description: `Spécial Blind Test : Les meilleurs titres de ${artist.name}`,
      icon: '🎤',
      type: 'artist',
      deezerId: artist.id,
      query: artist.name,
      coverUrl: artist.picture,
      color: 'linear-gradient(135deg, #654ea3, #eaafc8)'
    };
    onSelectTheme(customTheme);
  };

  const handleSelectAlbum = (album: any) => {
    const customTheme: CategoryTheme = {
      id: `album-${album.id}`,
      name: album.title,
      description: `Spécial Album : ${album.title} par ${album.artistName}`,
      icon: '💿',
      type: 'album',
      deezerId: album.id,
      query: album.artistName,
      coverUrl: album.cover,
      color: 'linear-gradient(135deg, #ff007f, #7928ca)'
    };
    onSelectTheme(customTheme);
  };

  const toggleThemeSelection = (themeId: string) => {
    setSelectedThemeIds(prev =>
      prev.includes(themeId) ? prev.filter(id => id !== themeId) : [...prev, themeId]
    );
  };

  const handleLaunchMix = () => {
    const selectedThemes = PRESET_THEMES.filter(t => selectedThemeIds.includes(t.id));
    if (selectedThemes.length < 2) return;

    const mixedTheme: CategoryTheme = {
      id: `mixed-${selectedThemes.map(t => t.id).join('-')}`,
      name: selectedThemes.map(t => t.name).join(' + '),
      description: `Mix combiné de ${selectedThemes.length} playlists (${selectedThemes.map(t => t.name).join(', ')})`,
      icon: '🔀',
      type: 'mixed',
      combinedThemes: selectedThemes,
      color: 'linear-gradient(135deg, #ff007f, #7928ca, #00f2fe)'
    };
    onSelectTheme(mixedTheme);
  };

  return (
    <div className="theme-selector-container">
      {/* Hero Welcome Header */}
      <div className="hero-banner">
        <div className="hero-logo-badge-wrapper">
          <img src="/logo.png" alt="MusicFight Logo" className="hero-logo-img" />
        </div>
        <div className="hero-content">
          <span className="hero-badge">
            <Sparkles className="icon-xs" /> Playlists • Artistes • Albums
          </span>
          <h1 className="hero-title">Prêt à relever le défi du Blind Test ?</h1>
          <p className="hero-subtitle">
            Choisissez une playlist, un artiste ou un album culte, écoutez l'extrait et devinez le titre en moins de 10s !
          </p>
        </div>
      </div>

      {/* Live Multiplayer Banner */}
      {onOpenMultiplayer && (
        <div className="multiplayer-banner" onClick={onOpenMultiplayer} role="button" tabIndex={0}>
          <div className="multiplayer-banner-content">
            <div className="multiplayer-badge-live">
              <span className="pulse-dot" /> NOUVEAU • SALONS PRIVÉS
            </div>
            <h3 className="multiplayer-banner-title">
              <Users className="icon-sm text-pink" /> Jouez en direct avec vos amis !
            </h3>
            <p className="multiplayer-banner-desc">
              Créez un salon avec un code ou rejoignez vos proches en temps réel (Buzzer & synchronisation sonore).
            </p>
          </div>
          <button className="btn-primary multiplayer-banner-btn" onClick={(e) => { e.stopPropagation(); onOpenMultiplayer(); }}>
            <Users className="icon-sm" /> Créer / Rejoindre
          </button>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="selector-tabs">
        <button
          className={`tab-btn ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          <Disc className="tab-icon" />
          <span className="tab-label-full">Playlists Thématiques</span>
          <span className="tab-label-short">Playlists</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search className="tab-icon" />
          <span className="tab-label-full">Rechercher un Artiste</span>
          <span className="tab-label-short">Artistes</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'albums' ? 'active' : ''}`}
          onClick={() => setActiveTab('albums')}
        >
          <Library className="tab-icon" />
          <span className="tab-label-full">Rechercher un Album</span>
          <span className="tab-label-short">Albums</span>
        </button>
      </div>

      {/* TAB 1: Preset Playlists */}
      {activeTab === 'themes' && (
        <div className="themes-tab-wrapper">
          {/* Sub-header with Mix Mode Toggle */}
          <div className="themes-sub-bar">
            <p className="themes-sub-hint">
              {isMixMode
                ? 'Sélectionnez au moins 2 playlists pour créer votre blind test combiné :'
                : 'Choisissez une playlist ou combinez-en plusieurs avec le Mode Mix :'}
            </p>
            <button
              className={`mix-mode-toggle-btn ${isMixMode ? 'active' : ''}`}
              onClick={() => {
                setIsMixMode(!isMixMode);
                if (isMixMode) setSelectedThemeIds([]);
              }}
            >
              <Shuffle className="icon-xs" />
              <span>{isMixMode ? 'Désactiver le Mode Mix' : 'Mode Mix (Combiner les styles)'}</span>
            </button>
          </div>

          <div className="theme-grid">
            {PRESET_THEMES.map((theme) => {
              const isSelected = selectedThemeIds.includes(theme.id);
              return (
                <div
                  key={theme.id}
                  className={`theme-card ${isMixMode ? 'mix-mode-card' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (isMixMode) {
                      toggleThemeSelection(theme.id);
                    } else {
                      onSelectTheme(theme);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{ '--theme-gradient': theme.color } as React.CSSProperties}
                >
                  <div className="card-header-bg" style={{ background: theme.color }}>
                    <span className="theme-emoji">{theme.icon}</span>
                    {isMixMode && (
                      <div className={`mix-checkbox-badge ${isSelected ? 'checked' : ''}`}>
                        {isSelected ? <Check className="icon-xs text-white" /> : null}
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="theme-title-row">
                      <h3 className="theme-name">{theme.name}</h3>
                    </div>
                    <p className="theme-desc">{theme.description}</p>
                    <div className="card-footer">
                      {isMixMode ? (
                        <span className={`mix-select-pill ${isSelected ? 'active' : ''}`}>
                          {isSelected ? '✓ Sélectionné' : '+ Ajouter au Mix'}
                        </span>
                      ) : (
                        <span className="play-badge">
                          <Play className="play-icon" /> Jouer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Sticky Bar when in Mix Mode with selections */}
          {isMixMode && selectedThemeIds.length > 0 && (
            <div className="mix-floating-bar">
              <div className="mix-floating-info">
                <div className="mix-floating-title">
                  <Shuffle className="icon-sm text-cyan" />
                  <span><strong>{selectedThemeIds.length}</strong> styles sélectionnés</span>
                </div>
                <p className="mix-floating-names">
                  {PRESET_THEMES.filter(t => selectedThemeIds.includes(t.id)).map(t => t.name).join(' • ')}
                </p>
              </div>
              <div className="mix-floating-actions">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setSelectedThemeIds([])}
                >
                  Effacer
                </button>
                <button
                  className="btn-primary mix-launch-btn"
                  disabled={selectedThemeIds.length < 2}
                  onClick={handleLaunchMix}
                >
                  <Play className="icon-xs" /> Lancer le Mix ({selectedThemeIds.length})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Artist Search */}
      {activeTab === 'search' && (
        <div className="search-section">
          <div className="search-bar-wrapper">
            <Search className="search-input-icon" />
            <input
              type="text"
              placeholder="Ex: Jul, Daft Punk, Queen, Taylor Swift, Ninho, Eminem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              autoFocus
            />
            {isLoadingSearch && <Loader2 className="spinner-icon" />}
          </div>

          <div className="artist-results-grid">
            {searchResults.map((artist) => (
              <div
                key={artist.id}
                className="artist-card"
                onClick={() => handleSelectArtist(artist)}
                role="button"
                tabIndex={0}
              >
                <div className="artist-avatar-wrapper">
                  {artist.picture ? (
                    <img src={artist.picture} alt={artist.name} className="artist-avatar" />
                  ) : (
                    <div className="artist-avatar-placeholder">
                      <Music2 className="icon-md" />
                    </div>
                  )}
                </div>
                <div className="artist-info">
                  <h4 className="artist-name">{artist.name}</h4>
                  <span className="artist-badge">
                    {artist.nb_fans ? `${artist.nb_fans.toLocaleString('fr-FR')} fans` : 'Blind Test Spécial'}
                  </span>
                </div>
                <button className="artist-play-btn">
                  <Play className="play-icon-sm" /> Lancer
                </button>
              </div>
            ))}

            {!isLoadingSearch && searchQuery.trim() && searchResults.length === 0 && (
              <div className="empty-search-state">
                <Music2 className="empty-icon" />
                <p>Aucun artiste trouvé pour "{searchQuery}". Essayez un autre nom !</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Album Search */}
      {activeTab === 'albums' && (
        <div className="search-section">
          <div className="search-bar-wrapper">
            <Library className="search-input-icon" />
            <input
              type="text"
              placeholder="Ex: Discovery Daft Punk, Deux Frères PNL, Thriller, Civilisation..."
              value={albumQuery}
              onChange={(e) => setAlbumQuery(e.target.value)}
              className="search-input"
              autoFocus
            />
            {isLoadingAlbums && <Loader2 className="spinner-icon" />}
          </div>

          <div className="artist-results-grid">
            {albumResults.map((album) => (
              <div
                key={album.id}
                className="artist-card album-result-card"
                onClick={() => handleSelectAlbum(album)}
                role="button"
                tabIndex={0}
              >
                <div className="artist-avatar-wrapper album-cover-wrapper">
                  {album.cover ? (
                    <img src={album.cover} alt={album.title} className="artist-avatar album-cover-square" />
                  ) : (
                    <div className="artist-avatar-placeholder">
                      <Disc className="icon-md" />
                    </div>
                  )}
                </div>
                <div className="artist-info">
                  <h4 className="artist-name">{album.title}</h4>
                  <span className="artist-badge">
                    {album.artistName} {album.nb_tracks ? `• ${album.nb_tracks} titres` : ''}
                  </span>
                </div>
                <button className="artist-play-btn">
                  <Play className="play-icon-sm" /> Tester l'Album
                </button>
              </div>
            ))}

            {!isLoadingAlbums && albumQuery.trim() && albumResults.length === 0 && (
              <div className="empty-search-state">
                <Disc className="empty-icon" />
                <p>Aucun album trouvé pour "{albumQuery}". Essayez un autre titre !</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
