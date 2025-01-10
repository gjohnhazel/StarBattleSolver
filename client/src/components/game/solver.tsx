import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { useSolver } from "@/lib/solver-logic";

interface SolverProps {
  onClose: () => void;
}

export function Solver({ onClose }: SolverProps) {
  const { hints, currentHint, nextHint, prevHint, applyHint } = useSolver();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Available Hints</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[200px] rounded-md border p-4">
        {hints.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm">{hints[currentHint]?.description}</p>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={prevHint}
                disabled={currentHint === 0}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={nextHint}
                disabled={currentHint === hints.length - 1}
              >
                Next
              </Button>
            </div>

            <Button 
              className="w-full"
              onClick={() => applyHint(currentHint)}
            >
              Apply Hint
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hints available at the moment. Keep solving!
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
