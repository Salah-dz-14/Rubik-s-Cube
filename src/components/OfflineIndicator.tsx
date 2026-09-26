import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-3 left-3 z-40 flex items-center gap-2 rounded-full bg-amber-500/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white shadow-lg border border-amber-400/30 animate-in fade-in slide-in-from-bottom-2">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — Game runs 100% offline</span>
    </div>
  );
};
