import React, { useState } from 'react';
import { Download, Share2, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone app, do not show
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition active:scale-95"
        title="Install Offline App"
        aria-label="Install App"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 bg-slate-800/80 text-slate-200 text-xs font-medium transition active:scale-95"
          title="Install on iPhone / iPad"
          aria-label="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Install PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Share2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold">Install on iPhone / iPad</h3>
              <p className="mt-2 text-sm text-slate-300">
                Play offline anytime with zero loading latency and full-screen immersion:
              </p>

              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</div>
                  <span>Tap the <strong>Share</strong> icon in Safari's bottom toolbar.</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</div>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</div>
                  <span>Tap <strong>Add</strong> in the top-right corner.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
