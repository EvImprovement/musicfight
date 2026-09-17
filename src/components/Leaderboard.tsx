import React, { useState, useEffect } from 'react';
import { Trophy, X, RefreshCw } from 'lucide-react';
import { fetchLeaderboard } from '../services/supabaseClient';
import type { LeaderboardEntry, GameModeType } from '../types/game';

interface LeaderboardProps {
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activeModeFilter, setActiveModeFilter] = useState<GameModeType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (modeFilter?: GameModeType | 'all') => {
    setIsLoading(true);
    const filter = modeFilter === 'all' ? undefined : modeFilter;
    const data = await fetchLeaderboard(filter);
    setEntries(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData(activeModeFilter);
  }, [activeModeFilter]);

  return (
    <div className="modal-backdrop">
      <div className="modal-card leaderboard-modal">
        <button className="modal-close-btn" onClick={onClose}>
          <X className="icon-sm" />
        </button>

        <div className="leaderboard-header">
          <div className="trophy-icon-wrapper">
            <Trophy className="icon-md text-gold" />
          </div>
          <div>
            <h2 className="modal-title">Classement des Mélomanes</h2>
            <p className="modal-sub">Les meilleurs joueurs de MusicFight</p>
          </div>
        </div>

        {/* Filters */}
        <div className="leaderboard-filters">
          <button
            className={`filter-pill ${activeModeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveModeFilter('all')}
          >
            Tous les modes
          </button>
          <button
            className={`filter-pill ${activeModeFilter === 'classic' ? 'active' : ''}`}
            onClick={() => setActiveModeFilter('classic')}
          >
            🏆 Classique
          </button>
          <button
            className={`filter-pill ${activeModeFilter === 'timeattack' ? 'active' : ''}`}
            onClick={() => setActiveModeFilter('timeattack')}
          >
            ⚡ Contre la montre
          </button>
          <button
            className={`filter-pill ${activeModeFilter === 'survival' ? 'active' : ''}`}
            onClick={() => setActiveModeFilter('survival')}
          >
            ❤️ Survival
          </button>
        </div>

        {/* High Score List */}
        <div className="leaderboard-list-wrapper">
          {isLoading ? (
            <div className="loading-state">
              <RefreshCw className="spinner-icon text-accent" />
              <span>Chargement des meilleurs scores...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <p>Aucun score enregistré pour l'instant. Soyez le premier à inscrire votre nom !</p>
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

                return (
                  <div key={entry.id} className={rankClass}>
                    <div className="rank-col">
                      {medalIcon ? <span className="medal">{medalIcon}</span> : <span className="rank-number">#{rank}</span>}
                    </div>
                    <div className="player-col">
                      <span className="player-name">{entry.player_name}</span>
                      <span className="category-tag">{entry.category_name}</span>
                    </div>
                    <div className="acc-col">
                      <span>{entry.accuracy}%</span>
                    </div>
                    <div className="score-col">
                      <span className="score-val">{entry.score} pts</span>
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
