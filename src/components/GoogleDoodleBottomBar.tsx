import React, { useState } from 'react';
import { Sparkles, RotateCcw, HelpCircle, Trophy, Copy, Check } from 'lucide-react';
import { TimerState } from '../types/cube';
import { formatTime } from '../utils/stats';

interface GoogleDoodleBottomBarProps {
  moveCount: number;
  timeMs: number;
  timerState: TimerState;
  scrambleStr: string;
  isScrambling: boolean;
  onScramble: () => void;
  onReset: () => void;
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
  onScramble,
  onReset,
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
    if (timerState === 'running') {
      onTimerStop();
    } else if (timerState === 'idle' || timerState === 'solved') {
      onTimerStart();
    }
  };

  return (
    <div className="w-full flex flex-col items-center pb-6 sm:pb-8 px-4 z-20 pointer-events-auto select-none">
      {/* Solved celebration banner */}
      {timerState === 'solved' && (
        <div className="mb-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-bold animate-bounce flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-emerald-400" />
          <span>Solved in {moveCount} moves! ({formatTime(timeMs)})</span>
        </div>
      )}

      {/* Main Google Doodle Controls Row: Move Count + Timer on Left, Action Pill on Right */}
      <div className="w-full max-w-lg flex items-center justify-between gap-4 px-2 sm:px-4">
        {/* Left: Big Google Doodle Move Counter & Time */}
        <div
          onClick={handleTimerToggle}
          className="flex items-baseline gap-3 cursor-pointer group"
          title="Click to start/stop timer"
        >
          {/* Large Move Number (matching the screenshot's '0') */}
          <div className="flex items-baseline gap-1">
            <span className="font-sans text-4xl sm:text-5xl font-light tracking-tight text-slate-800 dark:text-slate-100 group-hover:opacity-80 transition">
              {moveCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {moveCount === 1 ? 'move' : 'moves'}
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

        {/* Right: Google Doodle 3-Button Action Pill */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/70 shadow-sm backdrop-blur-sm">
          {/* Magic Wand (Scramble) */}
          <button
            onClick={onScramble}
            disabled={isScrambling}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-300/80 hover:bg-slate-300 dark:bg-slate-700/80 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition active:scale-90 cursor-pointer disabled:opacity-50"
            title="Scramble Cube (Magic Wand)"
            aria-label="Scramble puzzle"
          >
            <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${isScrambling ? 'animate-spin' : ''}`} />
          </button>

          {/* Circular Reset (Reset) */}
          <button
            onClick={onReset}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-300/80 hover:bg-slate-300 dark:bg-slate-700/80 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition active:scale-90 cursor-pointer"
            title="Reset to Solved"
            aria-label="Reset puzzle"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Help '?' (Guide) */}
          <button
            onClick={onOpenGuide}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-300/80 hover:bg-slate-300 dark:bg-slate-700/80 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition active:scale-90 cursor-pointer"
            title="How to Play & Shortcuts"
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
          title="Click to copy scramble notation"
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
