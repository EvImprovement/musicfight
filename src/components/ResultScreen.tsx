import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { GameStats, LocalPlayerState, CategoryTheme, GameSettings } from '../types/game';
import { saveGameScore, getStoredPlayerName } from '../services/supabaseClient';
import { Trophy, RotateCcw, Share2, Award, Zap, CheckCircle, Home, Music } from 'lucide-react';

interface ResultScreenProps {
  stats: GameStats;
  theme: CategoryTheme;
  settings: GameSettings;
  multiplayerResults?: LocalPlayerState[];
  onPlayAgain: () => void;
  onGoHome: () => void;
  onOpenLeaderboard: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  stats,
  theme,
  settings,
  multiplayerResults,
  onPlayAgain,
  onGoHome,
  onOpenLeaderboard
}) => {
  const accuracy = stats.totalQuestions > 0
    ? Math.round((stats.correctCount / stats.totalQuestions) * 100)
    : 0;

  // Trigger celebratory confetti if good score
  useEffect(() => {
    if (stats.score > 300 || accuracy >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Save score to Supabase / LocalStorage
    const playerName = getStoredPlayerName();
    saveGameScore({
      player_name: playerName,
      score: stats.score,
      accuracy,
      mode: settings.mode,
      category_name: theme.name
    });
  }, [stats, accuracy, settings, theme]);

  const getRankBadge = (score: number, acc: number) => {
    if (acc === 100 && score >= 800) return { title: '🎵 Maestro Suprême 👑', desc: 'Une oreille absolue en or massif !' };
    if (score >= 600) return { title: '🔥 Mélomane Légendaire', desc: 'Incollable sur ce style de musique !' };
    if (score >= 400) return { title: '🎧 Expert du Groove', desc: 'Très bon niveau de réaction !' };
    if (score >= 200) return { title: '📻 Chanteur de Douche', desc: 'Pas mal du tout, continue ainsi !' };
    return { title: '🌱 Disc-Jockey Débutant', desc: 'La musique s\'apprend, retente ta chance !' };
  };

  const rankInfo = getRankBadge(stats.score, accuracy);

  const handleShare = () => {
    const text = `🎵 J'ai deviné ${stats.correctCount}/${stats.totalQuestions} morceaux (${stats.score} pts) sur le Blind Test MusicFight (${theme.name}) ! Peux-tu faire mieux ?`;
    if (navigator.share) {
      navigator.share({ title: 'MusicFight Score', text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Score copié dans le presse-papier !');
    }
  };

  return (
    <div className="result-screen-container">
      <div className="result-card">
        {/* Header Badge */}
        <div className="result-header">
          <div className="trophy-glow-icon">
            <Trophy className="icon-lg text-gold" />
          </div>
          <h1 className="result-title">Fin de la partie !</h1>
          <div className="rank-badge-box">
            <h2 className="rank-title">{rankInfo.title}</h2>
            <p className="rank-desc">{rankInfo.desc}</p>
          </div>
        </div>

        {/* Local Multiplayer Podium */}
        {multiplayerResults && (
          <div className="podium-section">
            <h3 className="section-subtitle">🏆 Classement de la soirée</h3>
            <div className="podium-list">
              {[...multiplayerResults].sort((a, b) => b.score - a.score).map((p, rank) => (
                <div key={p.name} className={`podium-row rank-${rank + 1}`}>
                  <span className="podium-rank">#{rank + 1}</span>
                  <span className="podium-name">{p.name}</span>
                  <span className="podium-score">{p.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card score-highlight">
            <Award className="stat-icon text-gold" />
            <span className="stat-value">{stats.score}</span>
            <span className="stat-label">Score Total</span>
          </div>

          <div className="stat-card">
            <Music className="stat-icon text-accent" />
            <span className="stat-value">{stats.correctCount} / {stats.totalQuestions}</span>
            <span className="stat-label">Morceaux Devinés</span>
          </div>

          <div className="stat-card">
            <CheckCircle className="stat-icon text-success" />
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">Précision</span>
          </div>

          <div className="stat-card">
            <Zap className="stat-icon text-gold" />
            <span className="stat-value">{(stats.averageResponseTimeMs / 1000).toFixed(1)}s</span>
            <span className="stat-label">Temps Moyen</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          <button className="btn-primary" onClick={onPlayAgain}>
            <RotateCcw className="icon-sm" /> Rejouer ce thème
          </button>
          <button className="btn-secondary" onClick={onGoHome}>
            <Home className="icon-sm" /> Autre Thème
          </button>
          <button className="btn-secondary icon-only" onClick={onOpenLeaderboard} title="Top Scores">
            <Trophy className="icon-sm text-gold" />
          </button>
          <button className="btn-secondary icon-only" onClick={handleShare} title="Partager">
            <Share2 className="icon-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};
