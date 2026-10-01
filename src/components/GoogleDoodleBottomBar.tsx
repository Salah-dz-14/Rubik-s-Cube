import React, { useState } from 'react';
import { Star, RotateCcw, HelpCircle, Trophy, Copy, Check, Loader2 } from 'lucide-react';
import { TimerState } from '../types/cube';
import { formatTime } from '../utils/stats';

interface GoogleDoodleBottomBarProps {
  moveCount: number;
  timeMs: number;
  timerState: TimerState;
  scrambleStr: string;
  isScrambling: boolean;
  isSolving: boolean;
  solutionMovesRemaining?: number;
  onAutoSolve: () => void;
  onAnimatedScramble: () => void;
  onOpenGuide: () => void;
  onOpenStats: () => void;
  onTimerStart: () => void;
  onTimerStop: () => void;
}

export const GoogleDoodleBottomBar: React.FC<GoogleDoodleBottomBarProps> = ({
  moveCount,
  timeMs,
  timerState,
  scrambleStr,
  isScrambling,
  isSolving,
  solutionMovesRemaining,
  onAutoSolve,
  onAnimatedScramble,
  onOpenGuide,
  onOpenStats,
  onTimerStart,
  onTimerStop,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyScramble = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scrambleStr) return;
    navigator.clipboard.writeText(scrambleStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleTimerToggle = () => {
    if (isScrambling || isSolving) return;
    if (timerState === 'running') {
      onTimerStop();
    } else if (timerState === 'idle' || timerState === 'solved') {
      onTimerStart();
    }
  };

  const isBusy = isScrambling || isSolving;

  return (
    <div className="w-full flex flex-col items-center pb-6 sm:pb-8 px-4 z-20 pointer-events-auto select-none">
      {/* Solved celebration banner */}
      {timerState === 'solved' && !isBusy && (
        <div className="mb-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-bold animate-bounce flex items-center gap-1.5 shadow-sm">
          <Trophy className="w-4 h-4 text-emerald-500" />
          <span>تم الحل في {moveCount} حركة! ({formatTime(timeMs)})</span>
        </div>
      )}

      {/* Solving / Scrambling active status indicator */}
      {isSolving && (
        <div className="mb-2 px-4 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-2 animate-pulse shadow-sm">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
          <span>جاري الحل بأقل حركات ممكنة {solutionMovesRemaining ? `(${solutionMovesRemaining} متبقية)` : ''}...</span>
        </div>
      )}

      {isScrambling && (
        <div className="mb-2 px-4 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-2 animate-pulse shadow-sm">
          <RotateCcw className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span>جاري خلط المكعب بأنيميشن...</span>
        </div>
      )}

      {/* Ready to solve tip */}
      {!isBusy && timerState === 'idle' && moveCount === 0 && scrambleStr && (
        <div className="mb-2 px-3.5 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/40 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 shadow-xs">
          <span>✨ المكعب جاهز! حرك أي وجه لبدء الحل والمؤقت</span>
        </div>
      )}

      {/* Initial solved waiting state */}
      {!isBusy && timerState === 'idle' && moveCount === 0 && !scrambleStr && (
        <div className="mb-2 px-3.5 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-xs font-medium flex items-center gap-1.5 animate-pulse shadow-xs">
          <span>المكعب محلول... سيبدأ الخلط التلقائي بعد لحظات</span>
        </div>
      )}

      {/* Main Google Doodle Controls Row: Move Count + Timer on Left, Action Pill on Right */}
      <div className="w-full max-w-lg flex items-center justify-between gap-4 px-2 sm:px-4">
        {/* Left: Big Google Doodle Move Counter & Time */}
        <div
          onClick={handleTimerToggle}
          className="flex items-baseline gap-3 cursor-pointer group"
          title="انقر لبدء/إيقاف المؤقت"
        >
          {/* Large Move Number */}
          <div className="flex items-baseline gap-1">
            <span className="font-sans text-4xl sm:text-5xl font-light tracking-tight text-slate-800 dark:text-slate-100 group-hover:opacity-80 transition">
              {moveCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {moveCount === 1 ? 'حركة' : 'حركات'}
            </span>
          </div>

          {/* Running or Elapsed Time */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/50">
            <span
              className={`font-mono text-sm sm:text-base font-semibold ${
                timerState === 'running'
                  ? 'text-blue-600 dark:text-blue-400 animate-pulse'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {formatTime(timeMs)}
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

      {/* Subtle Scramble Notation pill */}
      {scrambleStr && (
        <div
          onClick={handleCopyScramble}
          className="mt-3 px-3 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/40 border border-slate-300/40 dark:border-slate-700/40 text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1.5 cursor-pointer transition max-w-sm truncate"
          title="انقر لنسخ صيغة الخلط (Scramble Notation)"
        >
          <span className="truncate">{scrambleStr}</span>
          {copied ? (
            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
          ) : (
            <Copy className="w-3 h-3 shrink-0 opacity-60" />
          )}
        </div>
      )}
    </div>
  );
};

