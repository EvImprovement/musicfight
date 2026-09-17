import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Track, Option, CategoryTheme, GameSettings, QuestionResult, GameStats, LocalPlayerState } from '../types/game';
import { getPlaylistTracks, getArtistTracks, getAlbumTracks, getGeneralDistractorTracks } from '../services/deezerApi';
import { calculateQuestionScore } from '../utils/scoreCalculator';
import { soundFx } from '../services/soundEffects';
import { AudioVisualizer } from './AudioVisualizer';
import { QuestionCard } from './QuestionCard';
import { Loader2, Heart, Award, Volume2, Play, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface GameBoardProps {
  theme: CategoryTheme;
  settings: GameSettings;
  onFinishGame: (stats: GameStats, playerResults?: LocalPlayerState[]) => void;
  onQuitGame: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  theme,
  settings,
  onFinishGame,
  onQuitGame
}) => {
  // Game setup states
  const [tracks, setTracks] = useState<Track[]>([]);
  const [distractorPool, setDistractorPool] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Gameplay state
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<Option[]>([]);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [correctOption, setCorrectOption] = useState<Option | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [lastPointsGained, setLastPointsGained] = useState(0);

  // Scoring & timers (10s timer per track)
  const timePerTrack = settings.timePerTrack || 10;
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeRemainingTrack, setTimeRemainingTrack] = useState(timePerTrack);
  const [globalTimeRemaining, setGlobalTimeRemaining] = useState(60); // for Time Attack mode
  const [currentQuestionPoints, setCurrentQuestionPoints] = useState(100);

  // Local Multiplayer players state
  const [localPlayers, setLocalPlayers] = useState<LocalPlayerState[]>(
    settings.playerNames ? settings.playerNames.map(name => ({ name, score: 0, streak: 0 })) : []
  );
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  // Synchronous REFS to prevent React state closure lag on game completion
  const scoreRef = useRef<number>(0);
  const historyRef = useRef<QuestionResult[]>([]);

  // Audio refs & timers
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  const trackTimerIntervalRef = useRef<number | null>(null);
  const globalTimerIntervalRef = useRef<number | null>(null);
  const nextQuestionTimeoutRef = useRef<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Clean up all timers and stop audio on component unmount & sync MUTE toggle
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
      if (globalTimerIntervalRef.current) clearInterval(globalTimerIntervalRef.current);
      if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
    };
  }, []);

  const handleQuit = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (trackTimerIntervalRef.current) clearInterval(trackTimerIntervalRef.current);
    if (globalTimerIntervalRef.current) clearInterval(globalTimerIntervalRef.current);
    if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
    onQuitGame();
  };

  // Fetch Tracks on Component Mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        let fetchedTracks: Track[] = [];

        if (theme.type === 'playlist' || theme.type === 'chart') {
          fetchedTracks = await getPlaylistTracks(theme);
        } else if (theme.type === 'artist') {
          fetchedTracks = await getArtistTracks(theme.deezerId || '', theme.name);
        } else if (theme.type === 'album') {
          fetchedTracks = await getAlbumTracks(theme.deezerId || '', theme.name, theme.query || '');
        }

        const distractors = await getGeneralDistractorTracks();

        if (isMounted) {
          if (fetchedTracks.length < 4) {
            setLoadError("Nombre insuffisant de morceaux trouvés pour ce thème sur Deezer. Essayez un autre thème !");
            setIsLoading(false);
            return;
          }

          const shuffled = [...fetchedTracks].sort(() => Math.random() - 0.5);
          setTracks(shuffled);
          setDistractorPool(distractors);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError("Erreur de connexion avec l'API Deezer.");
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [theme]);

  // Global timer for Time Attack mode
  useEffect(() => {
    if (settings.mode !== 'timeattack' || !hasStarted || isLoading) return;

    globalTimerIntervalRef.current = window.setInterval(() => {
      setGlobalTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(globalTimerIntervalRef.current!);
          finishGameSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (globalTimerIntervalRef.current) clearInterval(globalTimerIntervalRef.current);
    };
  }, [settings.mode, hasStarted, isLoading]);

  // Finish Game Session with 100% up-to-date scoreRef and historyRef
  const finishGameSession = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    if (trackTimerIntervalRef.current) clearInterval(trackTimerIntervalRef.current);
    if (globalTimerIntervalRef.current) clearInterval(globalTimerIntervalRef.current);
    if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);

    soundFx.playVictoryFanfare();

    const fullHistory = historyRef.current;
    const finalScore = scoreRef.current;
    const correctCount = fullHistory.filter(h => h.isCorrect).length;
    const totalCount = fullHistory.length || 1;
    const avgResponse = fullHistory.reduce((acc, h) => acc + h.responseTimeMs, 0) / totalCount;

    const stats: GameStats = {
      score: finalScore,
      correctCount,
      totalQuestions: fullHistory.length,
      maxStreak: 0,
      averageResponseTimeMs: Math.round(avgResponse),
      history: fullHistory
    };

    onFinishGame(stats, settings.mode === 'multiplayer' ? localPlayers : undefined);
  }, [localPlayers, onFinishGame, settings.mode]);

  // Build Options (1 Correct + 3 Smart Distractors from same theme)
  const setupQuestion = useCallback((index: number, availableTracks: Track[], availableDistractors: Track[]) => {
    const trackList = availableTracks.length > 0 ? availableTracks : tracks;
    if (index >= trackList.length || (settings.mode === 'classic' && index >= settings.trackCount)) {
      finishGameSession();
      return;
    }

    const currentTrack = trackList[index];
    if (!currentTrack) return;

    setSelectedOption(null);
    setIsAnswered(false);
    setLastPointsGained(0);
    setTimeRemainingTrack(timePerTrack);
    setCurrentQuestionPoints(100);

    if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);

    // Correct option
    const correctOpt: Option = {
      id: currentTrack.id,
      title: currentTrack.title,
      artistName: currentTrack.artist.name,
      albumCover: currentTrack.album.cover_big || currentTrack.album.cover_medium,
      isTrackTitle: true
    };
    setCorrectOption(correctOpt);

    // Pick 3 distractors strictly within this theme's tracks!
    const otherTracksInList = trackList.filter(t => t.id !== currentTrack.id);
    let pool: Track[] = otherTracksInList;
    if (pool.length < 3) {
      pool = pool.concat(availableDistractors.filter(d => d.id !== currentTrack.id));
    }

    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);

    const distractorOptions: Option[] = [];
    const usedTitles = new Set([currentTrack.title.toLowerCase()]);

    for (const item of shuffledPool) {
      if (distractorOptions.length >= 3) break;
      const tName = item.title;
      if (!usedTitles.has(tName.toLowerCase())) {
        usedTitles.add(tName.toLowerCase());
        distractorOptions.push({
          id: item.id,
          title: tName,
          artistName: item.artist.name,
          albumCover: item.album.cover_medium,
          isTrackTitle: true
        });
      }
    }

    // Combine & shuffle options
    const allOpts = [correctOpt, ...distractorOptions].sort(() => Math.random() - 0.5);
    setCurrentOptions(allOpts);

    // Play preview audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = currentTrack.preview;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1.0;
      audioRef.current.muted = soundFx.getMuted();

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlayingAudio(true);
          setIsAudioBlocked(false);
        }).catch(_ => {
          setIsAudioBlocked(true);
        });
      }
    }

    questionStartTimeRef.current = Date.now();

    // Start 10s track timer & linear score decay (-10 pts/sec after 1.5s grace period)
    if (trackTimerIntervalRef.current) clearInterval(trackTimerIntervalRef.current);
    trackTimerIntervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
      const remaining = Math.max(0, timePerTrack - elapsed);
      setTimeRemainingTrack(remaining);

      // Linear score calculation (100 max -> 0 pts at 10.0s after 1.5s grace)
      const currentScoreCalc = calculateQuestionScore(elapsed);
      setCurrentQuestionPoints(currentScoreCalc.finalPoints);

      if (remaining <= 0) {
        clearInterval(trackTimerIntervalRef.current!);
        handleTimeout(currentTrack, correctOpt);
      }
    }, 100);

  }, [tracks, timePerTrack, settings, finishGameSession]);

  // Start game IMMEDIATELY on user click
  const handleStartGameClick = () => {
    soundFx.init();
    soundFx.playCountdownGo();
    setHasStarted(true);
    setupQuestion(0, tracks, distractorPool);
  };

  const handleManualPlayAudio = () => {
    soundFx.init();
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
        setIsAudioBlocked(false);
      });
    }
  };

  const handleTimeout = (track: Track, correctOpt: Option) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setIsPlayingAudio(false);
    setLastPointsGained(0);
    if (audioRef.current) audioRef.current.pause();
    soundFx.playWrongSound();

    const result: QuestionResult = {
      track,
      correctOption: correctOpt,
      isCorrect: false,
      scoreGained: 0,
      responseTimeMs: timePerTrack * 1000
    };

    historyRef.current.push(result);

    if (settings.mode === 'survival') {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        nextQuestionTimeoutRef.current = window.setTimeout(() => finishGameSession(), 2000);
        return;
      }
    }

    nextQuestionTimeoutRef.current = window.setTimeout(() => {
      advanceToNextQuestion();
    }, 2200);
  };

  const handleSelectOption = (option: Option) => {
    if (isAnswered || !correctOption) return;

    if (trackTimerIntervalRef.current) clearInterval(trackTimerIntervalRef.current);
    setIsAnswered(true);

    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAudio(false);
    setSelectedOption(option);

    const responseTime = Date.now() - questionStartTimeRef.current;
    const isCorrect = option.id === correctOption.id;

    if (isCorrect) {
      soundFx.playCorrectSound();
      const currentTrack = tracks[currentIndex];
      const scoreCalc = calculateQuestionScore(responseTime / 1000);
      const pointsGained = scoreCalc.finalPoints;
      setLastPointsGained(pointsGained);

      // Update ref synchronously
      scoreRef.current += pointsGained;
      setScore(scoreRef.current);

      if (settings.mode === 'multiplayer') {
        setLocalPlayers(prev => prev.map((player, idx) => {
          if (idx === activePlayerIndex) {
            return { ...player, score: player.score + pointsGained };
          }
          return player;
        }));
      }

      const result: QuestionResult = {
        track: currentTrack,
        userAnswer: option,
        correctOption,
        isCorrect: true,
        scoreGained: pointsGained,
        responseTimeMs: responseTime
      };

      historyRef.current.push(result);

    } else {
      soundFx.playWrongSound();
      setLastPointsGained(0);

      const result: QuestionResult = {
        track: tracks[currentIndex],
        userAnswer: option,
        correctOption,
        isCorrect: false,
        scoreGained: 0,
        responseTimeMs: responseTime
      };

      historyRef.current.push(result);

      if (settings.mode === 'survival') {
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
          nextQuestionTimeoutRef.current = window.setTimeout(() => finishGameSession(), 2000);
          return;
        }
      }
    }

    nextQuestionTimeoutRef.current = window.setTimeout(() => {
      advanceToNextQuestion();
    }, 2200);
  };

  const advanceToNextQuestion = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= tracks.length || (settings.mode === 'classic' && nextIdx >= settings.trackCount)) {
      finishGameSession();
      return;
    }

    if (settings.mode === 'multiplayer') {
      setActivePlayerIndex((activePlayerIndex + 1) % localPlayers.length);
    }

    setCurrentIndex(nextIdx);
    setupQuestion(nextIdx, tracks, distractorPool);
  };

  const currentTrack = tracks[currentIndex];
  const isSelectedCorrect = selectedOption && correctOption && selectedOption.id === correctOption.id;

  return (
    <div className="gameboard-container">
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      {isLoading ? (
        <div className="gameboard-loading-state">
          <Loader2 className="spinner-large text-accent" />
          <h2>Chargement de la sélection Deezer...</h2>
          <p>Récupération des morceaux de <strong>{theme.name}</strong>...</p>
        </div>
      ) : loadError ? (
        <div className="gameboard-error-state">
          <h2>Oups !</h2>
          <p>{loadError}</p>
          <button className="btn-primary" onClick={handleQuit}>Retour aux thèmes</button>
        </div>
      ) : !hasStarted ? (
        <div className="countdown-overlay">
          <div className="countdown-content">
            <span className="theme-badge-sm">{theme.icon} {theme.name}</span>
            <h2 className="countdown-sub">Prêt pour le Blind Test ?</h2>
            <p className="countdown-desc">10s par morceau • 0.75s de grâce • Score dégressif jusqu'à 0 pt</p>
            <button className="btn-primary start-audio-trigger-btn" onClick={handleStartGameClick}>
              <Play className="icon-sm" /> DÉMARRER LE BLIND TEST
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header Info Bar */}
          <div className="gameboard-header">
            <button className="btn-secondary quit-btn" onClick={handleQuit}>Quitter</button>

            <div className="mode-badge-info">
              <span className="theme-pill">{theme.icon} {theme.name}</span>
              <span className="question-counter">
                {settings.mode === 'classic' && `Morceau ${currentIndex + 1} / ${settings.trackCount}`}
                {settings.mode === 'timeattack' && `Chrono : ${globalTimeRemaining}s`}
                {settings.mode === 'survival' && `Morceau ${currentIndex + 1}`}
                {settings.mode === 'multiplayer' && `Morceau ${currentIndex + 1}`}
              </span>
            </div>

            {settings.mode === 'survival' && (
              <div className="lives-display">
                {[1, 2, 3].map(heartIdx => (
                  <Heart
                    key={heartIdx}
                    className={`heart-icon ${heartIdx <= lives ? 'filled' : 'empty'}`}
                  />
                ))}
              </div>
            )}

            <div className="score-summary-box">
              <div className="score-pill">
                <Award className="icon-xs text-gold" />
                <span>{score} pts</span>
              </div>
            </div>
          </div>

          {settings.mode === 'multiplayer' && localPlayers.length > 0 && (
            <div className="multiplayer-turn-banner">
              <span>Tour de : <strong>{localPlayers[activePlayerIndex]?.name}</strong></span>
            </div>
          )}

          {/* Main Track Player Card & Visualizer */}
          <div className="track-player-card">
            {isAudioBlocked && !isAnswered && (
              <button className="unmute-overlay-btn" onClick={handleManualPlayAudio}>
                <Volume2 className="icon-sm" /> Activer l'extrait sonore
              </button>
            )}

            <div className="visualizer-wrapper">
              <AudioVisualizer audioElement={audioRef.current} isPlaying={isPlayingAudio} />
            </div>

            <div className="score-decay-bar-wrapper">
              <div className="decay-indicator">
                <span className="decay-points">+{currentQuestionPoints} pts</span>
                <span className="decay-time">{timeRemainingTrack.toFixed(1)}s</span>
              </div>
              <div className="decay-progress-bg">
                <div
                  className="decay-progress-fill"
                  style={{ width: `${(timeRemainingTrack / timePerTrack) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4 Multiple Choice Options */}
          <QuestionCard
            options={currentOptions}
            selectedOption={selectedOption}
            correctOption={correctOption}
            isAnswered={isAnswered}
            onSelectOption={handleSelectOption}
          />

          {/* CENTRAL REVEAL MODAL OVERLAY WHEN ANSWERED */}
          {isAnswered && currentTrack && (
            <div className="reveal-modal-overlay">
              <div className={`reveal-modal-card ${isSelectedCorrect ? 'success' : 'fail'}`}>
                <div className="reveal-status-header">
                  {isSelectedCorrect ? (
                    <>
                      <CheckCircle2 className="reveal-status-icon text-success" />
                      <div>
                        <h2 className="reveal-status-title text-success">Bonne réponse !</h2>
                        <span className="reveal-points-badge">+{lastPointsGained} points</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {selectedOption ? (
                        <XCircle className="reveal-status-icon text-danger" />
                      ) : (
                        <Clock className="reveal-status-icon text-orange" />
                      )}
                      <div>
                        <h2 className="reveal-status-title text-danger">
                          {selectedOption ? 'Mauvaise réponse !' : 'Temps écoulé !'}
                        </h2>
                        <span className="reveal-points-badge fail">+0 point</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="reveal-track-details">
                  <img
                    src={currentTrack.album.cover_big || currentTrack.album.cover_medium}
                    alt={currentTrack.title}
                    className="reveal-album-cover"
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
        </>
      )}
    </div>
  );
};
