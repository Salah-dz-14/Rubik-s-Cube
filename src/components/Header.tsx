import React from 'react';
import { Undo2, Sun, Moon, Volume2, VolumeX, Trophy, Settings } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { formatTime } from '../utils/stats';

interface HeaderProps {
  canUndo: boolean;
  onUndo: () => void;
  darkMode: boolean;
  soundEnabled: boolean;
  bestSingle: number | null;
  onToggleDarkMode: () => void;
  onToggleSound: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  canUndo,
  onUndo,
  darkMode,
  soundEnabled,
  bestSingle,
  onToggleDarkMode,
  onToggleSound,
  onOpenStats,
  onOpenSettings,
}) => {
  return (
    <header className="w-full px-4 sm:px-6 pt-3 pb-2 flex flex-col z-30 select-none">
      <div className="w-full flex items-center justify-between">
      {/* Top Left: Google Doodle Emblem & Purple Undo Button */}
      <div className="flex items-center gap-3">
        {/* Rubik's Cube Emblem (matching exact app icon) */}
        <div
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition"
          title="Rubik's SpeedCube 3D"
        >
          <div className="grid grid-cols-3 gap-0 rounded-[3px] overflow-hidden shadow-xs">
            {/* Row 0: Orange, White, Yellow */}
            <span className="w-2.5 h-2.5 bg-[#FF5700]" />
            <span className="w-2.5 h-2.5 bg-[#FFFFFF] flex items-center justify-center text-[5px] font-black text-black leading-none -rotate-12 select-none">
              R
            </span>
            <span className="w-2.5 h-2.5 bg-[#FFDE00]" />
            {/* Row 1: Yellow, Red, Blue */}
            <span className="w-2.5 h-2.5 bg-[#FFDE00]" />
            <span className="w-2.5 h-2.5 bg-[#EE0000]" />
            <span className="w-2.5 h-2.5 bg-[#0015D5]" />
            {/* Row 2: Green, Blue, Green */}
            <span className="w-2.5 h-2.5 bg-[#009E0B]" />
            <span className="w-2.5 h-2.5 bg-[#0015D5]" />
            <span className="w-2.5 h-2.5 bg-[#009E0B]" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100 hidden min-[360px]:inline">
            Rubik's
          </span>
        </div>

        {/* Iconic Google Doodle Purple Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 disabled:hover:bg-[#8b5cf6] text-white flex items-center justify-center shadow-sm shadow-purple-500/30 transition-transform active:scale-90 cursor-pointer disabled:cursor-not-allowed"
          title="Undo Move"
          aria-label="Undo move"
        >
          <Undo2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
        </button>

      </div>

      {/* Top Right: Dark/Light Mode, Sound, Settings, PWA */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* PWA Install */}
        <PWAInstallButton />

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition active:scale-90 cursor-pointer"
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          aria-label="Toggle sound"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-500" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Dark/Light mode toggle (Matching Google Doodle screenshot top-right icon) */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition active:scale-90 cursor-pointer"
          title={darkMode ? 'Switch to White Background' : 'Switch to Black Background'}
          aria-label="Toggle background color (White / Black)"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* High scores / Stats */}
        <button
          onClick={onOpenStats}
          className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition active:scale-90 cursor-pointer"
          title="High Scores & Stats"
          aria-label="High Scores"
        >
          <Trophy className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center">
          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition active:scale-90 cursor-pointer"
            title="Settings & Theme"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Personal best */}
          {bestSingle !== null && (
            <button
              onClick={onOpenStats}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-semibold border border-amber-500/20 transition active:scale-95"
              title="View High Scores"
              aria-label={`Personal best ${formatTime(bestSingle)}; view high scores`}
            >
              <Trophy className="w-3 h-3 text-amber-500" />
              <span className="font-mono text-[10px]">{formatTime(bestSingle)}</span>
            </button>
          )}
        </div>
      </div>
      </div>

    </header>
  );
};
