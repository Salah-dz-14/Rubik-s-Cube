import React from 'react';
import { UserPreferences, ThemeName } from '../types/cube';
import { THEMES } from '../utils/stats';
import { sound } from '../utils/audio';
import { X, Moon, Sun, Volume2, VolumeX, Gauge, Palette, Tag, Timer, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onChangePreferences: (next: UserPreferences) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onChangePreferences,
}) => {
  if (!isOpen) return null;

  const update = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
    const next = { ...preferences, [key]: val };
    onChangePreferences(next);
  };

  const handleSoundToggle = (enabled: boolean) => {
    update('soundEnabled', enabled);
    sound.enabled = enabled;
    if (enabled) {
      sound.playClick(1.2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Settings & Options</h2>
              <p className="text-xs text-slate-400">Customize display, controls & audio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Appearance & Dark Mode */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Display & Mode
            </span>

            {/* Background Color: White or Black */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-700/60 text-slate-200">
                  {preferences.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">Background Color</span>
                  <span className="text-xs text-slate-400">
                    Current: {preferences.darkMode ? 'Pure Black' : 'Pure White'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-700/60">
                <button
                  onClick={() => update('darkMode', false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    !preferences.darkMode
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => update('darkMode', true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    preferences.darkMode
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Black
                </button>
              </div>
            </div>

            {/* Cube Sticker Theme */}
            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2.5">
                <Palette className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Cube Colors</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(THEMES) as ThemeName[]).map((thmKey) => {
                  const themeObj = THEMES[thmKey];
                  const isSelected = preferences.theme === thmKey;
                  return (
                    <button
                      key={thmKey}
                      onClick={() => update('theme', thmKey)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex gap-0.5 shrink-0">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: themeObj.colors.U }} />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: themeObj.colors.F }} />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: themeObj.colors.R }} />
                      </div>
                      <span className="text-xs font-medium truncate">{themeObj.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gameplay & Performance */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Gameplay & Mechanics
            </span>

            {/* Turn Speed */}
            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Slice Rotation Speed</span>
                </div>
                <span className="text-xs font-mono text-emerald-400">{preferences.moveSpeed}ms</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Pro (110ms)', val: 110 },
                  { label: 'Normal (170ms)', val: 170 },
                  { label: 'Smooth (260ms)', val: 260 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => update('moveSpeed', opt.val)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition ${
                      preferences.moveSpeed === opt.val
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Effects */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-700/60 text-slate-200">
                  {preferences.soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">Mechanical Sound</span>
                  <span className="text-xs text-slate-400">Click sounds on slice turns and timer</span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => handleSoundToggle(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Face Labels Overlay */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-700/60 text-purple-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">Center Face Guides</span>
                  <span className="text-xs text-slate-400">Show U, D, L, R, F, B on center stickers</span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={preferences.showFaceLabels}
                onChange={(e) => update('showFaceLabels', e.target.checked)}
                className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            {/* WCA 15-Second Inspection */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-700/60 text-amber-400">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">15s WCA Inspection</span>
                  <span className="text-xs text-slate-400">Countdown inspection before solve starts</span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={preferences.inspectionEnabled}
                onChange={(e) => update('inspectionEnabled', e.target.checked)}
                className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
              />
            </div>

            {/* Auto Start On First Move */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-700/60 text-emerald-400">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">Auto Start On Move</span>
                  <span className="text-xs text-slate-400">Timer begins when first slice is turned</span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={preferences.autoStartOnMove}
                onChange={(e) => update('autoStartOnMove', e.target.checked)}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
