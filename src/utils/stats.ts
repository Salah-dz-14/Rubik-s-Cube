import { CubeStats, SolvePenalty, SolveRecord, UserPreferences, ColorTheme } from '../types/cube';

export const THEMES: Record<string, ColorTheme> = {
  classic: {
    name: 'classic',
    label: 'Classic Vibrant',
    colors: {
      U: '#FFD600', // Vibrant Sunny Yellow (Top)
      D: '#FFFFFF', // Pure Crisp White (Bottom / Down)
      L: '#FF6D00', // Vibrant Citrus Orange
      R: '#EE2B2B', // Vibrant Ruby Red
      F: '#00D060', // Vibrant Emerald Green
      B: '#0075FF', // Vibrant Electric Azure
      core: '#15171e',
      border: '#0d0e12',
    },
  },
  neon: {
    name: 'neon',
    label: 'Cyber Neon',
    colors: {
      U: '#FFEE00', // Yellow (Top)
      D: '#FFFFFF', // White (Bottom / Down)
      L: '#FF8800',
      R: '#FF1744',
      F: '#00E676',
      B: '#00B0FF',
      core: '#0a0d14',
      border: '#030712',
    },
  },
  pastel: {
    name: 'pastel',
    label: 'Nordic Pastel',
    colors: {
      U: '#FFF176', // Yellow (Top)
      D: '#FFFFFF', // White (Bottom / Down)
      L: '#FFB74D',
      R: '#FF8A80',
      F: '#A5D6A7',
      B: '#90CAF9',
      core: '#1e293b',
      border: '#0f172a',
    },
  },
  high_contrast: {
    name: 'high_contrast',
    label: 'High Contrast',
    colors: {
      U: '#FFFF00', // Yellow (Top)
      D: '#FFFFFF', // White (Bottom / Down)
      L: '#FF7700',
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
  darkMode: false, // Default is light mode
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
const LIGHT_MODE_DEFAULTED_KEY = 'rubiks_light_default_v2';

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
    const isLightModeDefaulted = localStorage.getItem(LIGHT_MODE_DEFAULTED_KEY);
    const data = localStorage.getItem(PREFS_STORAGE_KEY);

    if (!isLightModeDefaulted) {
      // First time with light mode as default: ensure light mode
      localStorage.setItem(LIGHT_MODE_DEFAULTED_KEY, 'true');
      const prefs = data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data), darkMode: false } : DEFAULT_PREFERENCES;
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
      return prefs;
    }

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

export function effectiveSolveTime(solve: SolveRecord): number {
  if (solve.penalty === 'dnf') return Infinity;
  return solve.timeMs + (solve.penalty === 'plus2' ? 2000 : 0);
}

export function formatSolveTime(timeMs: number, penalty: SolvePenalty = 'none'): string {
  if (penalty === 'dnf') return 'DNF';
  const formattedTime = formatTime(timeMs + (penalty === 'plus2' ? 2000 : 0));
  return penalty === 'plus2' ? `${formattedTime}+` : formattedTime;
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
  if (trimmed.some((time) => !Number.isFinite(time))) return null;
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

  const times = [...solves].reverse().map(effectiveSolveTime);
  const finiteTimes = times.filter(Number.isFinite);
  const bestSingle = finiteTimes.length > 0 ? Math.min(...finiteTimes) : null;
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

  const sumAll = finiteTimes.reduce((a, b) => a + b, 0);
  const averageTime = finiteTimes.length > 0 ? Math.round(sumAll / finiteTimes.length) : null;

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
