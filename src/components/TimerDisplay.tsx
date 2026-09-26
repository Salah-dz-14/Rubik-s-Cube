import React, { useEffect, useRef, useState } from 'react';
import { TimerState } from '../types/cube';
import { formatTime } from '../utils/stats';
import { sound } from '../utils/audio';
import { Copy, Check, Trophy } from 'lucide-react';

interface TimerDisplayProps {
  timerState: TimerState;
  timeMs: number;
  scrambleStr: string;
  isNewPB: boolean;
  bestSingle: number | null;
  onTimerStart: () => void;
  onTimerStop: () => void;
  inspectionSeconds: number;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timerState,
  timeMs,
  scrambleStr,
  isNewPB,
  bestSingle,
  onTimerStart,
  onTimerStop,
  inspectionSeconds,
}) => {
  const [copied, setCopied] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const [internalReady, setInternalReady] = useState(false);

  const handleCopyScramble = () => {
    if (!scrambleStr) return;
    navigator.clipboard.writeText(scrambleStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // Keyboard Spacebar listener for speedstacks hold
  useEffect(() => {
    let spaceDownTime: number | null = null;
    let spaceHoldInterval: number | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();

      if (timerState === 'running') {
        onTimerStop();
        return;
      }

      if (timerState === 'idle' || timerState === 'solved') {
        if (spaceDownTime === null) {
          spaceDownTime = Date.now();
          setHoldProgress(10);

          spaceHoldInterval = window.setInterval(() => {
            if (!spaceDownTime) return;
            const elapsed = Date.now() - spaceDownTime;
            if (elapsed >= 350) {
              setInternalReady(true);
              sound.playReadyTone();
              if (spaceHoldInterval) clearInterval(spaceHoldInterval);
            } else {
              setHoldProgress(Math.min(95, Math.round((elapsed / 350) * 100)));
            }
          }, 30);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();

      if (spaceHoldInterval) clearInterval(spaceHoldInterval);
      spaceDownTime = null;
      setHoldProgress(0);

      if (internalReady) {
        setInternalReady(false);
        onTimerStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (spaceHoldInterval) clearInterval(spaceHoldInterval);
    };
  }, [timerState, internalReady, onTimerStart, onTimerStop]);

  // Touch / Pointer hold for mobile
  const handlePointerDown = (e: React.PointerEvent) => {
    // If timer is already running, tap to stop immediately!
    if (timerState === 'running') {
      onTimerStop();
      return;
    }

    if (timerState === 'idle' || timerState === 'solved') {
      const startTime = Date.now();
      setHoldProgress(15);

      holdTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= 350) {
          setInternalReady(true);
          sound.playReadyTone();
          if (navigator.vibrate) navigator.vibrate(30);
          if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        } else {
          setHoldProgress(Math.min(95, Math.round((elapsed / 350) * 100)));
        }
      }, 30);
    }
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);

    if (internalReady) {
      setInternalReady(false);
      onTimerStart();
    }
  };

  // Color styling based on state
  let timerTextColor = 'text-slate-100';
  let statusBadge = null;

  if (timerState === 'inspecting') {
    timerTextColor = inspectionSeconds <= 3 ? 'text-rose-500 animate-pulse' : 'text-amber-400';
    statusBadge = (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
        Inspection: {inspectionSeconds}s
      </span>
    );
  } else if (internalReady) {
    timerTextColor = 'text-emerald-400 scale-105';
    statusBadge = (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
        READY — Release to Start
      </span>
    );
  } else if (holdProgress > 0) {
    timerTextColor = 'text-rose-400';
    statusBadge = (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
        Hold...
      </span>
    );
  } else if (timerState === 'running') {
    timerTextColor = 'text-blue-400 font-mono';
    statusBadge = (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
        Solving... (Tap to stop)
      </span>
    );
  } else if (timerState === 'solved') {
    timerTextColor = 'text-emerald-400';
    statusBadge = isNewPB ? (
      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm animate-bounce">
        <Trophy className="w-3.5 h-3.5 text-amber-400" /> NEW PERSONAL BEST!
      </span>
    ) : (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        Solved!
      </span>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center pt-1 pb-1 select-none z-10 px-4">
      {/* Scramble Notation pill */}
      {scrambleStr && (
        <div className="w-full max-w-md flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-sm mb-1.5 transition">
          <p className="font-mono text-xs sm:text-sm text-slate-300 tracking-wide truncate select-all text-center flex-1">
            {scrambleStr}
          </p>
          <button
            onClick={handleCopyScramble}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition shrink-0"
            title="Copy scramble notation"
            aria-label="Copy scramble"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Main Touch-Reactive Digital Timer Box */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`w-full max-w-sm flex flex-col items-center justify-center py-2 px-4 rounded-2xl cursor-pointer transition-all duration-150 ${
          internalReady
            ? 'bg-emerald-950/40 border border-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : holdProgress > 0
            ? 'bg-rose-950/30 border border-rose-500/40'
            : 'bg-transparent hover:bg-slate-900/30'
        }`}
      >
        <div className="flex items-center gap-2 mb-1 min-h-[22px]">
          {statusBadge || (
            <span className="text-[11px] font-medium text-slate-400">
              Hold or swipe to start
            </span>
          )}
        </div>

        {/* Digital Time */}
        <div
          className={`font-mono text-4xl sm:text-5xl font-extrabold tracking-tight transition-transform duration-100 ${timerTextColor}`}
        >
          {timerState === 'inspecting' ? `${inspectionSeconds}s` : formatTime(timeMs)}
        </div>

        {/* Best single indicator */}
        {bestSingle !== null && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>PB:</span>
            <span className="font-mono font-semibold text-amber-400">{formatTime(bestSingle)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
