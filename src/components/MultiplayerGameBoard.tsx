import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Track, Option, RoomPlayer, RoomSettings, RoomBroadcastEvent } from '../types/game';
import type { MultiplayerRoomManager } from '../services/multiplayerRoom';
import { calculateQuestionScore } from '../utils/scoreCalculator';
import { soundFx } from '../services/soundEffects';
import { AudioVisualizer } from './AudioVisualizer';
import { QuestionCard } from './QuestionCard';
import { CheckCircle2, XCircle, Clock, Volume2, Trophy, Flame, LogOut } from 'lucide-react';

interface MultiplayerGameBoardProps {
  manager: MultiplayerRoomManager;
  settings: RoomSettings;
  tracks: Track[];
  distractorPool: Track[];
  players: RoomPlayer[];
  onFinishGame: (finalPlayers: RoomPlayer[]) => void;
  onQuitGame: () => void;
}

export const MultiplayerGameBoard: React.FC<MultiplayerGameBoardProps> = ({
  manager,
  settings,
  tracks,
  distractorPool,
  players: initialPlayers,
  onFinishGame,
  onQuitGame
}) => {
  const [players, setPlayers] = useState<RoomPlayer[]>(initialPlayers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<Option[]>([]);
  const [correctOption, setCorrectOption] = useState<Option | null>(null);

  // Round states
  const [countdown, setCountdown] = useState<number | null>(3); // 3, 2, 1, GO
  const [timeRemaining, setTimeRemaining] = useState(settings.timePerTrack || 10);
  const [stage, setStage] = useState<'countdown' | 'question' | 'reveal' | 'scoreboard'>('countdown');

  // Player action state
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [roundWinner, setRoundWinner] = useState<{ id: string; name: string; points: number } | null>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);

  // Audio refs & intervals
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  const trackTimerIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const isHost = manager.isHost;
  const myPlayerId = manager.myPlayerId;
  const currentTrack = tracks[currentIndex];

  // Helper to sync scores across players
  const updatePlayerScore = (playerId: string, points: number, correct: boolean) => {
    setPlayers(prev => {
      const updated = prev.map(p => {
        if (p.id === playerId) {
          const newScore = p.score + points;
          const newStreak = correct ? p.streak + 1 : 0;
          return { ...p, score: newScore, streak: newStreak, lastPoints: points };
        }
        return p;
      });
      return updated.sort((a, b) => b.score - a.score);
    });
  };

  // Preload track cover image for instant reveal
  useEffect(() => {
    if (currentTrack?.album) {
      const url = currentTrack.album.cover_medium || currentTrack.album.cover_big;
      if (url) {
        const img = new Image();
        img.src = url;
        if (img.decode) img.decode().catch(() => {});
      }
    }
    const nextTrack = tracks[currentIndex + 1];
    if (nextTrack?.album) {
      const url = nextTrack.album.cover_medium || nextTrack.album.cover_big;
      if (url) {
        const img = new Image();
        img.src = url;
        if (img.decode) img.decode().catch(() => {});
      }
    }
  }, [currentIndex, currentTrack, tracks]);

  // Host starts a question
  const startQuestionRound = useCallback((index: number) => {
    if (index >= tracks.length) {
      manager.sendEvent({
        type: 'GAME_OVER',
        finalRankings: players
      });
      onFinishGame(players);
      return;
    }

    const track = tracks[index];
    if (!track) return;

    // Pick 3 distractors
    const otherTracks = distractorPool.filter(t => t.id !== track.id && t.title !== track.title);
    const shuffledOthers = [...otherTracks].sort(() => Math.random() - 0.5).slice(0, 3);

    const correctOpt: Option = {
      id: track.id,
      title: track.title,
      artistName: track.artist.name,
      isTrackTitle: true
    };

    const distractorOpts: Option[] = shuffledOthers.map((t, idx) => ({
      id: `dist_${idx}_${t.id}`,
      title: t.title,
      artistName: t.artist.name,
      isTrackTitle: true
    }));

    const options = [correctOpt, ...distractorOpts].sort(() => Math.random() - 0.5);
    const startTime = Date.now() + 3200; // 3.2s synchronized countdown

    manager.sendEvent({
      type: 'QUESTION_START',
      questionIndex: index,
      startTime,
      correctOptionId: correctOpt.id,
      options
    });

    handleStartQuestionLocally(index, options, correctOpt, startTime);
  }, [tracks, distractorPool, manager, players, onFinishGame]);

  const handleStartQuestionLocally = (
    index: number,
    options: Option[],
    correct: Option,
    startTime: number
  ) => {
    setCurrentIndex(index);
    setCurrentOptions(options);
    setCorrectOption(correct);
    setSelectedOption(null);
    setIsLockedOut(false);
    setRoundWinner(null);
    setStage('countdown');

    const track = tracks[index];

    // Preload audio
    if (audioRef.current && track) {
      const audio = audioRef.current;
      audio.pause();
      audio.src = track.preview;
      audio.currentTime = 0;
      audio.volume = 1.0;
      audio.muted = soundFx.getMuted();
    }

    // Synchronized countdown
    const updateCountdown = () => {
      const remainingMs = startTime - Date.now();
      if (remainingMs <= 200) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setCountdown(null);
        setStage('question');
        questionStartTimeRef.current = Date.now();
        playAudio();
        startQuestionTimer();
      } else {
        const sec = Math.ceil(remainingMs / 1000);
        setCountdown(sec);
      }
    };

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = window.setInterval(updateCountdown, 100);
  };

  const playAudio = () => {
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlayingAudio(true);
          setIsAudioBlocked(false);
        }).catch(() => {
          setIsAudioBlocked(true);
        });
      }
    }
  };

  const startQuestionTimer = () => {
    setTimeRemaining(settings.timePerTrack);
    if (trackTimerIntervalRef.current) clearInterval(trackTimerIntervalRef.current);

    trackTimerIntervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
      const remaining = Math.max(0, settings.timePerTrack - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (trackTimerIntervalRef.current) clearInterval(trackTimerIntervalRef.current);
        handleTimeout();
      }
    }, 100);
  };

  const handleTimeout = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAudio(false);

    if (isHost && correctOption && currentTrack) {
      manager.sendEvent({
        type: 'ROUND_RESULT',
        pointsGained: 0,
        correctOption,
        track: currentTrack,
        updatedScores: {}
      });
      triggerReveal(null, 0, correctOption, currentTrack);
    }
  };

  // Player clicks an option
  const handleSelectOption = (option: Option) => {
    if (stage !== 'question' || isLockedOut || selectedOption || !correctOption) return;

    setSelectedOption(option);
    const responseTime = Date.now() - questionStartTimeRef.current;
    const isCorrect = option.id === correctOption.id;

    if (settings.gameplayMode === 'buzzer') {
      if (isCorrect) {
        // Player found it first!
        soundFx.playCorrectSound();
        const scoreCalc = calculateQuestionScore(responseTime / 1000);
        const points = scoreCalc.finalPoints;

        if (audioRef.current) audioRef.current.pause();
        setIsPlayingAudio(false);

        // Notify room
        manager.sendEvent({
          type: 'PLAYER_BUZZ',
          playerId: myPlayerId,
          playerName: manager.myPlayerId,
          optionId: option.id,
          responseTimeMs: responseTime
        });

        if (isHost && currentTrack) {
          updatePlayerScore(myPlayerId, points, true);
          manager.sendEvent({
            type: 'ROUND_RESULT',
            winnerPlayerId: myPlayerId,
            winnerName: players.find(p => p.id === myPlayerId)?.name || 'Moi',
            pointsGained: points,
            correctOption,
            track: currentTrack,
            updatedScores: {}
          });
          triggerReveal({ id: myPlayerId, name: 'Moi', points }, points, correctOption, currentTrack);
        }
      } else {
        // Wrong buzzer! Lock player out so other players can continue
        soundFx.playWrongSound();
        setIsLockedOut(true);
      }
    } else {
      // Classic mode: everyone can submit
      if (isCorrect) {
        soundFx.playCorrectSound();
        const scoreCalc = calculateQuestionScore(responseTime / 1000);
        updatePlayerScore(myPlayerId, scoreCalc.finalPoints, true);
      } else {
        soundFx.playWrongSound();
      }
    }
  };

  const triggerReveal = (
    winner: { id: string; name: string; points: number } | null,
    _points: number,
    correctOpt: Option,
    _track: Track
  ) => {
    if (trackTimerIntervalRef.current) clearInterval(trackTimerIntervalRef.current);
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAudio(false);

    setRoundWinner(winner);
    setCorrectOption(correctOpt);
    setStage('reveal');

    // After 2.6 seconds, show scoreboard
    setTimeout(() => {
      setStage('scoreboard');
      // After 3 seconds of scoreboard, advance to next question
      if (isHost) {
        setTimeout(() => {
          startQuestionRound(currentIndex + 1);
        }, 3200);
      }
    }, 2800);
  };

  // Listen to network events from room
  useEffect(() => {
    const handleEvent = (event: RoomBroadcastEvent) => {
      switch (event.type) {
        case 'QUESTION_START':
          handleStartQuestionLocally(
            event.questionIndex,
            event.options,
            { id: event.correctOptionId, title: '', artistName: '', isTrackTitle: true },
            event.startTime
          );
          break;

        case 'PLAYER_BUZZ':
          if (isHost && correctOption && currentTrack && stage === 'question') {
            const isCorrect = event.optionId === correctOption.id;
            if (isCorrect) {
              const scoreCalc = calculateQuestionScore(event.responseTimeMs / 1000);
              const points = scoreCalc.finalPoints;
              updatePlayerScore(event.playerId, points, true);

              manager.sendEvent({
                type: 'ROUND_RESULT',
                winnerPlayerId: event.playerId,
                winnerName: event.playerName,
                pointsGained: points,
                correctOption,
                track: currentTrack,
                updatedScores: {}
              });

              triggerReveal({ id: event.playerId, name: event.playerName, points }, points, correctOption, currentTrack);
            }
          }
          break;

        case 'ROUND_RESULT':
          triggerReveal(
            event.winnerPlayerId ? { id: event.winnerPlayerId, name: event.winnerName || 'Joueur', points: event.pointsGained } : null,
            event.pointsGained,
            event.correctOption,
            event.track
          );
          if (event.winnerPlayerId) {
            updatePlayerScore(event.winnerPlayerId, event.pointsGained, true);
          }
          break;

        case 'GAME_OVER':
          onFinishGame(event.finalRankings || players);
          break;
      }
    };

    // Attach event listener via room manager
    const originalChannel = manager.channel;
    originalChannel.on('broadcast', { event: 'ROOM_EVENT' }, (envelope: any) => {
      if (envelope?.payload) handleEvent(envelope.payload);
    });

    // If host, start first round on mount
    if (isHost && currentIndex === 0 && stage === 'countdown' && tracks.length > 0) {
      const initTimer = setTimeout(() => {
        startQuestionRound(0);
      }, 500);
      return () => clearTimeout(initTimer);
    }
  }, [isHost, correctOption, currentTrack, stage, currentIndex, tracks, manager, players, onFinishGame]);

  // Clean up
  useEffect(() => {
    return () => {
      if (trackTimerIntervalRef.current) clearInterval(trackTimerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return (
    <div className="gameboard-container multiplayer-gameboard">
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      {/* TOP BAR: Room Code, Question count, Scores */}
      <div className="gameboard-header">
        <div className="room-indicator-pill">
          <span className="pulse-dot" /> Salon <strong>{manager.roomCode}</strong>
        </div>

        <div className="question-counter-badge">
          Morceau <strong>{currentIndex + 1}</strong> / {settings.trackCount}
        </div>

        {/* Live Mini Leaderboard Top Bar */}
        <div className="live-player-pills-row">
          {players.slice(0, 3).map((p, rank) => (
            <div key={p.id} className={`mini-player-badge ${p.id === myPlayerId ? 'is-me' : ''}`}>
              <span className="mini-rank">#{rank + 1}</span>
              <span className="mini-avatar">{p.avatar}</span>
              <span className="mini-name">{p.name}</span>
              <span className="mini-score">{p.score} pts</span>
            </div>
          ))}
          <button
            onClick={onQuitGame}
            className="btn-secondary btn-sm"
            title="Quitter la partie"
            style={{ padding: '0.28rem 0.6rem', fontSize: '0.75rem', borderRadius: '20px' }}
          >
            <LogOut className="icon-xs" />
          </button>
        </div>
      </div>

      {/* STAGE 1: COUNTDOWN 3... 2... 1... GO! */}
      {stage === 'countdown' && (
        <div className="countdown-overlay">
          <div className="countdown-card">
            <h3 className="countdown-theme-title">{settings.themeIcon} {settings.themeName}</h3>
            <div className="countdown-number-display">
              {countdown !== null && countdown > 0 ? countdown : 'GO !'}
            </div>
            <p className="countdown-hint">
              {settings.gameplayMode === 'buzzer' ? '⚡ Premier qui trouve vole le point !' : 'Préparez-vous à répondre !'}
            </p>
          </div>
        </div>
      )}

      {/* STAGE 2: QUESTION & VISUALIZER */}
      {stage === 'question' && (
        <>
          <div className="visualizer-section">
            <AudioVisualizer audioElement={audioRef.current} isPlaying={isPlayingAudio} />

            {/* Audio Blocked Alert */}
            {isAudioBlocked && (
              <button
                className="btn-primary start-audio-trigger-btn"
                onClick={() => audioRef.current?.play()}
              >
                <Volume2 className="icon-sm" /> Activer le son
              </button>
            )}

            {/* Locked out alert */}
            {isLockedOut && (
              <div className="buzzer-locked-badge">
                <XCircle className="icon-xs" /> Mauvaise réponse ! Buzzer verrouillé pour ce son.
              </div>
            )}

            {/* Progress bar */}
            <div className="timer-decay-container">
              <div className="timer-decay-header">
                <span className="decay-label">
                  <Clock className="icon-xs" /> Temps restant
                </span>
                <span className="decay-seconds">{timeRemaining.toFixed(1)}s</span>
              </div>
              <div className="decay-progress-bg">
                <div
                  className="decay-progress-fill"
                  style={{ width: `${(timeRemaining / settings.timePerTrack) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4 Choices */}
          <QuestionCard
            options={currentOptions}
            selectedOption={selectedOption}
            correctOption={null}
            isAnswered={isLockedOut || !!selectedOption}
            onSelectOption={handleSelectOption}
          />
        </>
      )}

      {/* STAGE 3: REVEAL MODAL */}
      {stage === 'reveal' && currentTrack && (
        <div className="reveal-modal-overlay">
          <div className={`reveal-modal-card ${roundWinner ? 'success' : 'fail'}`}>
            <div className="reveal-status-header">
              {roundWinner ? (
                <>
                  <CheckCircle2 className="reveal-status-icon text-success" />
                  <div>
                    <h2 className="reveal-status-title text-success">
                      {roundWinner.id === myPlayerId ? '🎉 Tu as trouvé en premier !' : `⚡ ${roundWinner.name} a buzzé !`}
                    </h2>
                    <span className="reveal-points-badge">+{roundWinner.points} points</span>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="reveal-status-icon text-orange" />
                  <div>
                    <h2 className="reveal-status-title text-danger">Personne n'a trouvé !</h2>
                    <span className="reveal-points-badge fail">+0 point</span>
                  </div>
                </>
              )}
            </div>

            <div className="reveal-track-details">
              <img
                src={currentTrack.album.cover_medium || currentTrack.album.cover_big}
                alt={currentTrack.title}
                className="reveal-album-cover"
                width={120}
                height={120}
                loading="eager"
                decoding="sync"
              />
              <div className="reveal-track-meta">
                <span className="reveal-track-label">C'était :</span>
                <h3 className="reveal-track-title">{currentTrack.title}</h3>
                <p className="reveal-track-artist">{currentTrack.artist.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 4: LIVE SCOREBOARD POPUP */}
      {stage === 'scoreboard' && (
        <div className="reveal-modal-overlay">
          <div className="scoreboard-modal-card">
            <div className="scoreboard-header">
              <Trophy className="icon-md text-gold" />
              <h2 className="modal-title">Classement en direct</h2>
              <span className="scoreboard-sub">Morceau {currentIndex + 1} / {settings.trackCount}</span>
            </div>

            <div className="scoreboard-list">
              {players.map((p, idx) => (
                <div key={p.id} className={`scoreboard-row ${p.id === myPlayerId ? 'is-me' : ''}`}>
                  <span className={`rank-pill rank-${idx + 1}`}>#{idx + 1}</span>
                  <span className="player-avatar-circle mini">{p.avatar}</span>
                  <span className="player-name-cell">
                    {p.name}
                    {p.streak >= 2 && <span className="streak-badge"><Flame className="icon-xs text-orange" /> {p.streak}</span>}
                  </span>
                  <span className="player-score-cell">{p.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
