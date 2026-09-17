import React, { useState } from 'react';
import { Trophy, Zap, Heart, Users, X, Play } from 'lucide-react';
import type { CategoryTheme, GameModeType, GameSettings } from '../types/game';

interface GameModeModalProps {
  theme: CategoryTheme;
  onClose: () => void;
  onStartGame: (settings: GameSettings) => void;
}

export const GameModeModal: React.FC<GameModeModalProps> = ({ theme, onClose, onStartGame }) => {
  const [selectedMode, setSelectedMode] = useState<GameModeType>('classic');
  const [players, setPlayers] = useState<string[]>(['Joueur 1', 'Joueur 2']);

  const handleStart = () => {
    onStartGame({
      mode: selectedMode,
      trackCount: selectedMode === 'classic' ? 10 : 20,
      timePerTrack: 10,
      playerNames: selectedMode === 'multiplayer' ? players : undefined
    });
  };

  const addPlayer = () => {
    if (players.length < 4) {
      setPlayers([...players, `Joueur ${players.length + 1}`]);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, val: string) => {
    const updated = [...players];
    updated[index] = val;
    setPlayers(updated);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button className="modal-close-btn" onClick={onClose}>
          <X className="icon-sm" />
        </button>

        {/* Selected Theme Header */}
        <div className="modal-theme-header" style={{ background: theme.color }}>
          <span className="theme-header-icon">{theme.icon}</span>
          <div>
            <h2 className="theme-header-title">{theme.name}</h2>
            <p className="theme-header-sub">{theme.description}</p>
          </div>
        </div>

        <div className="modal-body">
          <h3 className="section-subtitle">Choisissez votre mode de jeu :</h3>

          <div className="mode-options-grid">
            {/* Mode 1: Classique */}
            <div
              className={`mode-card ${selectedMode === 'classic' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('classic')}
            >
              <div className="mode-icon-wrapper classic">
                <Trophy className="mode-icon" />
              </div>
              <div className="mode-details">
                <h4 className="mode-title">Mode Classique</h4>
                <p className="mode-desc">10 morceaux • 10s par extrait. Score dégressif linéaire de 100 à 10 pts.</p>
              </div>
            </div>

            {/* Mode 2: Contre la Montre */}
            <div
              className={`mode-card ${selectedMode === 'timeattack' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('timeattack')}
            >
              <div className="mode-icon-wrapper timeattack">
                <Zap className="mode-icon" />
              </div>
              <div className="mode-details">
                <h4 className="mode-title">Contre la Montre</h4>
                <p className="mode-desc">60 secondes au chrono global. Enchaînez un maximum de bonnes réponses !</p>
              </div>
            </div>

            {/* Mode 3: Survival */}
            <div
              className={`mode-card ${selectedMode === 'survival' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('survival')}
            >
              <div className="mode-icon-wrapper survival">
                <Heart className="mode-icon" />
              </div>
              <div className="mode-details">
                <h4 className="mode-title">Mode Survival</h4>
                <p className="mode-desc">3 vies seulement. Le jeu s'arrête dès que vous commettez 3 erreurs.</p>
              </div>
            </div>

            {/* Mode 4: Multiplayer Local */}
            <div
              className={`mode-card ${selectedMode === 'multiplayer' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('multiplayer')}
            >
              <div className="mode-icon-wrapper multiplayer">
                <Users className="mode-icon" />
              </div>
              <div className="mode-details">
                <h4 className="mode-title">Multijoueur Local</h4>
                <p className="mode-desc">2 à 4 joueurs sur le même écran. Défiez vos amis en soirée !</p>
              </div>
            </div>
          </div>

          {/* Additional Player inputs for Multiplayer */}
          {selectedMode === 'multiplayer' && (
            <div className="multiplayer-config-section">
              <h4 className="config-title">Noms des joueurs (2 à 4) :</h4>
              <div className="player-inputs-list">
                {players.map((p, idx) => (
                  <div key={idx} className="player-input-row">
                    <span className="player-badge-num">#{idx + 1}</span>
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => updatePlayerName(idx, e.target.value)}
                      maxLength={14}
                      className="player-name-field"
                    />
                    {players.length > 2 && (
                      <button className="remove-player-btn" onClick={() => removePlayer(idx)}>
                        <X className="icon-xs" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {players.length < 4 && (
                <button className="add-player-btn" onClick={addPlayer}>
                  + Ajouter un joueur
                </button>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary start-game-btn" onClick={handleStart}>
            <Play className="icon-sm" /> Lancer la partie
          </button>
        </div>
      </div>
    </div>
  );
};
