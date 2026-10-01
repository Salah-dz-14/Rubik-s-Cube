import * as cubeSolverModule from 'cube-solver';
import { Move } from '../types/cube';
import { parseAlgorithm, getInverseMove } from './scrambler';

// Interop for CJS/UMD in Vite
const cubeSolver: any = (cubeSolverModule as any).default || cubeSolverModule;

let isSolverInitialized = false;

/**
 * Pre-initializes solver tables in the background.
 */
export function initSolverAsync(): void {
  if (isSolverInitialized) return;
  try {
    if (typeof cubeSolver.initialize === 'function') {
      cubeSolver.initialize('kociemba');
      isSolverInitialized = true;
    }
  } catch (err) {
    console.warn('Cube solver init:', err);
  }
}

/**
 * Normalizes algorithm and cancels consecutive turns on the same face.
 */
export function simplifyMoves(moves: Move[]): Move[] {
  if (moves.length === 0) return [];
  const result: Move[] = [];

  for (const move of moves) {
    if (move.isWholeCube) continue;

    if (result.length > 0) {
      const last = result[result.length - 1];
      if (last.face === move.face) {
        // Quarter turn addition: 1 = +1, -1 = 3, 2 = 2
        const q1 = last.direction === 1 ? 1 : last.direction === -1 ? 3 : 2;
        const q2 = move.direction === 1 ? 1 : move.direction === -1 ? 3 : 2;
        const sumQuarter = (q1 + q2) % 4;

        result.pop();
        if (sumQuarter === 1) {
          result.push({ face: last.face, direction: 1, notation: last.face });
        } else if (sumQuarter === 2) {
          result.push({ face: last.face, direction: 2, notation: `${last.face}2` });
        } else if (sumQuarter === 3) {
          result.push({ face: last.face, direction: -1, notation: `${last.face}'` });
        }
        continue;
      }
    }
    result.push(move);
  }

  return result;
}

/**
 * Finds the shortest solution for the current cube state.
 * Uses Kociemba's algorithm (<= 20 moves) or direct inverse if shorter.
 */
export function findMinimalSolution(
  scrambleString: string,
  userMoves: Move[] = []
): Move[] {
  // If the user made only a few moves, inverting them directly can be fewer moves
  let inverseCandidate: Move[] | null = null;
  if (userMoves.length > 0 && userMoves.length <= 8) {
    const rawInv = [...userMoves].reverse().map(getInverseMove);
    inverseCandidate = simplifyMoves(rawInv);
  }

  const userMovesStr = userMoves
    .filter((m) => !m.isWholeCube)
    .map((m) => m.notation)
    .join(' ');
  const fullScramble = `${scrambleString} ${userMovesStr}`.trim();

  let kociembaMoves: Move[] = [];
  if (fullScramble) {
    try {
      const solStr = cubeSolver.solve(fullScramble, 'kociemba');
      if (solStr && typeof solStr === 'string' && solStr.trim()) {
        kociembaMoves = parseAlgorithm(solStr.trim());
      }
    } catch (err) {
      console.warn('Kociemba solve error:', err);
    }
  }

  // Pick candidate with FEWEST moves
  if (inverseCandidate && inverseCandidate.length > 0) {
    if (kociembaMoves.length === 0 || inverseCandidate.length < kociembaMoves.length) {
      return inverseCandidate;
    }
  }

  return kociembaMoves;
}
