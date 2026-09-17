import React from 'react';
import { X, Zap, Trophy, Flame, Keyboard } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-card help-modal">
        <button className="modal-close-btn" onClick={onClose}>
          <X className="icon-sm" />
        </button>

        <h2 className="modal-title">📖 Comment jouer à MusicFight ?</h2>

        <div className="help-content">
          <div className="help-item">
            <Zap className="help-icon text-gold" />
            <div>
              <h4>Score Dégressif (100 pts max)</h4>
              <p>Plus vous répondez vite après le début du morceau, plus vous gagnez de points. Le score commence à 100 points et décroît avec le temps !</p>
            </div>
          </div>

          <div className="help-item">
            <Flame className="help-icon text-orange" />
            <div>
              <h4>Système de Combo / Streak</h4>
              <p>Enchaînez plusieurs bonnes réponses consécutives pour débloquer un multiplicateur de score (jusqu'à x1.5 !).</p>
            </div>
          </div>

          <div className="help-item">
            <Keyboard className="help-icon text-accent" />
            <div>
              <h4>Raccourcis Clavier</h4>
              <p>Utilisez les touches <strong>1</strong>, <strong>2</strong>, <strong>3</strong> et <strong>4</strong> de votre clavier pour sélectionner rapidement une réponse !</p>
            </div>
          </div>

          <div className="help-item">
            <Trophy className="help-icon text-purple" />
            <div>
              <h4>Modes de Jeu</h4>
              <p>
                - <strong>Classique</strong> : 10 morceaux.<br />
                - <strong>Contre la montre</strong> : Score max en 60 secondes.<br />
                - <strong>Survival</strong> : 3 vies max.<br />
                - <strong>Multijoueur Local</strong> : Défiez vos amis sur le même écran !
              </p>
            </div>
          </div>
        </div>

        <button className="btn-primary w-full mt-4" onClick={onClose}>
          Compris, c'est parti !
        </button>
      </div>
    </div>
  );
};
