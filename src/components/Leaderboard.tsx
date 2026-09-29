import React, { useState, useEffect } from 'react';
import { Trophy, X, RefreshCw, Clock, Heart, Award } from 'lucide-react';
import { fetchLeaderboard, getStoredPlayerName, getStoredPlayerProfile } from '../services/supabaseClient';
import type { LeaderboardEntry, GameModeType } from '../types/game';

interface LeaderboardProps {
  onClose: () => void;
}

const LEADERBOARD_CATEGORIES = [
  { id: 'rap-fr', name: 'Rap Français', icon: '🎙️' },
  { id: 'white-girl-music', name: 'White Girl Music', icon: '💅' },
  { id: 'rap-us', name: 'Rap US', icon: '👑' },
  { id: 'annees-2010', name: 'Années 2010', icon: '🕶️' },
  { id: 'annees-2000', name: 'Années 2000', icon: '💿' },
  { id: 'disney-hits', name: 'Disney & Dessins Animés', icon: '🏰' },
  { id: 'cinema-anime', name: 'Films & Séries', icon: '🎬' },
  { id: 'chanson-francaise', name: 'Chanson Française', icon: '🇫🇷' },
  { id: 'all', name: 'Toutes les catégories', icon: '🌟' }
];

const GAME_MODES = [
  { id: 'classic', label: '🏆 Classique (10s)', shortLabel: 'Classique', icon: Trophy },
  { id: 'survival', label: '❤️ Survie (3 vies)', shortLabel: 'Survie', icon: Heart },
  { id: 'timeattack', label: '⚡ Chrono (60s)', shortLabel: 'Chrono', icon: Clock },
  { id: 'all', label: 'Tous les modes', shortLabel: 'Tous', icon: Award }
] as const;

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Rap Français');
  const [activeModeFilter, setActiveModeFilter] = useState<GameModeType | 'all'>('classic');
  const [isLoading, setIsLoading] = useState(true);

  const currentProfile = getStoredPlayerProfile();
  const currentName = currentProfile?.username || getStoredPlayerName();

  const loadData = async (cat: string, mode: GameModeType | 'all') => {
    setIsLoading(true);
    const data = await fetchLeaderboard(mode, cat);
    setEntries(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData(selectedCategory, activeModeFilter);
  }, [selectedCategory, activeModeFilter]);

  const getModeBadge = (m: string) => {
    switch (m) {
      case 'survival':
        return <span className="mode-tag-pill survival">❤️ Survie</span>;
      case 'timeattack':
        return <span className="mode-tag-pill chrono">⚡ Chrono</span>;
      default:
        return <span className="mode-tag-pill classic">🏆 Classique</span>;
    }
  };

  const activeCategoryObj = LEADERBOARD_CATEGORIES.find(c => c.name === selectedCategory) || LEADERBOARD_CATEGORIES[0];
  const activeModeObj = GAME_MODES.find(m => m.id === activeModeFilter) || GAME_MODES[0];

  return (
    <div className="modal-backdrop">
      <div className="modal-card leaderboard-modal">
        <button className="modal-close-btn" onClick={onClose} aria-label="Fermer">
          <X className="icon-sm" />
        </button>

        <div className="leaderboard-header">
          <div className="trophy-icon-wrapper">
            <Trophy className="icon-md text-gold" />
          </div>
          <div className="leaderboard-title-col">
            <div className="leaderboard-title-row">
              <h2 className="modal-title">Panthéon des Mélomanes</h2>
            </div>
            <p className="modal-sub">Les meilleurs scores par thème & mode de jeu</p>
          </div>
        </div>

        {/* 1. Category Selection Tabs */}
        <div className="leaderboard-section-label">
          <span>1. Choisissez une catégorie musicale :</span>
        </div>
        <div className="leaderboard-category-tabs">
          {LEADERBOARD_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                className={`cat-tab-btn ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <span className="cat-tab-icon">{cat.icon}</span>
                <span className="cat-tab-name">{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Game Mode Filter Pills */}
        <div className="leaderboard-section-label">
          <span>2. Choisissez le mode de jeu :</span>
        </div>
        <div className="leaderboard-mode-selector">
          {GAME_MODES.map((m) => {
            const isSelected = activeModeFilter === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`mode-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveModeFilter(m.id as any)}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Active Context Banner */}
        <div className="leaderboard-active-banner">
          <div className="active-banner-info">
            <span className="active-banner-theme">
              {activeCategoryObj.icon} {activeCategoryObj.name}
            </span>
            <span className="active-banner-sep">•</span>
            <span className="active-banner-mode">
              {activeModeObj.label}
            </span>
          </div>
          <span className="active-banner-count">
            {entries.length} score{entries.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* High Score List */}
        <div className="leaderboard-list-wrapper">
          {isLoading ? (
            <div className="loading-state">
              <RefreshCw className="spinner-icon text-cyan" />
              <span>Chargement du classement...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state leaderboard-empty">
              <span className="empty-icon-large">🏆</span>
              <h4>Aucun score enregistré</h4>
              <p>
                Soyez le tout premier joueur à inscrire votre record en <strong>{selectedCategory}</strong> ({activeModeObj.shortLabel}) !
              </p>
            </div>
          ) : (
            <div className="leaderboard-table">
              {entries.map((entry, index) => {
                const rank = index + 1;
                let rankClass = 'rank-item';
                let medalIcon = null;

                if (rank === 1) { rankClass += ' gold'; medalIcon = '🥇'; }
                else if (rank === 2) { rankClass += ' silver'; medalIcon = '🥈'; }
                else if (rank === 3) { rankClass += ' bronze'; medalIcon = '🥉'; }

                const isMe = (entry.user_id && currentProfile?.id && entry.user_id === currentProfile.id) ||
                  (entry.player_name && currentName && entry.player_name.trim().toLowerCase() === currentName.trim().toLowerCase());

                if (isMe) {
                  rankClass += ' is-me';
                }

                const formattedDate = entry.created_at
                  ? new Date(entry.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                  : '';

                return (
                  <div key={entry.id} className={rankClass}>
                    <div className="rank-col">
                      {medalIcon ? <span className="medal">{medalIcon}</span> : <span className="rank-number">#{rank}</span>}
                    </div>

                    <div className="player-col">
                      <div className="player-name-row">
                        <span className="player-name">{entry.player_name}</span>
                        {isMe && <span className="you-badge">Moi</span>}
                      </div>
                      <div className="player-sub-meta">
                        {getModeBadge(entry.mode)}
                        {selectedCategory === 'Toutes les catégories' && entry.category_name && (
                          <span className="category-tag-sub">🎵 {entry.category_name}</span>
                        )}
                        {formattedDate && <span className="date-tag">{formattedDate}</span>}
                      </div>
                    </div>

                    <div className="acc-col">
                      <span className="acc-val">{entry.accuracy}%</span>
                      <span className="acc-sub">précision</span>
                    </div>

                    <div className="score-col">
                      <span className="score-val">{entry.score.toLocaleString('fr-FR')}</span>
                      <span className="score-unit">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
