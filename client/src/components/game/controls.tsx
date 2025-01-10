import { Button } from "@/components/ui/button";
import { useGameState } from "@/lib/game-state";
import { useToast } from "@/hooks/use-toast";
import { 
  Lightbulb,
  RotateCcw,
  Check
} from "lucide-react";

interface ControlsProps {
  mode: 'draw' | 'solve';
  onShowHints: () => void;
}

export function Controls({ mode, onShowHints }: ControlsProps) {
  const { reset, validateGrid } = useGameState();
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

  return (
    <div className="flex gap-2 mt-4">
      <Button 
        variant="outline" 
        onClick={reset}
        className="flex-1"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>

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