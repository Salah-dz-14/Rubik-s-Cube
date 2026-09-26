import React, { useState } from 'react';
import { CubeStats, SolveRecord } from '../types/cube';
import { formatTime } from '../utils/stats';
import { X, Trophy, Flame, BarChart3, Trash2, Copy, Check, Download, AlertTriangle } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CubeStats;
  solves: SolveRecord[];
  onDeleteSolve: (id: string) => void;
  onClearAllSolves: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  solves,
  onDeleteSolve,
  onClearAllSolves,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleCopyScramble = (id: string, scramble: string) => {
    navigator.clipboard.writeText(scramble);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportData = () => {
    const jsonStr = JSON.stringify(solves, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speedcube-solves-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Statistics & High Scores</h2>
              <p className="text-xs text-slate-400">Track personal records & solve metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* PB Single */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">PB Single</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
                {formatTime(stats.bestSingle)}
              </span>
            </div>

            {/* Best Ao5 */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Best Ao5</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-blue-300 mt-0.5">
                {formatTime(stats.bestAo5)}
              </span>
            </div>

            {/* Best Ao12 */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Best Ao12</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">
                {formatTime(stats.bestAo12)}
              </span>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs">
            <div className="flex flex-col items-center">
              <span className="text-slate-400">Total Solves</span>
              <span className="font-semibold text-white text-base mt-0.5">{stats.totalSolves}</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-700/40 px-2">
              <span className="text-slate-400">Current Ao5</span>
              <span className="font-mono font-semibold text-slate-200 text-base mt-0.5">
                {formatTime(stats.currentAo5)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-400">Session Mean</span>
              <span className="font-mono font-semibold text-slate-200 text-base mt-0.5">
                {formatTime(stats.averageTime)}
              </span>
            </div>
          </div>

          {/* Solves History List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Solve History ({solves.length})</span>
              </div>

              {solves.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                    title="Export solves JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-950/40 transition"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              )}
            </div>

            {/* Clear confirmation banner */}
            {confirmClear && (
              <div className="mb-3 p-3 rounded-2xl bg-rose-950/50 border border-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Clear all solve records?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClearAllSolves();
                      setConfirmClear(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold text-white transition"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {solves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl bg-slate-950/30 border border-slate-800/60">
                <BarChart3 className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-400">No solves recorded yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Hit Scramble, hold to start the timer, and solve the cube to set your first record!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {solves.map((solve, idx) => {
                  const solveNum = solves.length - idx;
                  const isPB = stats.bestSingle === solve.timeMs;

                  return (
                    <div
                      key={solve.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 transition text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-500 w-6 text-right">#{solveNum}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-sm font-bold ${
                                isPB ? 'text-amber-400' : 'text-slate-100'
                              }`}
                            >
                              {formatTime(solve.timeMs)}
                            </span>
                            {isPB && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                PB
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(solve.date).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {solve.tps > 0 && ` • ${solve.tps.toFixed(1)} TPS`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyScramble(solve.id, solve.scramble)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                          title="Copy scramble algorithm"
                          aria-label="Copy scramble"
                        >
                          {copiedId === solve.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onDeleteSolve(solve.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          title="Delete this record"
                          aria-label="Delete solve"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
