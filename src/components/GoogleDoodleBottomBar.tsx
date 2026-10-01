import React from 'react';
import { Star, RotateCcw, HelpCircle } from 'lucide-react';
import { SolvePenalty, TimerState } from '../types/cube';

interface GoogleDoodleBottomBarProps {
  moveCount: number;
  timerState: TimerState;
  penalty: SolvePenalty;
  isScrambling: boolean;
  isSolving: boolean;
  onAutoSolve: () => void;
  onSetPenalty: (penalty: SolvePenalty) => void;
  onAnimatedScramble: () => void;
  onOpenGuide: () => void;
  onOpenStats: () => void;
}

export const GoogleDoodleBottomBar: React.FC<GoogleDoodleBottomBarProps> = ({
  moveCount,
  timerState,
  penalty,
  isScrambling,
  isSolving,
  onAutoSolve,
  onAnimatedScramble,
  onOpenGuide,
  onOpenStats,
  onSetPenalty,
}) => {
  const isBusy = isScrambling || isSolving;

  return (
    <div className="w-full flex flex-col items-center pb-6 sm:pb-8 px-4 z-20 pointer-events-auto select-none">
      {/* Main Google Doodle Controls Row: Move Count + Timer on Left, Action Pill on Right */}
      <div className="w-full max-w-lg flex items-center justify-between gap-4 px-2 sm:px-4">
        {/* Left: Big Google Doodle Move Counter */}
        <div className="flex items-baseline">
          {/* Large Move Number */}
          <div className="flex items-baseline gap-1">
            <span className="font-sans text-4xl sm:text-5xl font-light tracking-tight text-slate-800 dark:text-slate-100 transition">
              {moveCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {moveCount === 1 ? 'حركة' : 'حركات'}
            </span>
          </div>

        </div>

        {/* Right: Google Doodle Action Pill */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/70 shadow-sm backdrop-blur-sm">
          {/* ⭐ Star Button: Solves cube in fewest possible moves */}
          <button
            onClick={onAutoSolve}
            disabled={isBusy}
            className={`p-2 sm:p-2.5 rounded-xl transition active:scale-90 cursor-pointer disabled:opacity-50 ${
              isSolving
                ? 'bg-amber-400 text-amber-950 shadow-md animate-pulse'
                : 'bg-slate-300/80 hover:bg-amber-100 dark:hover:bg-amber-950/40 dark:bg-slate-700/80 text-amber-500 hover:text-amber-600 dark:text-amber-400'
            }`}
            title="حل المكعب بأقل حركات ممكنة (⭐ Optimal Solver)"
            aria-label="Solve cube in minimal moves"
          >
            <Star className={`w-4 h-4 sm:w-5 sm:h-5 fill-current ${isSolving ? 'animate-spin' : ''}`} />
          </button>

          {/* 🔄 Return / Animated Scramble Button: Scrambles the cube with smooth animation */}
          <button
            onClick={onAnimatedScramble}
            disabled={isBusy}
            className={`p-2 sm:p-2.5 rounded-xl transition active:scale-90 cursor-pointer disabled:opacity-50 ${
              isScrambling
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-300/80 hover:bg-slate-300 dark:bg-slate-700/80 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
            }`}
            title="خلط المكعب بأنيميشن (🔄 Animated Scramble)"
            aria-label="Scramble cube with animation"
          >
            <RotateCcw className={`w-4 h-4 sm:w-5 sm:h-5 ${isScrambling ? 'animate-spin' : ''}`} />
          </button>

          {/* ❓ Help '?' (Guide) */}
          <button
            onClick={onOpenGuide}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-300/80 hover:bg-slate-300 dark:bg-slate-700/80 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition active:scale-90 cursor-pointer"
            title="كيفية اللعب والاختصارات (Help & Guide)"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {timerState === 'solved' && (
        <div className="mt-2 flex items-center gap-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 p-1" role="group" aria-label="Solve penalty">
          {(['none', 'plus2', 'dnf'] as SolvePenalty[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSetPenalty(option)}
              aria-pressed={penalty === option}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                penalty === option
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {option === 'none' ? 'OK' : option === 'plus2' ? '+2' : 'DNF'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

