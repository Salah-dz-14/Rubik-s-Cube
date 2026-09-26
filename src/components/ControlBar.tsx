import React, { useState } from 'react';
import { Shuffle, RotateCcw, Undo2, Redo2, ChevronUp, ChevronDown } from 'lucide-react';
import { FaceName, Move } from '../types/cube';

interface ControlBarProps {
  onScramble: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExecuteMove: (move: Move) => void;
  isScrambling?: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onScramble,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExecuteMove,
  isScrambling = false,
}) => {
  const [showFaceButtons, setShowFaceButtons] = useState(false);

  const faceMoves: { label: string; face: FaceName; dir: 1 | -1 }[] = [
    { label: 'U', face: 'U', dir: 1 },
    { label: "U'", face: 'U', dir: -1 },
    { label: 'D', face: 'D', dir: 1 },
    { label: "D'", face: 'D', dir: -1 },
    { label: 'L', face: 'L', dir: 1 },
    { label: "L'", face: 'L', dir: -1 },
    { label: 'R', face: 'R', dir: 1 },
    { label: "R'", face: 'R', dir: -1 },
    { label: 'F', face: 'F', dir: 1 },
    { label: "F'", face: 'F', dir: -1 },
    { label: 'B', face: 'B', dir: 1 },
    { label: "B'", face: 'B', dir: -1 },
  ];

  const handleFaceMoveClick = (face: FaceName, dir: 1 | -1) => {
    onExecuteMove({
      face,
      direction: dir,
      notation: dir === -1 ? `${face}'` : face,
    });
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 pb-3 px-4 z-20 pointer-events-auto">
      {/* Quick Face Moves Drawer (Expandable) */}
      {showFaceButtons && (
        <div className="w-full max-w-md grid grid-cols-6 sm:grid-cols-12 gap-1.5 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          {faceMoves.map((m) => (
            <button
              key={m.label}
              onClick={() => handleFaceMoveClick(m.face, m.dir)}
              className="py-1.5 px-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 border border-slate-700/60 shadow-sm transition active:scale-90 text-center"
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="w-full max-w-md flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-lg">
        {/* Scramble Button */}
        <button
          onClick={onScramble}
          disabled={isScrambling}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-50"
          title="Scramble puzzle"
        >
          <Shuffle className={`w-4 h-4 ${isScrambling ? 'animate-spin' : ''}`} />
          <span>{isScrambling ? 'Scrambling...' : 'Scramble'}</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700/60 transition active:scale-95"
          title="Reset Cube"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 border border-slate-700/60 transition active:scale-90"
          title="Undo move"
          aria-label="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo Button */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 border border-slate-700/60 transition active:scale-90"
          title="Redo move"
          aria-label="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Notation / Face Keys Toggle Button */}
        <button
          onClick={() => setShowFaceButtons(!showFaceButtons)}
          className={`flex items-center gap-1 p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-medium border transition active:scale-95 ${
            showFaceButtons
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700/60 text-slate-300'
          }`}
          title="Toggle Face Notation Tray"
          aria-label="Toggle Face Tray"
        >
          <span className="font-mono font-bold text-[11px] hidden sm:inline">Moves</span>
          {showFaceButtons ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
