import { create } from 'zustand';
import { useToast } from '@/hooks/use-toast';

interface GridState {
  cells: number[][];
  horizontal: boolean[][];
  vertical: boolean[][];
}

interface SavedPuzzle {
  id: string;
  timestamp: number;
  gridState: GridState;
}

interface GameState {
  gridState: GridState;
  toggleHorizontalBoundary: (row: number, col: number) => void;
  toggleVerticalBoundary: (row: number, col: number) => void;
  toggleCell: (row: number, col: number, type: 'star' | 'x') => void;
  reset: () => void;
  validateGrid: () => boolean;
  savePuzzle: () => void;
  loadPuzzle: (id: string) => void;
  loadMostRecent: () => void;
  getAllSavedPuzzles: () => SavedPuzzle[];
}

const STORAGE_KEY = 'star-battle-puzzles';

const initialState: GridState = {
  cells: Array(10).fill(null).map(() => Array(10).fill(0)),
  horizontal: Array(11).fill(null).map(() => Array(10).fill(false)),
  vertical: Array(10).fill(null).map(() => Array(11).fill(false))
};

const loadSavedPuzzles = (): SavedPuzzle[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved puzzles:', error);
    return [];
  }
};

const savePuzzlesToStorage = (puzzles: SavedPuzzle[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
  } catch (error) {
    console.error('Error saving puzzles:', error);
  }
};

export const useGameState = create<GameState>((set, get) => ({
  gridState: initialState,

  toggleHorizontalBoundary: (row: number, col: number) => {
    set(state => ({
      gridState: {
        ...state.gridState,
        horizontal: state.gridState.horizontal.map((r, i) =>
          i === row ? r.map((v, j) => j === col ? !v : v) : r
        )
      }
    }));
  },

  toggleVerticalBoundary: (row: number, col: number) => {
    set(state => ({
      gridState: {
        ...state.gridState,
        vertical: state.gridState.vertical.map((r, i) =>
          i === row ? r.map((v, j) => j === col ? !v : v) : r
        )
      }
    }));
  },

  toggleCell: (row: number, col: number, type: 'star' | 'x') => {
    set(state => ({
      gridState: {
        ...state.gridState,
        cells: state.gridState.cells.map((r, i) =>
          i === row ? r.map((v, j) =>
            j === col ? (v === (type === 'star' ? 1 : 2) ? 0 : (type === 'star' ? 1 : 2)) : v
          ) : r
        )
      }
    }));
  },

  reset: () => {
    set({ gridState: initialState });
  },

  validateGrid: () => {
    const { gridState } = get();
    const { cells } = gridState;

    // Check rows and columns
    for (let i = 0; i < 10; i++) {
      const rowStars = cells[i].filter(cell => cell === 1).length;
      const colStars = cells.map(row => row[i]).filter(cell => cell === 1).length;
      if (rowStars !== 2 || colStars !== 2) return false;
    }

    // Check adjacent stars
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if (cells[i][j] === 1) {
          // Check all 8 adjacent cells
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;
              const ni = i + di, nj = j + dj;
              if (ni >= 0 && ni < 10 && nj >= 0 && nj < 10) {
                if (cells[ni][nj] === 1) return false;
              }
            }
          }
        }
      }
    }

    return true;
  },

  savePuzzle: () => {
    const { gridState } = get();
    const toast = useToast();
    const puzzles = loadSavedPuzzles();

    const newPuzzle: SavedPuzzle = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      gridState
    };

    puzzles.push(newPuzzle);
    savePuzzlesToStorage(puzzles);
    toast.toast({
      title: "Puzzle saved",
      description: "Your current puzzle has been saved successfully.",
    });
  },

  loadPuzzle: (id: string) => {
    const puzzles = loadSavedPuzzles();
    const puzzle = puzzles.find(p => p.id === id);
    const toast = useToast();

    if (puzzle) {
      set({ gridState: puzzle.gridState });
      toast.toast({
        title: "Puzzle loaded",
        description: "The selected puzzle has been loaded successfully.",
      });
    }
  },

  loadMostRecent: () => {
    const puzzles = loadSavedPuzzles();
    if (puzzles.length > 0) {
      const mostRecent = puzzles.reduce((prev, current) => 
        prev.timestamp > current.timestamp ? prev : current
      );
      get().loadPuzzle(mostRecent.id);
    }
  },

  getAllSavedPuzzles: () => {
    return loadSavedPuzzles();
  }
}));