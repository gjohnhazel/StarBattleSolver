import { create } from 'zustand';
import { useGameState } from './game-state';
import type { StateCreator } from 'zustand';

interface Hint {
  description: string;
  apply: () => void;
}

interface SolverState {
  hints: Hint[];
  currentHint: number;
  nextHint: () => void;
  prevHint: () => void;
  applyHint: (index: number) => void;
  generateHints: () => void;
}

export const useSolver = create<SolverState>((set, get) => ({
  hints: [],
  currentHint: 0,

  nextHint: () => {
    const { currentHint, hints } = get();
    if (currentHint < hints.length - 1) {
      set({ currentHint: currentHint + 1 });
    }
  },

  prevHint: () => {
    const { currentHint } = get();
    if (currentHint > 0) {
      set({ currentHint: currentHint - 1 });
    }
  },

  applyHint: (index: number) => {
    const { hints } = get();
    if (hints[index]) {
      hints[index].apply();
    }
  },

  generateHints: () => {
    const { gridState, toggleCell } = useGameState.getState();
    const hints: Hint[] = [];
    const { cells } = gridState;

    // Check rows with no stars
    for (let i = 0; i < 10; i++) {
      const rowStars = cells[i].filter(cell => cell === 1).length;
      if (rowStars === 0) {
        hints.push({
          description: `Row ${i + 1} needs 2 stars. Look for cells that can't have stars due to adjacency rules.`,
          apply: () => {
            // Mark cells that can't have stars due to adjacency
            for (let j = 0; j < 10; j++) {
              let hasAdjacentStar = false;
              for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                  if (di === 0 && dj === 0) continue;
                  const ni = i + di, nj = j + dj;
                  if (ni >= 0 && ni < 10 && nj >= 0 && nj < 10) {
                    if (cells[ni][nj] === 1) {
                      hasAdjacentStar = true;
                      break;
                    }
                  }
                }
              }
              if (hasAdjacentStar && cells[i][j] === 0) {
                toggleCell(i, j, 'x');
              }
            }
          }
        });
      }
    }

    // Check columns with no stars
    for (let j = 0; j < 10; j++) {
      const colStars = cells.map(row => row[j]).filter(cell => cell === 1).length;
      if (colStars === 0) {
        hints.push({
          description: `Column ${j + 1} needs 2 stars. Look for cells that can't have stars due to adjacency rules.`,
          apply: () => {
            // Mark cells that can't have stars due to adjacency
            for (let i = 0; i < 10; i++) {
              let hasAdjacentStar = false;
              for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                  if (di === 0 && dj === 0) continue;
                  const ni = i + di, nj = j + dj;
                  if (ni >= 0 && ni < 10 && nj >= 0 && nj < 10) {
                    if (cells[ni][nj] === 1) {
                      hasAdjacentStar = true;
                      break;
                    }
                  }
                }
              }
              if (hasAdjacentStar && cells[i][j] === 0) {
                toggleCell(i, j, 'x');
              }
            }
          }
        });
      }
    }

    // Add general hints if no specific ones are found
    if (hints.length === 0) {
      hints.push({
        description: "Remember: Each row and column must contain exactly 2 stars, and stars cannot be adjacent (including diagonally).",
        apply: () => {} // General hint doesn't have a specific action
      });
    }

    set({ hints, currentHint: 0 });
  },
}));