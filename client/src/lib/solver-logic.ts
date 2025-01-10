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

// Find all cells that share a unit (row, column, or region) with the given position
const getRelatedCells = (pos: Position, regions: number[][]): Position[] => {
  const related: Position[] = [];
  if (!pos || !regions || pos.row < 0 || pos.row >= 10 || pos.col < 0 || pos.col >= 10) {
    return related;
  }

  const regionId = regions[pos.row][pos.col];
  if (regionId === undefined) return related;

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (regions[i]?.[j] !== undefined && 
          (i === pos.row || j === pos.col || regions[i][j] === regionId)) {
        related.push({ row: i, col: j });
      }
    }
  }
  return related;
};

const findSandwichPatterns = (cells: number[][], regions: number[][]): Deduction[] => {
  const deductions: Deduction[] = [];

  // Check each row and column for sandwich patterns
  for (let i = 0; i < 10; i++) {
    const stars = [];
    for (let j = 0; j < 10; j++) {
      if (cells?.[i]?.[j] === 1) stars.push(j);
    }

    if (stars.length === 1) {
      const possiblePositions = [];
      for (let j = 0; j < 10; j++) {
        if (Math.abs(j - stars[0]) >= 2 && cells?.[i]?.[j] === 0) {
          let valid = true;
          // Check if placing a star here would create invalid patterns
          const affected = getRelatedCells({ row: i, col: j }, regions);
          for (const pos of affected) {
            if (cells?.[pos.row]?.[pos.col] === 1) valid = false;
          }
          if (valid) possiblePositions.push({ row: i, col: j });
        }
      }

      if (possiblePositions.length === 1) {
        deductions.push({
          type: 'pattern',
          description: `Sandwich pattern in row ${i + 1}`,
          explanation: 'Due to existing star placement and spacing rules, only one position remains valid',
          affected: possiblePositions,
          apply: () => {
            const { toggleCell } = useGameState.getState();
            possiblePositions.forEach(pos => toggleCell(pos.row, pos.col, 'star'));
          },
          certainty: 'definite'
        });
      }
    }
  }
  return deductions;
};

const findLockedSets = (cells: number[][], regions: number[][]): Deduction[] => {
  const deductions: Deduction[] = [];

  // Find cells that must contain stars due to locked sets in regions
  for (let regionId = 0; regionId < 10; regionId++) {
    const regionCells: Position[] = [];
    const emptyCells: Position[] = [];

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if (regions[i][j] === regionId) {
          regionCells.push({ row: i, col: j });
          if (cells[i][j] === 0) emptyCells.push({ row: i, col: j });
        }
      }
    }

    const starCount = regionCells.filter(pos => cells[pos.row][pos.col] === 1).length;
    const requiredStars = Math.floor(regionCells.length / 5) * 2;

    if (starCount < requiredStars && emptyCells.length === requiredStars - starCount) {
      deductions.push({
        type: 'area',
        description: `Locked set in region`,
        explanation: `This region requires ${requiredStars} stars and only has ${emptyCells.length} possible positions remaining`,
        affected: emptyCells,
        apply: () => {
          const { toggleCell } = useGameState.getState();
          emptyCells.forEach(pos => toggleCell(pos.row, pos.col, 'star'));
        },
        certainty: 'definite'
      });
    }
  }
  return deductions;
};

const findMultiUnitConstraints = (cells: number[][], regions: number[][]): Deduction[] => {
  const deductions: Deduction[] = [];

  // Find cells that must be stars due to multiple unit constraints
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (cells[i][j] === 0) {
        const related = getRelatedCells({ row: i, col: j }, regions);
        const blockedPositions = related.filter(pos => cells[pos.row][pos.col] === 2).length;
        const remainingPositions = related.filter(pos => cells[pos.row][pos.col] === 0).length;

        if (remainingPositions === 1 && blockedPositions === related.length - 1) {
          deductions.push({
            type: 'multi-unit',
            description: `Forced star at (${i + 1}, ${j + 1})`,
            explanation: 'Multiple unit constraints eliminate all other positions',
            affected: [{ row: i, col: j }],
            apply: () => {
              const { toggleCell } = useGameState.getState();
              toggleCell(i, j, 'star');
            },
            certainty: 'definite'
          });
        }
      }
    }
  }
  return deductions;
};

const findBasicDeductions = (cells: number[][]): Deduction[] => {
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

    // Check all four directions - only flood if there's no boundary
    if (row > 0 && !horizontal[row][col]) {
      floodFill(row - 1, col, id);     // Up
    }
    if (row < 9 && !horizontal[row + 1][col]) {
      floodFill(row + 1, col, id);     // Down
    }
    if (col > 0 && !vertical[row][col]) {
      floodFill(row, col - 1, id);     // Left
    }
    if (col < 9 && !vertical[row][col + 1]) {
      floodFill(row, col + 1, id);     // Right
    }
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

  // Debug: Log region counts
  const regionCounts = new Array(regionId).fill(0);
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      regionCounts[grid[i][j]]++;
    }
  }
  console.log('Regions detected:', regionId);
  console.log('Cells per region:', regionCounts);

  // Verify regions are properly separated
  const regionSizes = new Array(regionId).fill(0);
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      regionSizes[grid[i][j]]++;
    }
  }

  return grid;
};

const findSquareRegions = (cells: number[][], regions: number[][]): Deduction[] => {
  const deductions: Deduction[] = [];
  
  // Get all cells in each region
  const regionCells: Position[][] = [];
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const regionId = regions[i][j];
      if (!regionCells[regionId]) regionCells[regionId] = [];
      regionCells[regionId].push({ row: i, col: j });
    }
  }

  regionCells.forEach((cells, regionId) => {
    if (cells.length === 9 || cells.length === 8) {
      // Find bounding box
      const minRow = Math.min(...cells.map(c => c.row));
      const maxRow = Math.max(...cells.map(c => c.row));
      const minCol = Math.min(...cells.map(c => c.col));
      const maxCol = Math.max(...cells.map(c => c.col));
      
      // Check if it's a 3x3 square or near-square
      if (maxRow - minRow === 2 && maxCol - minCol === 2) {
        // Find center cell
        const centerPos = {
          row: minRow + 1,
          col: minCol + 1
        };
        
        if (cells.some(c => c.row === centerPos.row && c.col === centerPos.col)) {
          deductions.push({
            type: 'pattern',
            description: `Center of ${cells.length}-cell square region must be empty`,
            explanation: `In a ${cells.length}-cell square or near-square region, the center cell cannot contain a star due to adjacency rules`,
            affected: [centerPos],
            apply: () => {
              const { toggleCell } = useGameState.getState();
              toggleCell(centerPos.row, centerPos.col, 'empty');
            },
            certainty: 'definite'
          });
        }
      }
    }
  });

  return deductions;
};

const findTShapedRegions = (cells: number[][], regions: number[][]): Deduction[] => {
  const deductions: Deduction[] = [];
  
  // Get all cells in each region
  const regionCells: Position[][] = [];
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const regionId = regions[i][j];
      if (!regionCells[regionId]) regionCells[regionId] = [];
      regionCells[regionId].push({ row: i, col: j });
    }
  }

  regionCells.forEach((cells, regionId) => {
    if (cells.length === 4) {
      // Find bounding box
      const minRow = Math.min(...cells.map(c => c.row));
      const maxRow = Math.max(...cells.map(c => c.row));
      const minCol = Math.min(...cells.map(c => c.col));
      const maxCol = Math.max(...cells.map(c => c.col));
      
      // Check if it's a T shape (3x2 or 2x3 bounding box)
      if ((maxRow - minRow === 2 && maxCol - minCol === 1) || 
          (maxRow - minRow === 1 && maxCol - minCol === 2)) {
        
        // Find the center and bottom cells
        const affectedCells: Position[] = [];
        
        // For vertical T
        if (maxRow - minRow === 2 && maxCol - minCol === 1) {
          // Center cell (middle of vertical line)
          const centerPos = { row: minRow + 1, col: minCol };
          // Bottom cell
          const bottomPos = { row: maxRow, col: minCol };
          if (cells.some(c => c.row === centerPos.row && c.col === centerPos.col)) {
            affectedCells.push(centerPos);
          }
          if (cells.some(c => c.row === bottomPos.row && c.col === bottomPos.col)) {
            affectedCells.push(bottomPos);
          }
        }
        // For horizontal T (rotate 90° clockwise to identify "bottom")
        else if (maxRow - minRow === 1 && maxCol - minCol === 2) {
          // Center cell
          const centerPos = { row: minRow, col: minCol + 1 };
          // "Bottom" cell (rightmost cell when rotated)
          const bottomPos = { row: minRow, col: maxCol };
          if (cells.some(c => c.row === centerPos.row && c.col === centerPos.col)) {
            affectedCells.push(centerPos);
          }
          if (cells.some(c => c.row === bottomPos.row && c.col === bottomPos.col)) {
            affectedCells.push(bottomPos);
          }
        }

        if (affectedCells.length > 0) {
          deductions.push({
            type: 'pattern',
            description: 'T-shaped region cells must be empty',
            explanation: 'In a T-shaped region of 4 cells, the center and "bottom" cells cannot contain stars due to adjacency rules',
            affected: affectedCells,
            apply: () => {
              const { toggleCell } = useGameState.getState();
              affectedCells.forEach(pos => toggleCell(pos.row, pos.col, 'empty'));
            },
            certainty: 'definite'
          });
        }
      }
    }
  });

  return deductions;
};

const findSingleLineRegions = (cells: number[][], regions: number[][]): Deduction[] => {
  const deductions: Deduction[] = [];
  
  // Get all cells in each region
  const regionCells: Position[][] = [];
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const regionId = regions[i][j];
      if (!regionCells[regionId]) regionCells[regionId] = [];
      regionCells[regionId].push({ row: i, col: j });
    }
  }

  // Check each region
  regionCells.forEach((cells, regionId) => {
    if (cells.length >= 4) {  // Check regions that could affect line constraints
      // Check if all cells are in one row
      const uniqueRows = new Set(cells.map(c => c.row));
      const uniqueCols = new Set(cells.map(c => c.col));
      
      if (uniqueRows.size === 1 || uniqueCols.size === 1) {
        const line = uniqueRows.size === 1 ? cells[0].row : null;
        const col = uniqueCols.size === 1 ? cells[0].col : null;
        
        // Find other cells in same line but different region
        const affectedCells: Position[] = [];
        for (let i = 0; i < 10; i++) {
          const pos = line !== null ? { row: line, col: i } : { row: i, col: col! };
          // Only add cells that are in the same line but not in our region and are empty
          if (pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10) {
            if (regions[pos.row][pos.col] !== regionId && cells[pos.row][pos.col] === 0) {
              affectedCells.push(pos);
            }
          }
        }
        
        if (affectedCells.length > 0) {
          deductions.push({
            type: 'pattern',
            description: `${line !== null ? 'Row' : 'Column'} region requires all stars`,
            explanation: `Since region ${regionId} occupies an entire ${line !== null ? 'row' : 'column'}, it must contain both stars for that ${line !== null ? 'row' : 'column'}. Other cells in this ${line !== null ? 'row' : 'column'} must be empty.`,
            affected: affectedCells,
            apply: () => {
              const { toggleCell } = useGameState.getState();
              affectedCells.forEach(pos => toggleCell(pos.row, pos.col, 'empty'));
            },
            certainty: 'definite'
          });
        }
      }
    }
  });
  
  return deductions;
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

    // Check if puzzle has been drawn (at least some boundaries exist)
    const hasRegions = horizontal.some(row => row.some(cell => cell)) || 
                      vertical.some(row => row.some(cell => cell));
    
    if (!hasRegions) {
      set({
        deductions: [{
          type: 'basic',
          description: "No puzzle boundaries detected",
          explanation: "Please draw the puzzle regions first in Draw Mode before using hints.",
          affected: [],
          apply: () => {},
          certainty: 'definite'
        }],
        currentDeduction: 0
      });
      return;
    }

    const regions = findRegions(horizontal, vertical);
    const deductions: Deduction[] = [
      ...findBasicDeductions(cells),
      ...findSandwichPatterns(cells, regions),
      ...findLockedSets(cells, regions),
      ...findMultiUnitConstraints(cells, regions),
      ...findSquareRegions(cells, regions),
      ...findTShapedRegions(cells, regions),
      ...findSingleLineRegions(cells, regions),
      ...analyzeRegions(cells, horizontal, vertical)
    ];

    // Sort deductions by complexity (basic -> pattern -> area -> multi-unit)
    deductions.sort((a, b) => {
      const typeOrder = { basic: 0, pattern: 1, area: 2, 'multi-unit': 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

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