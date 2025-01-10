import { create } from 'zustand';
import { useGameState } from './game-state';
import type { StateCreator } from 'zustand';

interface Position {
  row: number;
  col: number;
}

interface Deduction {
  type: 'basic' | 'pattern' | 'area' | 'multi-unit';
  description: string;
  explanation: string;
  affected: Position[];
  apply: () => void;
  certainty: 'definite' | 'likely';
}

interface SolverState {
  deductions: Deduction[];
  currentDeduction: number;
  nextDeduction: () => void;
  prevDeduction: () => void;
  applyDeduction: (index: number) => void;
  generateDeductions: () => void;
}

const findLockedPairs = (cells: number[][]): Deduction[] => {
  const deductions: Deduction[] = [];

  // Check for locked pairs in rows
  for (let i = 0; i < 10; i++) {
    const emptyPositions = cells[i]
      .map((cell, j) => ({ value: cell, pos: { row: i, col: j } }))
      .filter(({ value }) => value === 0)
      .map(({ pos }) => pos);

    if (emptyPositions.length === 2) {
      deductions.push({
        type: 'pattern',
        description: `Locked pair found in row ${i + 1}`,
        explanation: `Only two positions remain in row ${i + 1}. These must contain stars, and we can mark surrounding cells as impossible.`,
        affected: emptyPositions,
        apply: () => {
          const { toggleCell } = useGameState.getState();
          // Mark surrounding cells as impossible
          emptyPositions.forEach(pos => {
            for (let di = -1; di <= 1; di++) {
              for (let dj = -1; dj <= 1; dj++) {
                if (di === 0 && dj === 0) continue;
                const ni = pos.row + di, nj = pos.col + dj;
                if (ni >= 0 && ni < 10 && nj >= 0 && nj < 10 && cells[ni][nj] === 0) {
                  toggleCell(ni, nj, 'x');
                }
              }
            }
          });
        },
        certainty: 'definite'
      });
    }
  }

  return deductions;
};

const findSandwichPatterns = (cells: number[][]): Deduction[] => {
  const deductions: Deduction[] = [];

  // Check for sandwich patterns in rows and columns
  for (let i = 0; i < 10; i++) {
    // Row check
    const stars = cells[i]
      .map((cell, j) => ({ value: cell, col: j }))
      .filter(({ value }) => value === 1);

    if (stars.length === 1) {
      // Look for forced placements due to sandwich effect
      const starCol = stars[0].col;
      const possiblePositions: Position[] = [];

      // Check positions that would complete valid star placements
      for (let j = 0; j < 10; j++) {
        if (Math.abs(j - starCol) >= 2 && cells[i][j] === 0) {
          let valid = true;
          // Check if this creates a valid configuration
          for (let k = Math.min(j, starCol) + 1; k < Math.max(j, starCol); k++) {
            if (cells[i][k] === 1) {
              valid = false;
              break;
            }
          }
          if (valid) {
            possiblePositions.push({ row: i, col: j });
          }
        }
      }

      if (possiblePositions.length === 1) {
        deductions.push({
          type: 'pattern',
          description: `Sandwich pattern in row ${i + 1}`,
          explanation: `Due to the existing star and spacing requirements, there's only one valid position for the second star.`,
          affected: possiblePositions,
          apply: () => {
            const { toggleCell } = useGameState.getState();
            const pos = possiblePositions[0];
            toggleCell(pos.row, pos.col, 'star');
          },
          certainty: 'definite'
        });
      }
    }
  }

  return deductions;
};

const findForcedPlacements = (cells: number[][]): Deduction[] => {
  const deductions: Deduction[] = [];

  // Check each row and column for forced placements
  for (let i = 0; i < 10; i++) {
    let rowStars = 0;
    let lastEmptyCol = -1;
    let emptyCount = 0;

    // Count stars and empty cells in row
    for (let j = 0; j < 10; j++) {
      if (cells[i][j] === 1) rowStars++;
      else if (cells[i][j] === 0) {
        emptyCount++;
        lastEmptyCol = j;
      }
    }

    // If we need one more star and only one valid position remains
    if (rowStars === 1 && emptyCount === 1) {
      deductions.push({
        type: 'basic',
        description: `Forced placement in row ${i + 1}`,
        explanation: `This row needs one more star and only one position is available.`,
        affected: [{ row: i, col: lastEmptyCol }],
        apply: () => {
          const { toggleCell } = useGameState.getState();
          toggleCell(i, lastEmptyCol, 'star');
        },
        certainty: 'definite'
      });
    }
  }

  return deductions;
};

const analyzeRegions = (cells: number[][], horizontal: boolean[][], vertical: boolean[][]): Deduction[] => {
  const deductions: Deduction[] = [];

  // Implement region analysis logic here
  // This is a placeholder for more sophisticated region analysis
  // TODO: Add proper region detection and analysis

  return deductions;
};

export const useSolver = create<SolverState>((set, get) => ({
  deductions: [],
  currentDeduction: 0,

  nextDeduction: () => {
    const { currentDeduction, deductions } = get();
    if (currentDeduction < deductions.length - 1) {
      set({ currentDeduction: currentDeduction + 1 });
    }
  },

  prevDeduction: () => {
    const { currentDeduction } = get();
    if (currentDeduction > 0) {
      set({ currentDeduction: currentDeduction - 1 });
    }
  },

  applyDeduction: (index: number) => {
    const { deductions } = get();
    if (deductions[index]) {
      deductions[index].apply();
    }
  },

  generateDeductions: () => {
    const { gridState } = useGameState.getState();
    const { cells, horizontal, vertical } = gridState;

    // Generate deductions in order of complexity
    const deductions: Deduction[] = [
      ...findForcedPlacements(cells),
      ...findLockedPairs(cells),
      ...findSandwichPatterns(cells),
      ...analyzeRegions(cells, horizontal, vertical)
    ];

    // Add general hint if no specific deductions found
    if (deductions.length === 0) {
      deductions.push({
        type: 'basic',
        description: "No immediate logical deductions available",
        explanation: "Try looking for basic patterns: rows/columns that need exactly two stars, cells that can't contain stars due to adjacency, or regions that must contain specific numbers of stars.",
        affected: [],
        apply: () => {}, // No specific action for general hint
        certainty: 'likely'
      });
    }

    set({ deductions, currentDeduction: 0 });
  },
}));