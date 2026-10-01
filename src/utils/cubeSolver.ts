import Cube from 'cubejs';
import { Move } from '../types/cube';
import { parseAlgorithm } from './scrambler';

let isSolverInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initializes Kociemba lookup tables asynchronously in the background.
 */
export async function initCubeSolver(): Promise<void> {
  if (isSolverInitialized) return;
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve) => {
    // Run in setTimeout to avoid blocking initial UI paint
    setTimeout(() => {
      try {
        Cube.initSolver();
        isSolverInitialized = true;
      } catch (err) {
        console.error('Error initializing Cube solver:', err);
      }
      resolve();
    }, 50);
  });

  return initPromise;
}

/**
 * Solves the Rubik's cube in the fewest moves possible using Herbert Kociemba's two-phase algorithm.
 * Takes the sequence of moves that got the cube into its current scrambled state,
 * simulates the cube, and generates the optimal/near-optimal solution (typically 18-22 moves or fewer).
 */
export async function solveRubikCube(appliedMoves: Move[]): Promise<Move[]> {
  await initCubeSolver();

  const cube = new Cube();

  // Apply all moves that have been made since solved state
  for (const m of appliedMoves) {
    if (m.isWholeCube) continue; // whole cube rotations don't change internal scramble
    const notation = m.notation || `${m.face}${m.direction === -1 ? "'" : m.direction === 2 ? '2' : ''}`;
    try {
      cube.move(notation);
    } catch {
      // Ignore if notation is not standard
    }
  }

  if (cube.isSolved()) {
    return [];
  }

  // Get the optimal solution with fewest moves
  const solutionStr = cube.solve();
  if (!solutionStr || solutionStr.trim() === '') {
    return [];
  }

  return parseAlgorithm(solutionStr);
}
