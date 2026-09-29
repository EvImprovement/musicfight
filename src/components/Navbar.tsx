import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Trophy, User, Music, HelpCircle, Users } from 'lucide-react';
import { soundFx } from '../services/soundEffects';
import { getStoredPlayerProfile } from '../services/supabaseClient';

interface NavbarProps {
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
  onHomeClick: () => void;
  onOpenAuth: () => void;
  onOpenMultiplayer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLeaderboard,
  onOpenHelp,
  onHomeClick,
  onOpenAuth,
  onOpenMultiplayer
}) => {
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const profile = getStoredPlayerProfile();

  useEffect(() => {
    const unsub = soundFx.subscribeMute((muted) => {
      setIsMuted(muted);
    });
    return unsub;
  }, []);

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
          {/* User Profile Button (Compact Icon) */}
          <button
            onClick={onOpenAuth}
            className={`nav-btn icon-only-btn profile-icon-btn ${profile ? 'has-profile' : ''}`}
            title={profile ? `Joueur : ${profile.username}` : "S'inscrire / Se connecter"}
            aria-label="Profil Joueur"
          >
            <User className="icon-sm text-cyan" />
            {profile && <span className="profile-status-dot" />}
          </button>

          {/* Multiplayer Room Button */}
          <button
            onClick={onOpenMultiplayer}
            className="nav-btn btn-secondary room-nav-btn"
            title="Salons Privés Multi-joueurs"
          >
            <Users className="icon-sm text-pink" />
            <span className="btn-label">Salons</span>
          </button>

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
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="icon-sm text-danger" /> : <Volume2 className="icon-sm text-accent" />}
          </button>
        </div>
      </div>
    </header>
  );
};
