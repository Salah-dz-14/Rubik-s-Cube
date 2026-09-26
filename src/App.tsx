import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RubikEngine } from './cube/RubikEngine';
import { CubeCanvas } from './components/CubeCanvas';
import { GoogleDoodleBottomBar } from './components/GoogleDoodleBottomBar';
import { Header } from './components/Header';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { AlgorithmHelperModal } from './components/AlgorithmHelperModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { FaceName, Move, SolveRecord, TimerState, UserPreferences } from './types/cube';
import {
  THEMES,
  loadSavedSolves,
  saveSolves,
  loadSavedPreferences,
  savePreferences,
  computeCubeStats,
} from './utils/stats';
import { generateScramble, parseAlgorithm, getInverseMove } from './utils/scrambler';
import { sound } from './utils/audio';

export default function App() {
  const engineRef = useRef<RubikEngine | null>(null);

  // User Preferences
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadSavedPreferences());
  const theme = THEMES[preferences.theme] || THEMES.classic;

  // Solves History & High Score Stats
  const [solves, setSolves] = useState<SolveRecord[]>(() => loadSavedSolves());
  const stats = computeCubeStats(solves);

  // Scramble State
  const [scrambleStr, setScrambleStr] = useState<string>('');
  const [isScrambling, setIsScrambling] = useState<boolean>(false);

  // Move History & Undo/Redo
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [undoStack, setUndoStack] = useState<Move[]>([]);

  // Timer & Moves State
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timeMs, setTimeMs] = useState<number>(0);
  const [moveCount, setMoveCount] = useState<number>(0);

  const timerStartTimestampRef = useRef<number | null>(null);
  const timerRafRef = useRef<number | null>(null);
  const inspectionIntervalRef = useRef<number | null>(null);

  // Modals
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Initialize sound settings
  useEffect(() => {
    sound.enabled = preferences.soundEnabled;
  }, [preferences.soundEnabled]);

  // Save preferences when changed
  const handleUpdatePreferences = (nextPrefs: UserPreferences) => {
    setPreferences(nextPrefs);
    savePreferences(nextPrefs);
    sound.enabled = nextPrefs.soundEnabled;
  };

  // Generate initial scramble on first load
  useEffect(() => {
    const initialScramble = generateScramble(22);
    setScrambleStr(initialScramble);
  }, []);

  // --- Scramble Puzzle (Magic Wand 🪄) ---
  const handleScramble = useCallback(() => {
    if (!engineRef.current || isScrambling) return;

    // Reset timer and move count
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    setTimerState('idle');
    setTimeMs(0);
    setMoveCount(0);
    setMoveHistory([]);
    setUndoStack([]);

    const newScramble = generateScramble(22);
    setScrambleStr(newScramble);
    setIsScrambling(true);

    // Reset cube to solved first
    engineRef.current.resetToSolved();

    // Fast-apply scramble moves with slight stagger for satisfying speedcube look
    const moves = parseAlgorithm(newScramble);
    let i = 0;
    const interval = setInterval(() => {
      if (!engineRef.current || i >= moves.length) {
        clearInterval(interval);
        setIsScrambling(false);
        sound.playClick(1.3);
        return;
      }
      engineRef.current.executeMove(moves[i], true); // instant move for fast scramble
      sound.playClick(0.9 + (i % 4) * 0.1);
      i++;
    }, 28);
  }, [isScrambling]);

  // --- Reset Cube (Circular Arrow 🔄) ---
  const handleReset = useCallback(() => {
    if (!engineRef.current) return;
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);

    engineRef.current.resetToSolved();
    setTimerState('idle');
    setTimeMs(0);
    setMoveCount(0);
    setMoveHistory([]);
    setUndoStack([]);
  }, []);

  // --- Timer Controls ---
  const startSolvingTimer = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }

    setTimerState('running');
    timerStartTimestampRef.current = performance.now();

    const tick = () => {
      if (timerStartTimestampRef.current !== null) {
        const elapsed = Math.round(performance.now() - timerStartTimestampRef.current);
        setTimeMs(elapsed);
        timerRafRef.current = requestAnimationFrame(tick);
      }
    };
    timerRafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleTimerStart = useCallback(() => {
    startSolvingTimer();
  }, [startSolvingTimer]);

  const handleTimerStop = useCallback(() => {
    if (timerRafRef.current) {
      cancelAnimationFrame(timerRafRef.current);
      timerRafRef.current = null;
    }
    timerStartTimestampRef.current = null;
    setTimerState('idle');
  }, []);

  // --- Move Finished Callback & Solve Detection ---
  const handleMoveFinished = useCallback(
    (move: Move, isSolved: boolean) => {
      // Audio click
      sound.playClick();
      if (preferences.hapticEnabled && navigator.vibrate) {
        navigator.vibrate(15);
      }

      setMoveHistory((prev) => [...prev, move]);
      setUndoStack([]); // Clear redo stack on new user move

      if (!move.isWholeCube) {
        setMoveCount((prev) => prev + 1);
      }

      // Check if puzzle is solved and timer was running
      if (isSolved) {
        if (timerState === 'running') {
          // Record final time
          if (timerRafRef.current) {
            cancelAnimationFrame(timerRafRef.current);
            timerRafRef.current = null;
          }
          const finalTimeMs = timerStartTimestampRef.current
            ? Math.round(performance.now() - timerStartTimestampRef.current)
            : timeMs;

          timerStartTimestampRef.current = null;
          setTimeMs(finalTimeMs);
          setTimerState('solved');

          // Audio and Confetti
          sound.playVictoryFanfare();
          try {
            confetti({
              particleCount: 90,
              spread: 75,
              origin: { y: 0.55 },
              colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#ffffff'],
            });
          } catch {
            // Ignore confetti errors
          }

          // Calculate TPS
          const seconds = finalTimeMs / 1000;
          const currentMoves = moveCount + (move.isWholeCube ? 0 : 1);
          const tps = seconds > 0 ? Number((currentMoves / seconds).toFixed(2)) : 0;

          // Save solve record
          const newRecord: SolveRecord = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timeMs: finalTimeMs,
            scramble: scrambleStr,
            date: Date.now(),
            movesCount: currentMoves,
            tps,
          };

          const nextSolves = [newRecord, ...solves];
          setSolves(nextSolves);
          saveSolves(nextSolves);
        }
      }
    },
    [timerState, timeMs, moveCount, scrambleStr, solves, preferences.hapticEnabled]
  );

  // Triggered when first move starts
  const handleFirstMoveStart = useCallback(() => {
    if (timerState === 'idle') {
      startSolvingTimer();
    }
  }, [timerState, startSolvingTimer]);

  // Undo move (Top-left Purple Button)
  const handleUndo = useCallback(() => {
    if (!engineRef.current || moveHistory.length === 0) return;
    const lastMove = moveHistory[moveHistory.length - 1];
    const invMove = getInverseMove(lastMove);

    setMoveHistory((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, lastMove]);
    if (!lastMove.isWholeCube) {
      setMoveCount((prev) => Math.max(0, prev - 1));
    }
    engineRef.current.executeMove(invMove);
    sound.playClick(0.85);
  }, [moveHistory]);

  // Keyboard Shortcuts (Like Google Doodle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Side arrow keys: rotate view
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (engineRef.current) engineRef.current.rotateView90(1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (engineRef.current) engineRef.current.rotateView90(-1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (engineRef.current) engineRef.current.tiltView90(-1);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (engineRef.current) engineRef.current.tiltView90(1);
        return;
      }

      // Face turn keys: F, B, U, D, L, R
      const keyUpper = e.key.toUpperCase();
      const validFaces: FaceName[] = ['F', 'B', 'U', 'D', 'L', 'R'];
      if (validFaces.includes(keyUpper as FaceName)) {
        e.preventDefault();
        const dir: 1 | -1 = e.shiftKey ? -1 : 1;
        const notation = dir === -1 ? `${keyUpper}'` : keyUpper;
        if (engineRef.current) {
          engineRef.current.executeMove({
            face: keyUpper as FaceName,
            direction: dir,
            notation,
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  // Delete single solve
  const handleDeleteSolve = (id: string) => {
    const updated = solves.filter((s) => s.id !== id);
    setSolves(updated);
    saveSolves(updated);
  };

  // Clear all solves
  const handleClearAllSolves = () => {
    setSolves([]);
    saveSolves([]);
  };

  const isDark = preferences.darkMode;

  return (
    <div
      className={`relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-[#000000] text-slate-100' : 'bg-[#ffffff] text-slate-900'
      }`}
    >
      {/* Google Doodle Header (Emblem + Purple Undo Button on Left, Settings/Dark Mode on Right) */}
      <Header
        canUndo={moveHistory.length > 0}
        onUndo={handleUndo}
        darkMode={preferences.darkMode}
        soundEnabled={preferences.soundEnabled}
        bestSingle={stats.bestSingle}
        onToggleDarkMode={() => handleUpdatePreferences({ ...preferences, darkMode: !preferences.darkMode })}
        onToggleSound={() => handleUpdatePreferences({ ...preferences, soundEnabled: !preferences.soundEnabled })}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 3D WebGL Canvas with Left (<) & Right (>) Rotation Chevrons */}
      <CubeCanvas
        engineRef={engineRef}
        theme={theme}
        showFaceLabels={preferences.showFaceLabels}
        moveSpeed={preferences.moveSpeed}
        sensitivity={preferences.gestureSensitivity}
        onMoveFinished={handleMoveFinished}
        onFirstMoveStart={handleFirstMoveStart}
        disabled={isScrambling}
      />

      {/* Google Doodle Bottom Bar: Move Counter + Timer + 3-Button Action Pill */}
      <GoogleDoodleBottomBar
        moveCount={moveCount}
        timeMs={timeMs}
        timerState={timerState}
        scrambleStr={scrambleStr}
        isScrambling={isScrambling}
        onScramble={handleScramble}
        onReset={handleReset}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onTimerStart={handleTimerStart}
        onTimerStop={handleTimerStop}
      />

      {/* Offline Status Badge */}
      <OfflineIndicator />

      {/* Modals */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        solves={solves}
        onDeleteSolve={handleDeleteSolve}
        onClearAllSolves={handleClearAllSolves}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onChangePreferences={handleUpdatePreferences}
      />

      <AlgorithmHelperModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
