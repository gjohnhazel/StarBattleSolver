import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/game/grid";
import { Controls } from "@/components/game/controls";
import { Solver } from "@/components/game/solver";
import { Card } from "@/components/ui/card";

type GameMode = 'draw' | 'solve';

export default function Home() {
  const [mode, setMode] = useState<GameMode>('draw');
  const [showHints, setShowHints] = useState(false);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Card className="p-4">
          <div className="flex gap-2 mb-4">
            <Button 
              variant={mode === 'draw' ? 'default' : 'outline'}
              onClick={() => setMode('draw')}
              className="flex-1"
            >
              Draw Mode
            </Button>
            <Button 
              variant={mode === 'solve' ? 'default' : 'outline'}
              onClick={() => setMode('solve')}
              className="flex-1"
            >
              Solve Mode
            </Button>
          </div>

          <Grid mode={mode} />

          <Controls mode={mode} onShowHints={() => setShowHints(true)} />
        </Card>

        {showHints && mode === 'solve' && (
          <Card className="p-4">
            <Solver onClose={() => setShowHints(false)} />
          </Card>
        )}
      </div>
    </div>
  );
}