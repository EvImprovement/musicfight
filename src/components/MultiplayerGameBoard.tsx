import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Track, Option, RoomPlayer, RoomSettings, RoomBroadcastEvent } from '../types/game';
import type { MultiplayerRoomManager } from '../services/multiplayerRoom';
import { calculateQuestionScore } from '../utils/scoreCalculator';
import { soundFx } from '../services/soundEffects';
import { AudioVisualizer } from './AudioVisualizer';
import { QuestionCard } from './QuestionCard';
import { CheckCircle2, XCircle, Clock, Trophy, Flame, LogOut, Users } from 'lucide-react';

interface MultiplayerGameBoardProps {
  manager: MultiplayerRoomManager;
  settings: RoomSettings;
  tracks: Track[];
  distractorPool: Track[];
  players: RoomPlayer[];
  initialQuestion?: {
    questionIndex: number;
    startTime: number;
    correctOptionId: string | number;
    correctOption: Option;
    options: Option[];
  } | null;
  onFinishGame: (finalPlayers: RoomPlayer[]) => void;
  onQuitGame: () => void;
}

export const MultiplayerGameBoard: React.FC<MultiplayerGameBoardProps> = ({
  manager,
  settings,
  tracks,
  distractorPool,
  players: initialPlayers,
  initialQuestion,
  onFinishGame,
  onQuitGame
}) => {
  // Initialize players with 0 score for fresh round
  const [players, setPlayers] = useState<RoomPlayer[]>(() =>
    initialPlayers.map(p => ({ ...p, score: 0, streak: 0, lastPoints: 0 }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<Option[]>([]);
  const [correctOptionState, setCorrectOption] = useState<Option | null>(null);

  // Round states
  const [countdown, setCountdown] = useState<number | null>(3); // 3... 2... 1... GO!
  const [timeRemaining, setTimeRemaining] = useState(settings.timePerTrack || 10);
  const [stage, setStage] = useState<'countdown' | 'question' | 'reveal' | 'scoreboard'>('countdown');

  // Player action state
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [roundWinner, setRoundWinner] = useState<{ id: string; name: string; points: number } | null>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Audio refs & timers
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  const trackTimerIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Synchronize audio element mute with Navbar soundFx toggle & cleanup timers
  useEffect(() => {
    const unsubMute = soundFx.subscribeMute((muted) => {
      if (audioRef.current) {
        audioRef.current.muted = muted;
      }
    });

    return () => {
      unsubMute();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (trackTimerIntervalRef.current) clearInterval(trackTimerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Stable references for async callbacks & network events
  const hasStartedGameRef = useRef(false);
  const currentIndexRef = useRef(0);
  const stageRef = useRef<'countdown' | 'question' | 'reveal' | 'scoreboard'>('countdown');
  const correctOptionRef = useRef<Option | null>(null);
  const currentTrackRef = useRef<Track | null>(tracks[0] || null);
  const playersRef = useRef<RoomPlayer[]>(players);

  const myPlayerId = manager.myPlayerId;
  const currentTrack = tracks[currentIndex];

  // Keep playersRef synchronized
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Sync presence updates (e.g. if player leaves/joins) without losing scores
  useEffect(() => {
    setPlayers(prev => {
      const merged = initialPlayers.map(initP => {
        const existing = prev.find(p => p.id === initP.id);
        if (existing) {
          return {
            ...initP,
            score: existing.score,
            streak: existing.streak,
            lastPoints: existing.lastPoints
          };
        }
        return { ...initP, score: 0, streak: 0, lastPoints: 0 };
      });
      const sorted = merged.sort((a, b) => b.score - a.score);
      playersRef.current = sorted;
      return sorted;
    });
  }, [initialPlayers]);

  // Helper to sync scores across players
  const updatePlayerScore = useCallback((playerId: string, points: number, correct: boolean) => {
    setPlayers(prev => {
      const updated = prev.map(p => {
        if (p.id === playerId) {
          const newScore = p.score + points;
          const newStreak = correct ? p.streak + 1 : 0;
          return { ...p, score: newScore, streak: newStreak, lastPoints: points };
        }
        return p;
      });
      const sorted = updated.sort((a, b) => b.score - a.score);
      playersRef.current = sorted;
      return sorted;
    });
  }, []);

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

  const playAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = soundFx.getMuted();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlayingAudio(true);
        }).catch((err) => {
          console.warn('[Audio] Autoplay blocked, listening for next user interaction:', err);
          const resumeOnTouch = () => {
            if (audioRef.current && stageRef.current === 'question') {
              audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
            }
            window.removeEventListener('pointerdown', resumeOnTouch);
            window.removeEventListener('touchstart', resumeOnTouch);
          };
          window.addEventListener('pointerdown', resumeOnTouch, { once: true, passive: true });
          window.addEventListener('touchstart', resumeOnTouch, { once: true, passive: true });
        });
      }
    }
  }, []);

  // Start question countdown on devices
  const handleStartQuestionLocally = useCallback((
    index: number,
    options: Option[],
    correct: Option,
    startTime: number
  ) => {
    // Clear any previous countdown/question intervals
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (trackTimerIntervalRef.current) {
      clearInterval(trackTimerIntervalRef.current);
      trackTimerIntervalRef.current = null;
    }

    setCurrentIndex(index);
    currentIndexRef.current = index;

    setCurrentOptions(options);
    setCorrectOption(correct);
    correctOptionRef.current = correct;

    setSelectedOption(null);
    setIsLockedOut(false);
    setRoundWinner(null);

    setStage('countdown');
    stageRef.current = 'countdown';
    setCountdown(3);

    const track = tracks[index];
    currentTrackRef.current = track || null;

    // Preload audio into memory so it starts instantly when countdown hits 0
    if (audioRef.current && track?.preview) {
      const audio = audioRef.current;
      audio.pause();
      audio.src = track.preview;
      audio.currentTime = 0;
      audio.volume = 1.0;
      audio.muted = soundFx.getMuted();
      audio.load();
    }

    // Synchronized countdown loop (3... 2... 1... GO!)
    const updateCountdown = () => {
      const remainingMs = startTime - Date.now();
      if (remainingMs <= 100) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        setStage('question');
        stageRef.current = 'question';
        questionStartTimeRef.current = Date.now();
        playAudio();
        startQuestionTimer();
      } else {
        // Clamped between 1 and 3 so 4 is never shown
        const sec = Math.min(3, Math.max(1, Math.ceil(remainingMs / 1000)));
        setCountdown(sec);
      }
    };

    updateCountdown();
    countdownIntervalRef.current = window.setInterval(updateCountdown, 100);
  }, [tracks, playAudio]);

  const startQuestionTimer = useCallback(() => {
    const totalTime = settings.timePerTrack || 10;
    setTimeRemaining(totalTime);

    if (trackTimerIntervalRef.current) {
      clearInterval(trackTimerIntervalRef.current);
      trackTimerIntervalRef.current = null;
    }

    trackTimerIntervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
      const remaining = Math.max(0, totalTime - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (trackTimerIntervalRef.current) {
          clearInterval(trackTimerIntervalRef.current);
          trackTimerIntervalRef.current = null;
        }
        handleTimeout();
      }
    }, 100);
  }, [settings.timePerTrack]);

  const triggerReveal = useCallback((
    winner: { id: string; name: string; points: number } | null,
    _points: number,
    correctOpt: Option,
    _track: Track
  ) => {
    if (trackTimerIntervalRef.current) {
      clearInterval(trackTimerIntervalRef.current);
      trackTimerIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);

    setRoundWinner(winner);
    setCorrectOption(correctOpt);
    correctOptionRef.current = correctOpt;
    setStage('reveal');
    stageRef.current = 'reveal';

    // After 2.6 seconds, show scoreboard
    setTimeout(() => {
      setStage('scoreboard');
      stageRef.current = 'scoreboard';

      // After 3 seconds of scoreboard, Host advances to next question
      if (manager.isHost) {
        setTimeout(() => {
          const nextIndex = currentIndexRef.current + 1;
          startQuestionRound(nextIndex);
        }, 3000);
      }
    }, 2600);
  }, [manager]);

  const handleTimeout = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAudio(false);

    if (manager.isHost && correctOptionRef.current && currentTrackRef.current) {
      manager.sendEvent({
        type: 'ROUND_RESULT',
        pointsGained: 0,
        correctOption: correctOptionRef.current,
        track: currentTrackRef.current,
        updatedScores: {}
      });
      triggerReveal(null, 0, correctOptionRef.current, currentTrackRef.current);
    }
  }, [manager, triggerReveal]);

  // Host starts a question round
  const startQuestionRound = useCallback((index: number) => {
    if (index >= tracks.length) {
      manager.sendEvent({
        type: 'GAME_OVER',
        finalRankings: playersRef.current
      });
      onFinishGame(playersRef.current);
      return;
    }

    const track = tracks[index];
    if (!track) return;

    // Pick 3 distractors from pool
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
    const startTime = Date.now() + 3000; // 3.0s synchronized countdown

    manager.sendEvent({
      type: 'QUESTION_START',
      questionIndex: index,
      startTime,
      correctOptionId: correctOpt.id,
      options
    });

    handleStartQuestionLocally(index, options, correctOpt, startTime);
  }, [tracks, distractorPool, manager, onFinishGame, handleStartQuestionLocally]);

  // Initialize Question 0 on mount for BOTH Host and Guests
  useEffect(() => {
    if (initialQuestion && !hasStartedGameRef.current) {
      hasStartedGameRef.current = true;
      handleStartQuestionLocally(
        initialQuestion.questionIndex,
        initialQuestion.options,
        initialQuestion.correctOption,
        initialQuestion.startTime
      );
    } else if (manager.isHost && !hasStartedGameRef.current && tracks.length > 0) {
      hasStartedGameRef.current = true;
      const initTimer = setTimeout(() => {
        startQuestionRound(0);
      }, 800);
      return () => clearTimeout(initTimer);
    }
  }, [initialQuestion, manager.isHost, tracks.length, handleStartQuestionLocally, startQuestionRound]);

  // Listen to network events from room
  useEffect(() => {
    const handleEvent = (event: RoomBroadcastEvent) => {
      switch (event.type) {
        case 'QUESTION_START':
          // Avoid duplicate start if already initialized via initialQuestion
          if (event.questionIndex === currentIndexRef.current && stageRef.current !== 'countdown') {
            return;
          }
          handleStartQuestionLocally(
            event.questionIndex,
            event.options,
            { id: event.correctOptionId, title: '', artistName: '', isTrackTitle: true },
            event.startTime
          );
          break;

        case 'PLAYER_BUZZ':
          if (manager.isHost && correctOptionRef.current && currentTrackRef.current && stageRef.current === 'question') {
            const isCorrect = event.optionId === correctOptionRef.current.id;
            if (isCorrect) {
              const scoreCalc = calculateQuestionScore(event.responseTimeMs / 1000);
              const points = scoreCalc.finalPoints;
              updatePlayerScore(event.playerId, points, true);

              manager.sendEvent({
                type: 'ROUND_RESULT',
                winnerPlayerId: event.playerId,
                winnerName: event.playerName,
                pointsGained: points,
                correctOption: correctOptionRef.current,
                track: currentTrackRef.current,
                updatedScores: {}
              });

              triggerReveal(
                { id: event.playerId, name: event.playerName, points },
                points,
                correctOptionRef.current,
                currentTrackRef.current
              );
            }
          }
          break;

        case 'ROUND_RESULT':
          // Guests update state from host broadcast
          if (!manager.isHost) {
            if (event.winnerPlayerId) {
              updatePlayerScore(event.winnerPlayerId, event.pointsGained, true);
            }
            triggerReveal(
              event.winnerPlayerId ? { id: event.winnerPlayerId, name: event.winnerName || 'Joueur', points: event.pointsGained } : null,
              event.pointsGained,
              event.correctOption,
              event.track
            );
          }
          break;

        case 'GAME_OVER':
          onFinishGame(event.finalRankings || playersRef.current);
          break;
      }
    };

    const unsubscribe = manager.subscribeEvents(handleEvent);
    return () => {
      unsubscribe();
    };
  }, [manager, handleStartQuestionLocally, triggerReveal, updatePlayerScore, onFinishGame]);

  // Player clicks an option
  const handleSelectOption = (option: Option) => {
    if (stageRef.current !== 'question' || isLockedOut || selectedOption || !correctOptionRef.current) return;

    setSelectedOption(option);
    const responseTime = Date.now() - questionStartTimeRef.current;
    const isCorrect = String(option.id) === String(correctOptionRef.current.id);
    const myPlayerName = playersRef.current.find(p => p.id === myPlayerId)?.name || 'Moi';

    if (settings.gameplayMode === 'buzzer') {
      if (isCorrect) {
        soundFx.playCorrectSound();
        const scoreCalc = calculateQuestionScore(responseTime / 1000);
        const points = scoreCalc.finalPoints;

        if (audioRef.current) audioRef.current.pause();
        setIsPlayingAudio(false);

        // Notify room
        manager.sendEvent({
          type: 'PLAYER_BUZZ',
          playerId: myPlayerId,
          playerName: myPlayerName,
          optionId: option.id,
          responseTimeMs: responseTime
        });

        if (manager.isHost && currentTrackRef.current) {
          updatePlayerScore(myPlayerId, points, true);
          manager.sendEvent({
            type: 'ROUND_RESULT',
            winnerPlayerId: myPlayerId,
            winnerName: myPlayerName,
            pointsGained: points,
            correctOption: correctOptionRef.current,
            track: currentTrackRef.current,
            updatedScores: {}
          });
          triggerReveal({ id: myPlayerId, name: myPlayerName, points }, points, correctOptionRef.current, currentTrackRef.current);
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

  // Clean up timers & audio on unmount
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

      {/* Solo Notice if other players left */}
      {players.length <= 1 && (
        <div style={{ textAlign: 'center', padding: '0.35rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          <Users className="icon-xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          Les autres joueurs ont quitté le salon.
        </div>
      )}

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
                  style={{ width: `${(timeRemaining / (settings.timePerTrack || 10)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4 Choices */}
          {(() => {
            const revealedCorrectOption = (selectedOption && String(selectedOption.id) === String(correctOptionState?.id))
              ? selectedOption
              : null;

            return (
              <QuestionCard
                options={currentOptions}
                selectedOption={selectedOption}
                correctOption={revealedCorrectOption}
                isAnswered={isLockedOut || !!selectedOption}
                onSelectOption={handleSelectOption}
              />
            );
          })()}
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
