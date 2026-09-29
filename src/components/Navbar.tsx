import React, { useState } from 'react';
import { Volume2, VolumeX, Trophy, User, Music, HelpCircle } from 'lucide-react';
import { soundFx } from '../services/soundEffects';
import { getStoredPlayerName } from '../services/supabaseClient';

interface NavbarProps {
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
  onHomeClick: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLeaderboard,
  onOpenHelp,
  onHomeClick,
  onOpenAuth
}) => {
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const playerName = getStoredPlayerName();

  const toggleSound = () => {
    const nextState = !isMuted;
    soundFx.setMuted(nextState);
    setIsMuted(nextState);
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
          {/* User Profile Button */}
          <div className="user-profile-btn">
            <button
              onClick={onOpenAuth}
              className="profile-pill"
              title="Mon Profil Joueur (Supabase)"
            >
              <User className="icon-sm text-cyan" />
              <span className="player-name-display">{playerName}</span>
            </button>
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
