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

const findRegions = (horizontal: boolean[][], vertical: boolean[][]): number[][] => {
  const grid = Array(10).fill(0).map(() => Array(10).fill(-1));
  let regionId = 0;

  const floodFill = (row: number, col: number, id: number) => {
    if (row < 0 || row >= 10 || col < 0 || col >= 10 || grid[row][col] !== -1) return;
    grid[row][col] = id;

    // Check all four directions
    if (!horizontal[row][col]) floodFill(row - 1, col, id);     // Up
    if (!horizontal[row + 1][col]) floodFill(row + 1, col, id); // Down
    if (!vertical[row][col]) floodFill(row, col - 1, id);       // Left
    if (!vertical[row][col + 1]) floodFill(row, col + 1, id);   // Right
  };

  // Find all regions using flood fill
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (grid[i][j] === -1) {
        floodFill(i, j, regionId);
        regionId++;
      }
    }
  }

  return grid;
};

const analyzeRegions = (cells: number[][], horizontal: boolean[][], vertical: boolean[][]): Deduction[] => {
  const deductions: Deduction[] = [];
  const regions = findRegions(horizontal, vertical);

  // Get all cells in each region
  const regionCells: Position[][] = [];
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const regionId = regions[i][j];
      if (!regionCells[regionId]) regionCells[regionId] = [];
      regionCells[regionId].push({ row: i, col: j });
    }
  }

  // Analyze each region
  regionCells.forEach((cellsInRegion, regionId) => {
    const starCount = cellsInRegion.reduce(
      (count, pos) => count + (cells[pos.row][pos.col] === 1 ? 1 : 0),
      0
    );
    const emptyPositions = cellsInRegion.filter(
      pos => cells[pos.row][pos.col] === 0
    );

    // Case 1: Small region (3 cells) must have 2 stars
    if (cellsInRegion.length === 3 && starCount < 2) {
      // Stars must be at endpoints due to adjacency rules
      const endpoints = findEndpoints(cellsInRegion, horizontal, vertical);
      if (endpoints.length === 2) {
        deductions.push({
          type: 'area',
          description: `Small region requires stars at endpoints`,
          explanation: `This region of 3 cells must contain 2 stars. Due to adjacency rules, they can only be placed at the endpoints.`,
          affected: endpoints,
          apply: () => {
            const { toggleCell } = useGameState.getState();
            endpoints.forEach(pos => {
              if (cells[pos.row][pos.col] === 0) {
                toggleCell(pos.row, pos.col, 'star');
              }
            });
          },
          certainty: 'definite'
        });
      }
    }

    // Case 2: Region with size n must have exactly n/5 * 2 stars
    const requiredStars = Math.floor(cellsInRegion.length / 5) * 2;
    if (starCount < requiredStars && emptyPositions.length === requiredStars - starCount) {
      deductions.push({
        type: 'area',
        description: `Region requires ${requiredStars} stars`,
        explanation: `This region of ${cellsInRegion.length} cells must contain exactly ${requiredStars} stars, and there are only ${emptyPositions.length} positions remaining.`,
        affected: emptyPositions,
        apply: () => {
          const { toggleCell } = useGameState.getState();
          emptyPositions.forEach(pos => {
            toggleCell(pos.row, pos.col, 'star');
          });
        },
        certainty: 'definite'
      });
    }
  });

  return deductions;
};

const findEndpoints = (cellsInRegion: Position[], horizontal: boolean[][], vertical: boolean[][]): Position[] => {
  return cellsInRegion.filter(pos => {
    let connections = 0;
    // Check all four directions
    if (!horizontal[pos.row][pos.col]) connections++; // Up
    if (!horizontal[pos.row + 1][pos.col]) connections++; // Down
    if (!vertical[pos.row][pos.col]) connections++; // Left
    if (!vertical[pos.row][pos.col + 1]) connections++; // Right
    return connections === 1; // Endpoint has only one connection
  });
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