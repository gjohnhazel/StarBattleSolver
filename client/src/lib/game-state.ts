import { create } from 'zustand';
import { useToast } from '@/hooks/use-toast';
import type { StateCreator } from 'zustand';

export interface Position {
  x: number;
  y: number;
}

export interface Boundary {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface GameState {
  boundaries: Boundary[];
  stars: Position[];
  xMarks: Position[];
  toggleBoundary: (x1: number, y1: number, x2: number, y2: number) => void;
  toggleCell: (x: number, y: number, type: 'star' | 'x') => void;
  reset: () => void;
  validate: () => void;
}

export const useGameState = create<GameState>((set, get) => ({
  boundaries: [],
  stars: [],
  xMarks: [],

  toggleBoundary: (x1: number, y1: number, x2: number, y2: number) => {
    const { boundaries } = get();
    const existingIndex = boundaries.findIndex(
      (b) => 
        (b.x1 === x1 && b.y1 === y1 && b.x2 === x2 && b.y2 === y2) ||
        (b.x1 === x2 && b.y1 === y2 && b.x2 === x1 && b.y2 === y1)
    );

    if (existingIndex >= 0) {
      set({ boundaries: boundaries.filter((_, i) => i !== existingIndex) });
    } else {
      set({ boundaries: [...boundaries, { x1, y1, x2, y2 }] });
    }
  },

  toggleCell: (x: number, y: number, type: 'star' | 'x') => {
    const { stars, xMarks } = get();
    if (type === 'star') {
      const existingIndex = stars.findIndex((s: Position) => s.x === x && s.y === y);
      if (existingIndex >= 0) {
        set({ stars: stars.filter((_: Position, i: number) => i !== existingIndex) });
      } else {
        set({ stars: [...stars, { x, y }] });
      }
    } else {
      const existingIndex = xMarks.findIndex((m: Position) => m.x === x && m.y === y);
      if (existingIndex >= 0) {
        set({ xMarks: xMarks.filter((_: Position, i: number) => i !== existingIndex) });
      } else {
        set({ xMarks: [...xMarks, { x, y }] });
      }
    }
  },

  reset: () => {
    set({ boundaries: [], stars: [], xMarks: [] });
  },

  validate: () => {
    const { stars } = get();
    const { toast } = useToast();

    // Validation logic for stars placement
    const isValid = validateStarPlacement(stars);

    toast({
      title: isValid ? "Puzzle Solved!" : "Invalid Solution",
      description: isValid 
        ? "Congratulations! All rules are satisfied."
        : "The current placement violates some rules.",
      variant: isValid ? "default" : "destructive",
    });
  },
}));

function validateStarPlacement(stars: Position[]): boolean {
  if (stars.length !== 20) { // 10x10 grid, 2 stars per row/column
    return false;
  }

  // Check rows
  for (let y = 0; y < 10; y++) {
    const starsInRow = stars.filter(s => s.y === y);
    if (starsInRow.length !== 2) return false;
  }

  // Check columns
  for (let x = 0; x < 10; x++) {
    const starsInColumn = stars.filter(s => s.x === x);
    if (starsInColumn.length !== 2) return false;
  }

  // Check adjacent stars
  for (const star of stars) {
    for (const other of stars) {
      if (star === other) continue;
      const dx = Math.abs(star.x - other.x);
      const dy = Math.abs(star.y - other.y);
      if (dx <= 1 && dy <= 1) return false;
    }
  }

  return true;
}