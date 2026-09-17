import React, { useState, useEffect } from 'react';
import { Search, Music2, Sparkles, Disc, Loader2, Play } from 'lucide-react';
import { PRESET_THEMES, searchArtists } from '../services/deezerApi';
import type { CategoryTheme } from '../types/game';

interface ThemeSelectorProps {
  onSelectTheme: (theme: CategoryTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onSelectTheme }) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'search'>('themes');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Debounce search query for Deezer API
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

  return (
    <div className="theme-selector-container">
      {/* Hero Welcome Header */}
      <div className="hero-banner">
        <div className="hero-content">
          <span className="hero-badge">
            <Sparkles className="icon-xs" /> Multijoueur & Solo
          </span>
          <h1 className="hero-title">Prêt à relever le défi du Blind Test ?</h1>
          <p className="hero-subtitle">
            Choisissez un artiste ou un thème, écoutez l'extrait audio et devinez le morceau le plus vite possible pour accumuler jusqu'à <strong>100 points</strong> !
          </p>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="selector-tabs">
        <button
          className={`tab-btn ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          <Disc className="tab-icon" />
          <span>Playlists Thématiques</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search className="tab-icon" />
          <span>Rechercher un Artiste</span>
        </button>
      </div>

      {/* TAB 1: Preset Playlists */}
      {activeTab === 'themes' && (
        <div className="theme-grid">
          {PRESET_THEMES.map((theme) => (
            <div
              key={theme.id}
              className="theme-card"
              onClick={() => onSelectTheme(theme)}
              role="button"
              tabIndex={0}
              style={{ '--theme-gradient': theme.color } as React.CSSProperties}
            >
              <div className="card-header-bg" style={{ background: theme.color }}>
                <span className="theme-emoji">{theme.icon}</span>
              </div>
              <div className="card-body">
                <h3 className="theme-name">{theme.name}</h3>
                <p className="theme-desc">{theme.description}</p>
                <div className="card-footer">
                  <span className="play-badge">
                    <Play className="play-icon" /> Jouer
                  </span>
                </div>
              </div>
            </div>
          ))}
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

          {/* Search Results Grid */}
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
                  <span className="artist-badge">Blind Test Spécial</span>
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
    </div>
  );
};
