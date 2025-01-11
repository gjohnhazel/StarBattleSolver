import { Button } from "@/components/ui/button";
import { useGameState } from "@/lib/game-state";
import { useToast } from "@/hooks/use-toast";
import { 
  Lightbulb,
  RotateCcw,
  Check,
  BookOpen
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { examplePuzzles } from "@/lib/example-puzzles";

interface ControlsProps {
  mode: 'draw' | 'solve';
  onShowHints: () => void;
}

export function Controls({ mode, onShowHints }: ControlsProps) {
  const { reset, validateGrid, loadExamplePuzzle } = useGameState();
  const { toast } = useToast();

  const handleValidate = () => {
    const isValid = validateGrid();
    toast({
      title: isValid ? "Puzzle Solved!" : "Invalid Solution",
      description: isValid 
        ? "Congratulations! All rules are satisfied."
        : "The current placement violates some rules. Try using hints for help.",
      variant: isValid ? "default" : "destructive",
    });
  };

  const handleReset = () => {
    // Preserve boundaries only in solve mode
    reset(mode === 'solve');
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <Button 
        variant="outline" 
        onClick={handleReset}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <BookOpen className="w-4 h-4 mr-2" />
            Load Example
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {examplePuzzles.map((puzzle) => (
            <DropdownMenuItem
              key={puzzle.id}
              onClick={() => loadExamplePuzzle(puzzle.id)}
            >
              {puzzle.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>


      {mode === 'solve' && (
        <>
          <Button
            variant="outline"
            onClick={onShowHints}
            className="flex-1"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Hints
          </Button>

          <Button
            onClick={handleValidate}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Validate
          </Button>
        </>
      )}
    </div>
  );
}