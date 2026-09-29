import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Sparkles, X, Loader2, LogIn, UserPlus, LogOut, CheckCircle } from 'lucide-react';
import {
  registerPlayer,
  loginPlayer,
  getStoredPlayerProfile,
  clearStoredPlayerProfile
} from '../services/supabaseClient';
import type { PlayerProfile } from '../services/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: PlayerProfile) => void;
  canDismiss?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  canDismiss = true
}) => {
  const currentProfile = getStoredPlayerProfile();
  const [mode, setMode] = useState<'register' | 'login' | 'profile'>(currentProfile ? 'profile' : 'register');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const p = getStoredPlayerProfile();
      if (p) {
        setMode('profile');
      } else {
        setMode('register');
      }
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim() || username.trim().length < 2) {
      setErrorMessage('Le pseudo doit contenir au moins 2 caractères.');
      return;
    }

    setIsLoading(true);
    const result = await registerPlayer(username, pin);
    setIsLoading(false);

    if (result.success && result.profile) {
      setSuccessMessage(`Bienvenue ${result.profile.username} ! Ton profil est activé.`);
      setTimeout(() => {
        onAuthSuccess(result.profile!);
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.error || 'Erreur lors de la création du profil.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim()) {
      setErrorMessage('Veuillez renseigner votre pseudo.');
      return;
    }

    setIsLoading(true);
    const result = await loginPlayer(username, pin);
    setIsLoading(false);

    if (result.success && result.profile) {
      setSuccessMessage(`Ravi de te revoir ${result.profile.username} !`);
      setTimeout(() => {
        onAuthSuccess(result.profile!);
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.error || 'Impossible de se connecter avec ce pseudo.');
    }
  };

  const handleLogout = () => {
    clearStoredPlayerProfile();
    setUsername('');
    setPin('');
    setMode('register');
    setErrorMessage(null);
    setSuccessMessage('Déconnexion effectuée.');
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (canDismiss && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-card auth-modal-card">
        {canDismiss && (
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Fermer"
          >
            <X className="icon-sm" />
          </button>
        )}

        {/* PROFILE MODE */}
        {mode === 'profile' && currentProfile && (
          <div className="auth-content">
            <div className="auth-header">
              <div className="auth-icon-badge">
                <Sparkles className="icon-md text-gold" />
              </div>
              <h2 className="modal-title">Profil Joueur</h2>
              <p className="modal-subtitle">Votre compte joueur MusicFight</p>
            </div>

            <div className="profile-card-display">
              <div className="profile-avatar-large">
                <User className="icon-lg" />
              </div>
              <div className="profile-details">
                <span className="profile-tag">Joueur Enregistré</span>
                <h3 className="profile-username-large">{currentProfile.username}</h3>
                {currentProfile.pin && (
                  <span className="profile-pin-badge">
                    <ShieldCheck className="icon-xs" /> Code PIN activé
                  </span>
                )}
              </div>
            </div>

            <div className="auth-actions-row">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary btn-full"
              >
                Continuer à jouer
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary btn-full btn-logout"
              >
                <LogOut className="icon-xs" /> Changer de compte
              </button>
            </div>
          </div>
        )}

        {/* REGISTER MODE */}
        {mode === 'register' && (
          <div className="auth-content">
            <div className="auth-header">
              <div className="auth-icon-badge">
                <UserPlus className="icon-md" />
              </div>
              <h2 className="modal-title">Profil Joueur</h2>
              <p className="modal-subtitle">
                Choisis un <strong>pseudo unique</strong> pour sauvegarder tes records et figurer au classement mondial !
              </p>
            </div>

            {errorMessage && (
              <div className="auth-alert error-alert">
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="auth-alert success-alert">
                <CheckCircle className="icon-xs" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="auth-form">
              <div className="input-group">
                <label htmlFor="reg-username" className="input-label">
                  Ton Pseudo Unique *
                </label>
                <input
                  id="reg-username"
                  type="text"
                  placeholder="Ex: Evan, DJ_Max, Melomane..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={16}
                  required
                  autoFocus
                  className="auth-input"
                  enterKeyHint="next"
                />
              </div>

              <div className="input-group">
                <label htmlFor="reg-pin" className="input-label">
                  Code PIN secret (4 chiffres, optionnel)
                </label>
                <input
                  id="reg-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="•••• (Protège ton pseudo)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className="auth-input"
                  enterKeyHint="done"
                />
                <span className="input-hint">
                  Protège ton pseudo pour que personne d'autre ne puisse voler tes scores.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-full submit-auth-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="spinner-icon-sm" /> Vérification...
                  </>
                ) : (
                  <>
                    <Sparkles className="icon-xs" /> Valider & Jouer
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer-toggle">
              <span>Tu as déjà un compte ?</span>{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMessage(null); }}
                className="auth-toggle-link"
              >
                Se connecter
              </button>
            </div>
          </div>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <div className="auth-content">
            <div className="auth-header">
              <div className="auth-icon-badge">
                <LogIn className="icon-md" />
              </div>
              <h2 className="modal-title">Connexion Joueur</h2>
              <p className="modal-subtitle">
                Retrouve tes statistiques et ton pseudo sur cet appareil.
              </p>
            </div>

            {errorMessage && (
              <div className="auth-alert error-alert">
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="auth-alert success-alert">
                <CheckCircle className="icon-xs" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-group">
                <label htmlFor="login-username" className="input-label">
                  Ton Pseudo
                </label>
                <input
                  id="login-username"
                  type="text"
                  placeholder="Entre ton pseudo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={16}
                  required
                  autoFocus
                  className="auth-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="login-pin" className="input-label">
                  Code PIN (si configuré)
                </label>
                <input
                  id="login-pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className="auth-input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-full submit-auth-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="spinner-icon-sm" /> Connexion...
                  </>
                ) : (
                  <>
                    <LogIn className="icon-xs" /> Me connecter
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer-toggle">
              <span>Nouveau joueur ?</span>{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(null); }}
                className="auth-toggle-link"
              >
                Créer un profil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
