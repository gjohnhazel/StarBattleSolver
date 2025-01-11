
import type { GridState } from './game-state';

export interface ExamplePuzzle {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  gridState: GridState;
}

// Simple 3x3 example puzzle
const puzzle1: ExamplePuzzle = {
  id: 'example1',
  name: 'Simple Square',
  difficulty: 'easy',
  gridState: {
    cells: Array(10).fill(null).map(() => Array(10).fill(0)),
    horizontal: Array(11).fill(null).map((_, i) => Array(10).fill(i === 0 || i === 10 || i === 4 || i === 7)),
    vertical: Array(10).fill(null).map(() => Array(11).fill(false).map((_, i) => i === 0 || i === 10 || i === 4 || i === 7))
  }
};

// L-shaped regions puzzle
const puzzle2: ExamplePuzzle = {
  id: 'example2',
  name: 'L-Shapes',
  difficulty: 'medium',
  gridState: {
    cells: Array(10).fill(null).map(() => Array(10).fill(0)),
    horizontal: Array(11).fill(null).map((_, i) => Array(10).fill(i === 0 || i === 10 || i === 3 || i === 6 || i === 8)),
    vertical: Array(10).fill(null).map(() => Array(11).fill(false).map((_, i) => i === 0 || i === 10 || i === 3 || i === 5 || i === 8))
  }
};

export let examplePuzzles: ExamplePuzzle[] = [puzzle1, puzzle2];

export const saveCustomPuzzle = (gridState: GridState) => {
  const newPuzzle: ExamplePuzzle = {
    id: `custom${Date.now()}`,
    name: `Custom Puzzle ${examplePuzzles.length + 1}`,
    difficulty: 'medium',
    gridState: gridState
  };
  
  examplePuzzles = [...examplePuzzles, newPuzzle];
  return newPuzzle;
};
