import React, { useState } from 'react';
import { Volume2, VolumeX, Trophy, User, Music, HelpCircle, Check, X } from 'lucide-react';
import { soundFx } from '../services/soundEffects';
import { getStoredPlayerName, setStoredPlayerName } from '../services/supabaseClient';

interface NavbarProps {
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
  onHomeClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLeaderboard, onOpenHelp, onHomeClick }) => {
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const [playerName, setPlayerName] = useState(getStoredPlayerName());
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const toggleSound = () => {
    const nextState = !isMuted;
    soundFx.setMuted(nextState);
    setIsMuted(nextState);
  };

  const handleSaveName = (e?: React.SyntheticEvent | React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (tempName.trim()) {
      const clean = tempName.trim().slice(0, 16);
      setStoredPlayerName(clean);
      setPlayerName(clean);
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = (e?: React.SyntheticEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setTempName(playerName);
    setIsEditingName(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand" onClick={onHomeClick} role="button" tabIndex={0}>
          <div className="logo-icon-wrapper">
            <img
              src="/logo.png"
              alt="MusicFight"
              className="logo-img"
              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
            />
            <Music className="logo-icon fallback-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">Music<span className="brand-highlight">Fight</span></span>
            <span className="brand-tagline">Blind Test Ultimate</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="navbar-actions">
          {/* User Nickname Button */}
          <div className="user-profile-btn">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="name-form" action="#">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  maxLength={16}
                  enterKeyHint="done"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  className="name-input"
                  placeholder="Pseudo"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveName();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancelEdit();
                    }
                  }}
                />
                <button
                  type="submit"
                  className="name-action-btn name-confirm-btn"
                  title="Valider"
                  aria-label="Valider le pseudo"
                  onTouchEnd={handleSaveName}
                  onClick={handleSaveName}
                >
                  <Check className="icon-xs" />
                </button>
                <button
                  type="button"
                  className="name-action-btn name-cancel-btn"
                  title="Annuler"
                  aria-label="Annuler"
                  onTouchEnd={handleCancelEdit}
                  onClick={handleCancelEdit}
                >
                  <X className="icon-xs" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => { setTempName(playerName); setIsEditingName(true); }}
                className="profile-pill"
                title="Modifier mon pseudo"
              >
                <User className="icon-sm" />
                <span className="player-name-display">{playerName}</span>
              </button>
            )}
          </div>

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="nav-btn btn-secondary"
            title="Classement mondial"
          >
            <Trophy className="icon-sm text-gold" />
            <span className="btn-label">Top Scores</span>
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="nav-btn icon-only-btn"
            title="Règles du jeu"
          >
            <HelpCircle className="icon-sm" />
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={toggleSound}
            className={`nav-btn icon-only-btn ${isMuted ? 'muted' : ''}`}
            title={isMuted ? 'Activer le son' : 'Casser le son'}
          >
            {isMuted ? <VolumeX className="icon-sm text-danger" /> : <Volume2 className="icon-sm text-accent" />}
          </button>
        </div>
      </div>
    </header>
  );
};
