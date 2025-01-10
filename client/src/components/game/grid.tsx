import { useRef, useEffect, useState } from 'react';
import { useGameState } from '@/lib/game-state';
import type { Position, Boundary } from '@/lib/game-state';

interface GridProps {
  mode: 'draw' | 'solve';
}

export function Grid({ mode }: GridProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { boundaries, stars, xMarks, toggleBoundary, toggleCell } = useGameState();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [touchStart, setTouchStart] = useState<Position | null>(null);
  const [touchHighlight, setTouchHighlight] = useState<Position | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [lastTapPosition, setLastTapPosition] = useState<Position | null>(null);

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current) {
        const width = svgRef.current.clientWidth;
        setSize({ width, height: width }); // Keep square aspect ratio
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Touch handling
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = svgRef.current!.getBoundingClientRect();
    const x = Math.floor(((touch.clientX - rect.left) / size.width) * 10);
    const y = Math.floor(((touch.clientY - rect.top) / size.height) * 10);

    setTouchHighlight({ x, y });

    if (mode === 'draw') {
      setTouchStart({ x, y });
    } else {
      // Handle tap in solve mode
      const now = Date.now();
      const doubleTapDelay = 300; // ms

      if (lastTapPosition && 
          lastTapPosition.x === x && 
          lastTapPosition.y === y && 
          (now - lastTapTime) < doubleTapDelay) {
        // Double tap - place/remove star
        toggleCell(x, y, 'star');
        setLastTapTime(0);
        setLastTapPosition(null);
      } else {
        // First tap - place/remove X
        toggleCell(x, y, 'x');
        setLastTapTime(now);
        setLastTapPosition({ x, y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || mode !== 'draw') return;

    e.preventDefault();
    const touch = e.touches[0];
    const rect = svgRef.current!.getBoundingClientRect();
    const x = Math.floor(((touch.clientX - rect.left) / size.width) * 10);
    const y = Math.floor(((touch.clientY - rect.top) / size.height) * 10);

    setTouchHighlight({ x, y });

    // Only create boundary if moved to an adjacent cell
    if ((Math.abs(x - touchStart.x) === 1 && y === touchStart.y) ||
        (Math.abs(y - touchStart.y) === 1 && x === touchStart.x)) {
      toggleBoundary(touchStart.x, touchStart.y, x, y);
      setTouchStart({ x, y }); // Update start position for continuous drawing
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouchHighlight(null);
    setTouchStart(null);
  };

  const cellSize = size.width / 10;
  const strokeWidth = mode === 'draw' ? 2 : 3;
  const strokeColor = mode === 'draw' ? '#000' : '#fff';

  return (
    <div className="relative aspect-square w-full">
      <svg 
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="touch-none bg-gray-100 rounded-lg"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid cells for touch targets */}
        {Array.from({ length: 100 }).map((_, i) => {
          const x = Math.floor(i / 10);
          const y = i % 10;
          return (
            <rect
              key={`cell-${i}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="transparent"
              className={touchHighlight && touchHighlight.x === x && touchHighlight.y === y 
                ? 'fill-primary/20 transition-colors duration-200'
                : ''}
            />
          );
        })}

        {/* Grid lines */}
        {Array.from({ length: 11 }).map((_, i) => (
          <g key={i}>
            <line
              x1={i * cellSize}
              y1={0}
              x2={i * cellSize}
              y2={size.height}
              stroke={strokeColor}
              strokeWidth={1}
              className="opacity-30"
            />
            <line
              x1={0}
              y1={i * cellSize}
              x2={size.width}
              y2={i * cellSize}
              stroke={strokeColor}
              strokeWidth={1}
              className="opacity-30"
            />
          </g>
        ))}

        {/* Boundaries */}
        {boundaries.map((boundary: Boundary, i: number) => (
          <line
            key={i}
            x1={boundary.x1 * cellSize}
            y1={boundary.y1 * cellSize}
            x2={boundary.x2 * cellSize}
            y2={boundary.y2 * cellSize}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className={`${mode === 'solve' ? 'drop-shadow-md' : ''} transition-all duration-200`}
          />
        ))}

        {/* Stars and X marks */}
        {stars.map((pos: Position, i: number) => (
          <text
            key={`star-${i}`}
            x={pos.x * cellSize + cellSize/2}
            y={pos.y * cellSize + cellSize/2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="black"
            fontSize={cellSize * 0.6}
            className="transition-all duration-200"
          >
            ★
          </text>
        ))}

        {xMarks.map((pos: Position, i: number) => (
          <text
            key={`x-${i}`}
            x={pos.x * cellSize + cellSize/2}
            y={pos.y * cellSize + cellSize/2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="red"
            fontSize={cellSize * 0.6}
            className="transition-all duration-200"
          >
            ×
          </text>
        ))}
      </svg>
    </div>
  );
}