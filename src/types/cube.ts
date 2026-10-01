export type FaceName = 'U' | 'D' | 'L' | 'R' | 'F' | 'B' | 'M' | 'E' | 'S';

export type Axis = 'x' | 'y' | 'z';

export interface Move {
  face: FaceName;
  direction: 1 | -1 | 2; // 1 = clockwise, -1 = counter-clockwise, 2 = 180 deg
  notation: string; // e.g. "R", "R'", "R2", "y", "x"
  isWholeCube?: boolean;
  wholeAxis?: 'x' | 'y' | 'z';
  isProgrammatic?: boolean;
}

export type ThemeName = 'classic' | 'neon' | 'pastel' | 'high_contrast';

export interface ColorTheme {
  name: ThemeName;
  label: string;
  colors: {
    U: string; // Up (White / Light)
    D: string; // Down (Yellow)
    L: string; // Left (Orange)
    R: string; // Right (Red)
    F: string; // Front (Green)
    B: string; // Back (Blue)
    core: string; // Inner plastic
    border: string; // Sticker borders
  };
}

export interface SolveRecord {
  id: string;
  timeMs: number;
  scramble: string;
  date: number; // timestamp
  movesCount: number;
  tps: number; // turns per second
}

export interface CubeStats {
  bestSingle: number | null;
  bestAo5: number | null;
  bestAo12: number | null;
  currentAo5: number | null;
  currentAo12: number | null;
  totalSolves: number;
  averageTime: number | null;
}

export type TimerState = 'idle' | 'holding' | 'ready' | 'inspecting' | 'running' | 'solved';

export interface UserPreferences {
  theme: ThemeName;
  darkMode: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  showFaceLabels: boolean;
  moveSpeed: number; // ms for 90 deg rotation, e.g. 180
  inspectionEnabled: boolean;
  autoStartOnMove: boolean;
  gestureSensitivity: number; // sensitivity multiplier
}
