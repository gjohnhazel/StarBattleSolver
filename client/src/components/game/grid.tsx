import { useRef, useState, useEffect } from 'react';
import { useGameState } from '@/lib/game-state';
import { useToast } from '@/hooks/use-toast';

interface GridProps {
  mode: 'draw' | 'solve';
}

export function Grid({ mode }: GridProps) {
  const { gridState, toggleHorizontalBoundary, toggleVerticalBoundary, toggleCell, loadMostRecent, savePuzzle } = useGameState();
  const [lastTap, setLastTap] = useState<{ time: number, row: number, col: number } | null>(null);
  const { toast } = useToast();

  // Load most recent puzzle on component mount
  useEffect(() => {
    try {
      loadMostRecent();
    } catch (error) {
      console.error('Error loading most recent puzzle:', error);
      toast({
        title: "Error",
        description: "Failed to load the most recent puzzle.",
        variant: "destructive"
      });
    }
  }, []);

  const handleBoundaryTap = (
    event: React.TouchEvent,
    type: 'horizontal' | 'vertical',
    row: number,
    col: number
  ) => {
    event.stopPropagation();
    if (mode === 'draw') {
      if (type === 'horizontal') {
        toggleHorizontalBoundary(row, col);
      } else {
        toggleVerticalBoundary(row, col);
      }
    }
  };

  const handleCellTap = (row: number, col: number) => {
    if (mode !== 'solve') return;

    const now = Date.now();
    if (lastTap && 
        lastTap.row === row && 
        lastTap.col === col && 
        now - lastTap.time < 300) {
      // Double tap - place/remove star
      toggleCell(row, col, 'star');
      setLastTap(null);
    } else {
      // Single tap - place/remove X
      toggleCell(row, col, 'x');
      setLastTap({ time: now, row, col });
    }
  };

  const handleSave = () => {
    try {
      const savedPuzzle = savePuzzle();
      toast({
        title: "Success",
        description: "Your puzzle has been saved.",
      });
    } catch (error) {
      console.error('Error saving puzzle:', error);
      toast({
        title: "Error",
        description: "Failed to save the puzzle.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full aspect-square">
      <div className="grid grid-cols-10 h-full">
        {gridState.cells.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className={`relative border border-gray-200 touch-manipulation
                ${mode === 'draw' ? 'bg-gray-50' : ''}`}
              onClick={() => handleCellTap(rowIndex, colIndex)}
            >
              {/* Boundary drawing areas */}
              {mode === 'draw' && (
                <>
                  <div
                    className="absolute top-0 left-0 right-0 h-4 -translate-y-2
                      bg-gray-200 bg-opacity-50 hover:bg-opacity-75 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBoundaryTap(e as any, 'horizontal', rowIndex, colIndex);
                    }}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-4 translate-y-2
                      bg-gray-200 bg-opacity-50 hover:bg-opacity-75 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBoundaryTap(e as any, 'horizontal', rowIndex + 1, colIndex);
                    }}
                  />
                  <div
                    className="absolute top-0 left-0 bottom-0 w-4 -translate-x-2
                      bg-gray-200 bg-opacity-50 hover:bg-opacity-75 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBoundaryTap(e as any, 'vertical', rowIndex, colIndex);
                    }}
                  />
                  <div
                    className="absolute top-0 right-0 bottom-0 w-4 translate-x-2
                      bg-gray-200 bg-opacity-50 hover:bg-opacity-75 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBoundaryTap(e as any, 'vertical', rowIndex, colIndex + 1);
                    }}
                  />
                </>
              )}

              {/* Cell content */}
              <div className="absolute inset-0 flex items-center justify-center">
                {cell === 1 && <span className="text-2xl">★</span>}
                {cell === 2 && <span className="text-2xl text-red-600">×</span>}
              </div>

              {/* Boundary lines */}
              {gridState.horizontal[rowIndex]?.[colIndex] && (
                <div
                  className={`absolute top-0 left-0 right-0 h-0.5
                    ${mode === 'draw' ? 'bg-black' : 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)]'}`}
                />
              )}
              {gridState.horizontal[rowIndex + 1]?.[colIndex] && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5
                    ${mode === 'draw' ? 'bg-black' : 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)]'}`}
                />
              )}
              {gridState.vertical[rowIndex]?.[colIndex] && (
                <div
                  className={`absolute top-0 left-0 bottom-0 w-0.5
                    ${mode === 'draw' ? 'bg-black' : 'bg-white shadow-[1px_0_2px_rgba(0,0,0,0.3)]'}`}
                />
              )}
              {gridState.vertical[rowIndex]?.[colIndex + 1] && (
                <div
                  className={`absolute top-0 right-0 bottom-0 w-0.5
                    ${mode === 'draw' ? 'bg-black' : 'bg-white shadow-[1px_0_2px_rgba(0,0,0,0.3)]'}`}
                />
              )}
            </div>
          ))
        ))}
      </div>
      <button onClick={handleSave}>Save Puzzle</button>
    </div>
  );
}