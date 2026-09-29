import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ThemeSelector } from './components/ThemeSelector';
import { GameModeModal } from './components/GameModeModal';
import { GameBoard } from './components/GameBoard';
import { ResultScreen } from './components/ResultScreen';
import { Leaderboard } from './components/Leaderboard';
import { HelpModal } from './components/HelpModal';
import { AuthModal } from './components/AuthModal';
import { MultiplayerHub } from './components/MultiplayerHub';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerGameBoard } from './components/MultiplayerGameBoard';
import { MultiplayerPodium } from './components/MultiplayerPodium';
import { getStoredPlayerProfile } from './services/supabaseClient';
import { connectToMultiplayerRoom } from './services/multiplayerRoom';
import type { MultiplayerRoomManager } from './services/multiplayerRoom';
import type {
  CategoryTheme,
  GameSettings,
  GameStats,
  LocalPlayerState,
  RoomPlayer,
  RoomSettings,
  Track,
  Option
} from './types/game';

export const App: React.FC = () => {
  const [view, setView] = useState<
    'selector' | 'game' | 'result' | 'room_lobby' | 'room_game' | 'room_podium'
  >('selector');
  const [selectedTheme, setSelectedTheme] = useState<CategoryTheme | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [multiplayerResults, setMultiplayerResults] = useState<LocalPlayerState[] | undefined>(undefined);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameModeModalOpen, setIsGameModeModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Multiplayer Rooms state
  const [isMultiplayerHubOpen, setIsMultiplayerHubOpen] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState('');
  const [roomManager, setRoomManager] = useState<MultiplayerRoomManager | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [roomSettings, setRoomSettings] = useState<RoomSettings | null>(null);
  const [roomTracks, setRoomTracks] = useState<Track[]>([]);
  const [roomDistractorPool, setRoomDistractorPool] = useState<Track[]>([]);
  const [roomFinalPlayers, setRoomFinalPlayers] = useState<RoomPlayer[]>([]);
  const [roomInitialQuestion, setRoomInitialQuestion] = useState<{
    questionIndex: number;
    startTime: number;
    correctOptionId: string | number;
    correctOption: Option;
    options: Option[];
  } | null>(null);

  // Check URL query parameters for invite links (e.g. ?room=MF-482)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('room');
      if (code) {
        setInitialRoomCode(code.toUpperCase().trim());
        setIsMultiplayerHubOpen(true);
      }
    } catch (_) {}
  }, []);

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
    if (roomManager) {
      roomManager.leaveRoom();
      setRoomManager(null);
    }
    setSelectedTheme(null);
    setGameSettings(null);
    setGameStats(null);
    setView('selector');
  };

  const handleJoinMultiplayerRoom = async (
    roomCode: string,
    playerName: string,
    avatar: string,
    isHost: boolean
  ): Promise<boolean> => {
    const mgr = await connectToMultiplayerRoom({
      roomCode,
      name: playerName,
      avatar,
      isHost,
      onPlayersChange: (updatedPlayers) => {
        setRoomPlayers(updatedPlayers);
      },
      onEvent: (event) => {
        if (event.type === 'GAME_STARTING') {
          setRoomSettings(event.settings);
          setRoomTracks(event.tracks);
          setRoomDistractorPool(event.distractorPool);
          setRoomInitialQuestion(event.initialQuestion || null);
          setView('room_game');
        } else if (event.type === 'RETURN_TO_LOBBY') {
          setView('room_lobby');
        } else if (event.type === 'SETTINGS_UPDATE') {
          setRoomSettings(event.settings);
        }
      }
    });

    if (mgr) {
      setRoomManager(mgr);
      setIsMultiplayerHubOpen(false);
      setView('room_lobby');
      return true;
    }
    return false;
  };

  // Host launches game from Lobby
  const handleHostStartRoomGame = (
    settings: RoomSettings,
    tracks: Track[],
    distractorPool: Track[],
    initialQuestion?: {
      questionIndex: number;
      startTime: number;
      correctOptionId: string | number;
      correctOption: Option;
      options: Option[];
    }
  ) => {
    setRoomSettings(settings);
    setRoomTracks(tracks);
    setRoomDistractorPool(distractorPool);
    setRoomInitialQuestion(initialQuestion || null);
    setView('room_game');
  };

  const handleRoomFinishGame = (finalPlayers: RoomPlayer[]) => {
    setRoomFinalPlayers(finalPlayers);
    setView('room_podium');
  };

  const handleLeaveRoom = () => {
    if (roomManager) {
      roomManager.leaveRoom();
      setRoomManager(null);
    }
    setRoomInitialQuestion(null);
    setView('selector');
  };

  return (
    <div className="app-container">
      <Navbar
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onHomeClick={handleGoHome}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenMultiplayer={() => setIsMultiplayerHubOpen(true)}
      />

      <main className="main-content">
        {view === 'selector' && (
          <ThemeSelector
            onSelectTheme={handleSelectTheme}
            onOpenMultiplayer={() => setIsMultiplayerHubOpen(true)}
          />
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

        {/* MULTIPLAYER ROOM VIEWS */}
        {view === 'room_lobby' && roomManager && (
          <MultiplayerLobby
            manager={roomManager}
            players={roomPlayers}
            initialSettings={roomSettings || undefined}
            onStartGame={handleHostStartRoomGame}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {view === 'room_game' && roomManager && roomSettings && (
          <MultiplayerGameBoard
            manager={roomManager}
            settings={roomSettings}
            tracks={roomTracks}
            distractorPool={roomDistractorPool}
            players={roomPlayers}
            initialQuestion={roomInitialQuestion}
            onFinishGame={handleRoomFinishGame}
            onQuitGame={handleLeaveRoom}
          />
        )}

        {view === 'room_podium' && roomManager && roomSettings && (
          <MultiplayerPodium
            manager={roomManager}
            settings={roomSettings}
            finalPlayers={roomFinalPlayers.length > 0 ? roomFinalPlayers : roomPlayers}
            onPlayAgain={() => setView('room_lobby')}
            onQuit={handleLeaveRoom}
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

      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={() => {
            setIsAuthOpen(false);
          }}
          canDismiss={!!getStoredPlayerProfile()}
        />
      )}

      {/* Multiplayer Hub Modal */}
      {isMultiplayerHubOpen && (
        <MultiplayerHub
          initialCode={initialRoomCode}
          onClose={() => setIsMultiplayerHubOpen(false)}
          onJoinRoom={handleJoinMultiplayerRoom}
        />
      )}
    </div>
  );
};

export default App;
