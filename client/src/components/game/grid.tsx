import { useRef, useEffect, useState } from 'react';
import { useGameState } from '@/lib/game-state';

interface GridProps {
  mode: 'draw' | 'solve';
}

export function Grid({ mode }: GridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { gridState, toggleHorizontalBoundary, toggleVerticalBoundary, toggleCell } = useGameState();
  const [lastTap, setLastTap] = useState<{ time: number, row: number, col: number } | null>(null);

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

  return (
    <div 
      ref={gridRef}
      className="relative aspect-square w-full bg-background rounded-lg overflow-hidden"
    >
      {/* Base grid */}
      <div className="grid grid-cols-10 h-full w-full">
        {gridState.cells.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className="relative border border-gray-200"
              onClick={() => handleCellTap(rowIndex, colIndex)}
            >
              {/* Draw mode touch areas */}
              {mode === 'draw' && (
                <>
                  <div
                    className="absolute top-0 left-0 right-0 h-6 -translate-y-3
                      bg-primary/10 hover:bg-primary/20 transition-colors"
                    onTouchStart={(e) => handleBoundaryTap(e, 'horizontal', rowIndex, colIndex)}
                  />
                  <div
                    className="absolute top-0 left-0 bottom-0 w-6 -translate-x-3
                      bg-primary/10 hover:bg-primary/20 transition-colors"
                    onTouchStart={(e) => handleBoundaryTap(e, 'vertical', rowIndex, colIndex)}
                  />
                </>
              )}

              {/* Cell content */}
              <div className="absolute inset-0 flex items-center justify-center">
                {cell === 1 && (
                  <span className="text-2xl">★</span>
                )}
                {cell === 2 && (
                  <span className="text-2xl text-red-600">×</span>
                )}
              </div>
            </div>
          ))
        ))}
      </div>

      {/* Overlay for boundaries */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Horizontal boundaries */}
        {gridState.horizontal.map((row, rowIndex) => (
          row.map((isActive, colIndex) => (
            isActive && (
              <div
                key={`h-${rowIndex}-${colIndex}`}
                className={`absolute h-0.5 transition-all
                  ${mode === 'draw' 
                    ? 'bg-black' 
                    : 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                  }`}
                style={{
                  left: `${(colIndex * 100) / 10}%`,
                  width: `${100 / 10}%`,
                  top: `${(rowIndex * 100) / 10}%`,
                }}
              />
            )
          ))
        ))}

        {/* Vertical boundaries */}
        {gridState.vertical.map((row, rowIndex) => (
          row.map((isActive, colIndex) => (
            isActive && (
              <div
                key={`v-${rowIndex}-${colIndex}`}
                className={`absolute w-0.5 transition-all
                  ${mode === 'draw'
                    ? 'bg-black'
                    : 'bg-white shadow-[1px_0_2px_rgba(0,0,0,0.3)]'
                  }`}
                style={{
                  top: `${(rowIndex * 100) / 10}%`,
                  height: `${100 / 10}%`,
                  left: `${(colIndex * 100) / 10}%`,
                }}
              />
            )
          ))
        ))}
      </div>
    </div>
  );
}