import React from 'react';
import { X, BookOpen, Sparkles } from 'lucide-react';

interface AlgorithmHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlgorithmHelperModal: React.FC<AlgorithmHelperModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Cube Guide & Notation</h2>
              <p className="text-xs text-slate-400">Standard moves & speedcubing fundamentals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
          {/* Touch Gesture Tips */}
          <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-900/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-300 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Google Doodle Controls</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 leading-relaxed">
              <li><strong>Swipe any sticker:</strong> Turns that slice in the direction of your swipe.</li>
              <li><strong>Drag on the background:</strong> Smoothly spins the 3D cube in any direction (360°).</li>
              <li><strong>Spacebar or timer:</strong> Start inspection, start the solve, or stop an attempt as DNF.</li>
              <li><strong>Side Chevrons (&lt; and &gt;):</strong> Rotates the cube view 90° left or right.</li>
              <li><strong>Purple Undo button (top-left):</strong> Reverses your previous move.</li>
              <li><strong>Magic Wand button (bottom):</strong> Scrambles the cube.</li>
            </ul>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1.5">
            <span className="font-bold text-white text-sm block">Keyboard Shortcuts</span>
            <p className="text-slate-400 text-xs">
              Press face keys <span className="font-mono font-bold text-blue-400">F, B, U, D, L, R</span> to turn faces clockwise.
              Hold <span className="font-mono font-bold text-slate-200">Shift</span> for counter-clockwise.
              Use <span className="font-mono font-bold text-amber-400">Arrow Keys</span> to rotate the whole cube.
            </p>
          </div>

          {/* Standard Face Notation */}
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Standard WCA Move Notation</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="font-mono font-bold text-blue-400 text-sm">U / U'</span>
                <p className="text-slate-400 mt-0.5"><strong>Up</strong> (Top face, Clockwise / Counter-CW)</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="font-mono font-bold text-amber-400 text-sm">D / D'</span>
                <p className="text-slate-400 mt-0.5"><strong>Down</strong> (Bottom face)</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="font-mono font-bold text-rose-400 text-sm">R / R'</span>
                <p className="text-slate-400 mt-0.5"><strong>Right</strong> (Right face)</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="font-mono font-bold text-orange-400 text-sm">L / L'</span>
                <p className="text-slate-400 mt-0.5"><strong>Left</strong> (Left face)</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="font-mono font-bold text-emerald-400 text-sm">F / F'</span>
                <p className="text-slate-400 mt-0.5"><strong>Front</strong> (Front face)</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="font-mono font-bold text-cyan-400 text-sm">B / B'</span>
                <p className="text-slate-400 mt-0.5"><strong>Back</strong> (Rear face)</p>
              </div>
            </div>
            <p className="text-slate-400 mt-2 text-[11px]">
              A "2" after any letter (e.g. <strong>R2</strong>) means a 180° double turn.
            </p>
          </div>

          {/* Essential Cubing Algorithm */}
          <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-900/60 space-y-1.5">
            <span className="font-bold text-purple-300 text-sm block">"Sexy Move" (Corner Trigger)</span>
            <p className="font-mono text-purple-200 text-sm font-semibold tracking-wider">
              R U R' U'
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Repeating this sequence 6 times will return the cube back to its starting state! Practice this sequence to build finger dexterity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
