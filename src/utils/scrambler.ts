import { FaceName, Move } from '../types/cube';

const FACES: FaceName[] = ['U', 'D', 'L', 'R', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];

// Group opposite faces to prevent commutative redundancies (e.g., R L R)
const OPPOSITE_FACE_AXIS: Record<FaceName, number> = {
  U: 0,
  D: 0,
  L: 1,
  R: 1,
  F: 2,
  B: 2,
};

/**
 * Generates an official WCA-compliant Rubik's Cube scramble sequence.
 */
export function generateScramble(length: number = 22): string {
  const scrambleMoves: string[] = [];
  let lastFace: FaceName | null = null;
  let secondLastFace: FaceName | null = null;

  for (let i = 0; i < length; i++) {
    const validFaces = FACES.filter((face) => {
      // Cannot be the exact same face as previous move
      if (face === lastFace) return false;

      // If last move and current move share the same axis (e.g. U and D),
      // we must not pick the second last face if it was also on that axis
      if (
        lastFace &&
        secondLastFace &&
        OPPOSITE_FACE_AXIS[face] === OPPOSITE_FACE_AXIS[lastFace] &&
        OPPOSITE_FACE_AXIS[face] === OPPOSITE_FACE_AXIS[secondLastFace]
      ) {
        return false;
      }

      return true;
    });

    const chosenFace = validFaces[Math.floor(Math.random() * validFaces.length)];
    const chosenModifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    scrambleMoves.push(`${chosenFace}${chosenModifier}`);
    secondLastFace = lastFace;
    lastFace = chosenFace;
  }

  return scrambleMoves.join(' ');
}

/**
 * Parses a scramble or move notation string like "R U R' U' F2" into executable Move objects.
 */
export function parseNotation(moveStr: string): Move | null {
  const trimmed = moveStr.trim();
  if (!trimmed) return null;

  const faceChar = trimmed[0].toUpperCase() as FaceName;
  if (!FACES.includes(faceChar)) return null;

  const suffix = trimmed.slice(1);
  let direction: 1 | -1 | 2 = 1;
  if (suffix === "'") {
    direction = -1;
  } else if (suffix === '2') {
    direction = 2;
  }

  return {
    face: faceChar,
    direction,
    notation: trimmed,
  };
}

export function parseAlgorithm(algStr: string): Move[] {
  return algStr
    .trim()
    .split(/\s+/)
    .map(parseNotation)
    .filter((m): m is Move => m !== null);
}

/**
 * Returns inverse move (e.g., R -> R', R' -> R, R2 -> R2)
 */
export function getInverseMove(move: Move): Move {
  let invDir: 1 | -1 | 2 = 1;
  let suffix = '';
  if (move.direction === 1) {
    invDir = -1;
    suffix = "'";
  } else if (move.direction === -1) {
    invDir = 1;
    suffix = '';
  } else {
    invDir = 2;
    suffix = '2';
  }

  const baseSymbol = move.isWholeCube && move.wholeAxis ? move.wholeAxis : move.face;

  return {
    face: move.face,
    direction: invDir,
    notation: `${baseSymbol}${suffix}`,
    isWholeCube: move.isWholeCube,
    wholeAxis: move.wholeAxis,
  };
}
