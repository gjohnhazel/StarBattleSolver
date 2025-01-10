import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Target,
  Brain
} from "lucide-react";
import { useSolver } from "@/lib/solver-logic";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SolverProps {
  onClose: () => void;
}

const DeductionTypeBadge = ({ type }: { type: string }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'basic': return 'bg-blue-500';
      case 'pattern': return 'bg-purple-500';
      case 'area': return 'bg-green-500';
      case 'multi-unit': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'basic': return <Lightbulb className="w-3 h-3" />;
      case 'pattern': return <Target className="w-3 h-3" />;
      case 'area': return <Brain className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Badge className={`${getTypeColor()} flex items-center gap-1`}>
      {getTypeIcon()}
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
};

export function Solver({ onClose }: SolverProps) {
  const { 
    deductions, 
    currentDeduction, 
    nextDeduction, 
    prevDeduction, 
    applyDeduction, 
    generateDeductions 
  } = useSolver();

  useEffect(() => {
    generateDeductions();
  }, [generateDeductions]);

  const currentHint = deductions[currentDeduction];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Logical Deductions</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        {deductions.length > 0 ? (
          <Card className="m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <DeductionTypeBadge type={currentHint.type} />
                <Badge variant={currentHint.certainty === 'definite' ? 'default' : 'secondary'}>
                  {currentHint.certainty === 'definite' ? 'Certain' : 'Possible'}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2">{currentHint.description}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {currentHint.explanation}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentHint.affected.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Affected positions: {currentHint.affected.map(pos => 
                      `(${pos.row + 1}, ${pos.col + 1})`
                    ).join(', ')}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevDeduction}
                    disabled={currentDeduction === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    {currentDeduction + 1} of {deductions.length}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextDeduction}
                    disabled={currentDeduction === deductions.length - 1}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => applyDeduction(currentDeduction)}
                  disabled={currentHint.affected.length === 0}
                >
                  Apply Deduction
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No deductions available at the moment. The puzzle might be solved or require more initial placements.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}