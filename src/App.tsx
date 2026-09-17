import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ThemeSelector } from './components/ThemeSelector';
import { GameModeModal } from './components/GameModeModal';
import { GameBoard } from './components/GameBoard';
import { ResultScreen } from './components/ResultScreen';
import { Leaderboard } from './components/Leaderboard';
import { HelpModal } from './components/HelpModal';
import type { CategoryTheme, GameSettings, GameStats, LocalPlayerState } from './types/game';

export const App: React.FC = () => {
  const [view, setView] = useState<'selector' | 'game' | 'result'>('selector');
  const [selectedTheme, setSelectedTheme] = useState<CategoryTheme | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [multiplayerResults, setMultiplayerResults] = useState<LocalPlayerState[] | undefined>(undefined);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameModeModalOpen, setIsGameModeModalOpen] = useState(false);

  const handleSelectTheme = (theme: CategoryTheme) => {
    setSelectedTheme(theme);
    setIsGameModeModalOpen(true);
  };

  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings);
    setIsGameModeModalOpen(false);
    setView('game');
  };

  const handleFinishGame = (stats: GameStats, playerResults?: LocalPlayerState[]) => {
    setGameStats(stats);
    setMultiplayerResults(playerResults);
    setView('result');
  };

  const handlePlayAgain = () => {
    if (selectedTheme && gameSettings) {
      setView('game');
    } else {
      setView('selector');
    }
  };

  const handleGoHome = () => {
    setSelectedTheme(null);
    setGameSettings(null);
    setGameStats(null);
    setView('selector');
  };

  return (
    <div className="app-container">
      <Navbar
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onHomeClick={handleGoHome}
      />

      <main className="main-content">
        {view === 'selector' && (
          <ThemeSelector onSelectTheme={handleSelectTheme} />
        )}

        {view === 'game' && selectedTheme && gameSettings && (
          <GameBoard
            theme={selectedTheme}
            settings={gameSettings}
            onFinishGame={handleFinishGame}
            onQuitGame={handleGoHome}
          />
        )}

        {view === 'result' && gameStats && selectedTheme && gameSettings && (
          <ResultScreen
            stats={gameStats}
            theme={selectedTheme}
            settings={gameSettings}
            multiplayerResults={multiplayerResults}
            onPlayAgain={handlePlayAgain}
            onGoHome={handleGoHome}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      {isGameModeModalOpen && selectedTheme && (
        <GameModeModal
          theme={selectedTheme}
          onClose={() => setIsGameModeModalOpen(false)}
          onStartGame={handleStartGame}
        />
      )}

      {isLeaderboardOpen && (
        <Leaderboard onClose={() => setIsLeaderboardOpen(false)} />
      )}

      {isHelpOpen && (
        <HelpModal onClose={() => setIsHelpOpen(false)} />
      )}
    </div>
  );
};

export default App;
