import React from 'react';
import { X, Zap, Trophy, Keyboard } from 'lucide-react';

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
              <h4>Score Dégressif Linéaire (100 pts max)</h4>
              <p>Vous avez <strong>10 secondes</strong> par morceau. Les <strong>1.5 premières secondes</strong> vous conservent 100 points. Ensuite, le score diminue linéairement jusqu'à <strong>0 point à 10s</strong> !</p>
            </div>
          </div>

          <div className="help-item">
            <Keyboard className="help-icon text-accent" />
            <div>
              <h4>Raccourcis Clavier (1, 2, 3, 4)</h4>
              <p>Utilisez les touches <strong>1</strong>, <strong>2</strong>, <strong>3</strong> et <strong>4</strong> de votre clavier pour répondre ultra-rapidement sans utiliser la souris !</p>
            </div>
          </div>

          <div className="help-item">
            <Trophy className="help-icon text-purple" />
            <div>
              <h4>Mode Artiste & Playlists</h4>
              <p>
                - <strong>Mode Artiste</strong> : Les 4 choix proposés sont 4 titres différents du même artiste !<br />
                - <strong>Playlists Thématiques</strong> : 100% des titres et distractors sont issus du thème choisi.
              </p>
            </div>
          </div>

          <div className="help-item">
            <Trophy className="help-icon text-gold" />
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
