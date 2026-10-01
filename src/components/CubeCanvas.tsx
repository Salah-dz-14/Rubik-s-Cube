import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RubikEngine } from '../cube/RubikEngine';
import { ColorTheme, Move } from '../types/cube';

interface CubeCanvasProps {
  engineRef: React.MutableRefObject<RubikEngine | null>;
  theme: ColorTheme;
  showFaceLabels: boolean;
  moveSpeed: number;
  sensitivity: number;
  onMoveFinished: (move: Move, isSolved: boolean) => void;
  onFirstMoveStart: () => void;
  disabled?: boolean;
}

export const CubeCanvas: React.FC<CubeCanvasProps> = ({
  engineRef,
  theme,
  showFaceLabels,
  moveSpeed,
  sensitivity,
  onMoveFinished,
  onFirstMoveStart,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new RubikEngine(containerRef.current);
    engine.setTheme(theme, showFaceLabels);
    engine.setMoveSpeed(moveSpeed);
    engine.sensitivityMultiplier = sensitivity;
    engine.onMoveFinished = onMoveFinished;
    engine.onFirstMoveStart = onFirstMoveStart;

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update theme when changed
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTheme(theme, showFaceLabels);
    }
  }, [theme, showFaceLabels]);

  // Update speed when changed
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMoveSpeed(moveSpeed);
    }
  }, [moveSpeed]);

  return (
    <div className="relative w-full h-full flex-1 flex items-center justify-center overflow-hidden touch-none select-none">
      {/* Pristine 3D WebGL Viewport */}
      <div
        ref={containerRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing ${
          disabled ? 'pointer-events-none opacity-90' : ''
        }`}
      />

      {/* Floating Left View Rotate Chevron (<) */}
      <button
        onClick={() => engineRef.current?.rotateView90(1)}
        disabled={disabled}
        className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200/50 hover:bg-slate-300/70 dark:bg-slate-800/40 dark:hover:bg-slate-700/60 border border-slate-300/40 dark:border-slate-700/40 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white flex items-center justify-center backdrop-blur-sm shadow-sm transition active:scale-90 cursor-pointer z-10 disabled:opacity-30 disabled:pointer-events-none"
        title="تدوير زاوية الرؤية يساراً (Rotate View Left)"
        aria-label="Rotate view left"
      >
        <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Floating Right View Rotate Chevron (>) */}
      <button
        onClick={() => engineRef.current?.rotateView90(-1)}
        disabled={disabled}
        className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200/50 hover:bg-slate-300/70 dark:bg-slate-800/40 dark:hover:bg-slate-700/60 border border-slate-300/40 dark:border-slate-700/40 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white flex items-center justify-center backdrop-blur-sm shadow-sm transition active:scale-90 cursor-pointer z-10 disabled:opacity-30 disabled:pointer-events-none"
        title="تدوير زاوية الرؤية يميناً (Rotate View Right)"
        aria-label="Rotate view right"
      >
        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};

