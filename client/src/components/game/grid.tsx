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

    if (mode === 'draw') {
      setTouchStart({ x, y });
    } else {
      handleTap(x, y);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (mode === 'draw' && touchStart && svgRef.current) {
      const touch = e.changedTouches[0];
      const rect = svgRef.current.getBoundingClientRect();
      const endX = Math.floor(((touch.clientX - rect.left) / size.width) * 10);
      const endY = Math.floor(((touch.clientY - rect.top) / size.height) * 10);

      // Only create boundary if the end point is different and adjacent
      if ((Math.abs(endX - touchStart.x) === 1 && endY === touchStart.y) ||
          (Math.abs(endY - touchStart.y) === 1 && endX === touchStart.x)) {
        toggleBoundary(touchStart.x, touchStart.y, endX, endY);
      }
      setTouchStart(null);
    }
  };

  // Double tap detection for stars
  let lastTap = 0;
  const handleTap = (x: number, y: number) => {
    const now = Date.now();
    const doubleTapDelay = 300;

    if (lastTap && (now - lastTap) < doubleTapDelay) {
      // Double tap - place/remove star
      toggleCell(x, y, 'star');
    } else {
      // Single tap - place/remove X
      toggleCell(x, y, 'x');
    }

    lastTap = now;
  };

  const cellSize = size.width / 10;
  const strokeWidth = mode === 'draw' ? 1 : 2;
  const strokeColor = mode === 'draw' ? 'black' : 'white';

  return (
    <div className="relative aspect-square w-full">
      <svg 
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="touch-none bg-gray-900"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid lines */}
        {Array.from({ length: 11 }).map((_, i) => (
          <g key={i}>
            <line
              x1={i * cellSize}
              y1={0}
              x2={i * cellSize}
              y2={size.height}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="opacity-50"
            />
            <line
              x1={0}
              y1={i * cellSize}
              x2={size.width}
              y2={i * cellSize}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="opacity-50"
            />
          </g>
        ))}

        {/* Boundaries */}
        {boundaries.map((boundary: Boundary, i: number) => (
          <line
            key={i}
            x1={boundary.x1 * cellSize + cellSize/2}
            y1={boundary.y1 * cellSize + cellSize/2}
            x2={boundary.x2 * cellSize + cellSize/2}
            y2={boundary.y2 * cellSize + cellSize/2}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 2}
            className={`${mode === 'solve' ? 'drop-shadow-md' : ''}`}
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
            fill="white"
            fontSize={cellSize * 0.6}
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
          >
            ×
          </text>
        ))}
      </svg>
    </div>
  );
}