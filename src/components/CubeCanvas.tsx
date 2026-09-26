import React, { useEffect, useRef } from 'react';
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
    </div>
  );
};
