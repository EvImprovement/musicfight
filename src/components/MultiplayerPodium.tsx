import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Crown, RotateCcw, Home, Sparkles } from 'lucide-react';
import type { RoomPlayer, RoomSettings } from '../types/game';
import type { MultiplayerRoomManager } from '../services/multiplayerRoom';

interface MultiplayerPodiumProps {
  manager: MultiplayerRoomManager;
  settings: RoomSettings;
  finalPlayers: RoomPlayer[];
  onPlayAgain: () => void;
  onQuit: () => void;
}

export const MultiplayerPodium: React.FC<MultiplayerPodiumProps> = ({
  manager,
  settings,
  finalPlayers,
  onPlayAgain,
  onQuit
}) => {
  const sorted = [...finalPlayers].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const second = sorted[1];
  const third = sorted[2];
  const myPlayerId = manager.myPlayerId;
  const isHost = manager.isHost || !!finalPlayers.find(p => p.id === manager.myPlayerId)?.isHost;

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  const handleHostPlayAgain = () => {
    if (!isHost) return;
    manager.sendEvent({
      type: 'RETURN_TO_LOBBY'
    });
    onPlayAgain();
  };

  return (
    <div className="podium-screen-container">
      <div className="podium-header">
        <div className="podium-badge">
          <Sparkles className="icon-xs text-gold" /> Fin de la partie
        </div>
        <h1 className="podium-title">Podium du Salon {manager.roomCode}</h1>
        <p className="podium-subtitle">
          {settings.themeIcon} {settings.themeName} • {settings.trackCount} titres
        </p>
      </div>

      {/* Podium Visuals (Top 3) */}
      <div className="podium-stage">
        {/* 2nd place */}
        {second && (
          <div className="podium-column second-place">
            <div className="podium-avatar-wrapper">
              <span className="podium-avatar">{second.avatar}</span>
              <span className="podium-medal silver">🥈 2e</span>
            </div>
            <div className="podium-pedestal p2">
              <span className="podium-player-name">{second.name}</span>
              <span className="podium-player-score">{second.score} pts</span>
            </div>
          </div>
        )}

        {/* 1st place */}
        {winner && (
          <div className="podium-column first-place">
            <div className="podium-avatar-wrapper">
              <Crown className="winner-crown text-gold" />
              <span className="podium-avatar winner-avatar">{winner.avatar}</span>
              <span className="podium-medal gold">🏆 1er</span>
            </div>
            <div className="podium-pedestal p1">
              <span className="podium-player-name winner-name">{winner.name}</span>
              <span className="podium-player-score winner-score">{winner.score} pts</span>
            </div>
          </div>
        )}

        {/* 3rd place */}
        {third && (
          <div className="podium-column third-place">
            <div className="podium-avatar-wrapper">
              <span className="podium-avatar">{third.avatar}</span>
              <span className="podium-medal bronze">🥉 3e</span>
            </div>
            <div className="podium-pedestal p3">
              <span className="podium-player-name">{third.name}</span>
              <span className="podium-player-score">{third.score} pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Full Leaderboard List */}
      <div className="podium-full-list">
        {sorted.map((p, idx) => (
          <div key={p.id} className={`podium-row ${p.id === myPlayerId ? 'is-me' : ''}`}>
            <span className={`podium-rank-num r-${idx + 1}`}>#{idx + 1}</span>
            <span className="player-avatar-circle mini">{p.avatar}</span>
            <span className="podium-name-cell">
              {p.name}
              {p.id === myPlayerId && <span className="you-tag">(Moi)</span>}
            </span>
            <span className="podium-score-cell">{p.score} pts</span>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="podium-actions-footer">
        {isHost ? (
          <button className="btn-primary" onClick={handleHostPlayAgain}>
            <RotateCcw className="icon-sm" /> Rejouer dans ce salon
          </button>
        ) : (
          <div className="guest-waiting-return">
            <span>En attente de l'hôte pour rejouer...</span>
          </div>
        )}

        <button className="btn-secondary" onClick={onQuit}>
          <Home className="icon-sm" /> Retour à l'accueil
        </button>
      </div>
    </div>
  );
};
