import { CubeStats, SolveRecord, UserPreferences, ColorTheme } from '../types/cube';

export const THEMES: Record<string, ColorTheme> = {
  classic: {
    name: 'classic',
    label: 'Classic WCA',
    colors: {
      U: '#FFFFFF', // White
      D: '#FFD500', // Yellow
      L: '#FF5800', // Orange
      R: '#C41E3A', // Red
      F: '#009E60', // Green
      B: '#0051BA', // Blue
      core: '#15171e',
      border: '#0d0e12',
    },
  },
  neon: {
    name: 'neon',
    label: 'Cyber Neon',
    colors: {
      U: '#F8FAFC',
      D: '#FACC15',
      L: '#FB923C',
      R: '#F43F5E',
      F: '#10B981',
      B: '#38BDF8',
      core: '#0a0d14',
      border: '#030712',
    },
  },
  pastel: {
    name: 'pastel',
    label: 'Nordic Pastel',
    colors: {
      U: '#F1F5F9',
      D: '#FEF08A',
      L: '#FDBA74',
      R: '#FDA4AF',
      F: '#86EFAC',
      B: '#93C5FD',
      core: '#1e293b',
      border: '#0f172a',
    },
  },
  high_contrast: {
    name: 'high_contrast',
    label: 'High Contrast',
    colors: {
      U: '#FFFFFF',
      D: '#FFFF00',
      L: '#FF8800',
      R: '#FF0033',
      F: '#00FF66',
      B: '#0066FF',
      core: '#000000',
      border: '#000000',
    },
  },
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'classic',
  darkMode: true,
  soundEnabled: true,
  hapticEnabled: true,
  showFaceLabels: false,
  moveSpeed: 170, // 170ms per turn
  inspectionEnabled: false,
  autoStartOnMove: true,
  gestureSensitivity: 1.0,
};

const SOLVES_STORAGE_KEY = 'rubiks_speedcube_solves_v1';
const PREFS_STORAGE_KEY = 'rubiks_speedcube_prefs_v1';

export function loadSavedSolves(): SolveRecord[] {
  try {
    const data = localStorage.getItem(SOLVES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSolves(solves: SolveRecord[]) {
  try {
    localStorage.setItem(SOLVES_STORAGE_KEY, JSON.stringify(solves));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSavedPreferences(): UserPreferences {
  try {
    const data = localStorage.getItem(PREFS_STORAGE_KEY);
    return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences) {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}

/**
 * Format milliseconds into standard speedcubing format: 00:12.34 or 1:23.45
 */
export function formatTime(ms: number | null): string {
  if (ms === null || isNaN(ms)) return '--:--';
  if (ms < 0) ms = 0;

  const totalCentiseconds = Math.floor(ms / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const csStr = centiseconds.toString().padStart(2, '0');
  const secStr = minutes > 0 ? seconds.toString().padStart(2, '0') : seconds.toString();

  if (minutes > 0) {
    return `${minutes}:${secStr}.${csStr}`;
  }
  return `${secStr}.${csStr}`;
}

/**
 * Compute Average of N (e.g. Ao5, Ao12).
 * In official WCA:
 * - Ao5 drops highest and lowest, averages the remaining 3.
 * - Ao12 drops highest and lowest, averages the remaining 10.
 */
export function calculateAoN(times: number[], n: number): number | null {
  if (times.length < n) return null;
  const sample = times.slice(-n);
  const sorted = [...sample].sort((a, b) => a - b);
  // drop min and max
  const trimmed = sorted.slice(1, -1);
  const sum = trimmed.reduce((acc, t) => acc + t, 0);
  return Math.round(sum / trimmed.length);
}

export function computeCubeStats(solves: SolveRecord[]): CubeStats {
  if (solves.length === 0) {
    return {
      bestSingle: null,
      bestAo5: null,
      bestAo12: null,
      currentAo5: null,
      currentAo12: null,
      totalSolves: 0,
      averageTime: null,
    };
  }

  const times = solves.map((s) => s.timeMs);
  const bestSingle = Math.min(...times);
  const currentAo5 = calculateAoN(times, 5);
  const currentAo12 = calculateAoN(times, 12);

  // Find all historical Ao5s
  let bestAo5: number | null = null;
  for (let i = 5; i <= times.length; i++) {
    const ao5 = calculateAoN(times.slice(0, i), 5);
    if (ao5 !== null) {
      bestAo5 = bestAo5 === null ? ao5 : Math.min(bestAo5, ao5);
    }
  }

  // Find all historical Ao12s
  let bestAo12: number | null = null;
  for (let i = 12; i <= times.length; i++) {
    const ao12 = calculateAoN(times.slice(0, i), 12);
    if (ao12 !== null) {
      bestAo12 = bestAo12 === null ? ao12 : Math.min(bestAo12, ao12);
    }
  }

  const sumAll = times.reduce((a, b) => a + b, 0);
  const averageTime = Math.round(sumAll / times.length);

  return {
    bestSingle,
    bestAo5,
    bestAo12,
    currentAo5,
    currentAo12,
    totalSolves: solves.length,
    averageTime,
  };
}
