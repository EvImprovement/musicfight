import React, { useState } from 'react';
import { Users, Plus, ArrowRight, X, Sparkles, KeyRound } from 'lucide-react';
import { getStoredPlayerName, setStoredPlayerName } from '../services/supabaseClient';
import { getRandomAvatar, generateRoomCode } from '../services/multiplayerRoom';

interface MultiplayerHubProps {
  initialCode?: string;
  onClose: () => void;
  onJoinRoom: (roomCode: string, playerName: string, avatar: string, isHost: boolean) => void;
}

const AVATAR_CHOICES = ['🦊', '🦁', '🐯', '🐼', '🚀', '🎧', '⚡', '👑', '🔥', '💎', '🎸', '🕹️'];

export const MultiplayerHub: React.FC<MultiplayerHubProps> = ({
  initialCode = '',
  onClose,
  onJoinRoom
}) => {
  const [playerName, setPlayerName] = useState(getStoredPlayerName());
  const [selectedAvatar, setSelectedAvatar] = useState(getRandomAvatar());
  const [inputCode, setInputCode] = useState(initialCode);
  const [tab, setTab] = useState<'create' | 'join'>(initialCode ? 'join' : 'create');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = () => {
    const cleanName = playerName.trim() || 'Joueur' + Math.floor(Math.random() * 900 + 100);
    setStoredPlayerName(cleanName);
    const newCode = generateRoomCode();
    onJoinRoom(newCode, cleanName, selectedAvatar, true);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim() || 'Joueur' + Math.floor(Math.random() * 900 + 100);
    const cleanCode = inputCode.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMsg('Veuillez saisir un code de salon (ex: MF-482).');
      return;
    }

    setStoredPlayerName(cleanName);
    onJoinRoom(cleanCode, cleanName, selectedAvatar, false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card hub-modal-card">
        <button className="modal-close-btn" onClick={onClose} aria-label="Fermer">
          <X className="icon-sm" />
        </button>

        <div className="hub-header">
          <div className="hub-icon-badge">
            <Users className="icon-md text-cyan" />
          </div>
          <h2 className="modal-title">Salons Privés Multi-joueurs</h2>
          <p className="modal-subtitle">Affrontez vos amis en direct sur le même blind test !</p>
        </div>

        {/* Player Profile Setup */}
        <div className="hub-profile-section">
          <div className="hub-avatar-picker">
            <div className="hub-current-avatar">{selectedAvatar}</div>
            <div className="hub-avatar-grid">
              {AVATAR_CHOICES.slice(0, 8).map((av) => (
                <button
                  key={av}
                  type="button"
                  className={`avatar-option-btn ${selectedAvatar === av ? 'active' : ''}`}
                  onClick={() => setSelectedAvatar(av)}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="hub-input-group">
            <label className="hub-label">Votre pseudo :</label>
            <input
              type="text"
              className="auth-input hub-name-input"
              value={playerName}
              maxLength={20}
              placeholder="Ex: Thomas, Léa, Alex..."
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs: Create vs Join */}
        <div className="hub-tab-bar">
          <button
            type="button"
            className={`hub-tab-btn ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setErrorMsg(null); }}
          >
            <Plus className="icon-xs" /> Créer un salon
          </button>
          <button
            type="button"
            className={`hub-tab-btn ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); setErrorMsg(null); }}
          >
            <KeyRound className="icon-xs" /> Rejoindre avec un code
          </button>
        </div>

        {errorMsg && <div className="auth-alert error-alert">{errorMsg}</div>}

        {tab === 'create' ? (
          <div className="hub-action-box">
            <p className="hub-action-desc">
              Vous serez l'<strong>Hôte</strong> du salon. Vous pourrez choisir les thèmes, le nombre de titres, et lancer la partie quand tout le monde est prêt.
            </p>
            <button className="btn-primary hub-main-btn" onClick={handleCreate}>
              <Sparkles className="icon-sm" /> Créer le salon privé
            </button>
          </div>
        ) : (
          <form className="hub-action-box" onSubmit={handleJoin}>
            <p className="hub-action-desc">
              Entrez le code fourni par votre ami pour rejoindre son salon en direct :
            </p>
            <div className="hub-code-input-wrapper">
              <input
                type="text"
                className="hub-code-input"
                placeholder="Ex: MF-842"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                maxLength={8}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary hub-main-btn">
              Rejoindre la partie <ArrowRight className="icon-sm" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
