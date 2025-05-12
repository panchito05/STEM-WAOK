import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface DifficultyExampleProps {
  level: string;
  examples: string[];
  active?: boolean;
  onClick?: () => void;
}

function DifficultyExample({ level, examples, active = false, onClick }: DifficultyExampleProps) {
  // Estilo para tarjetas basado en la imagen original
  // Color para la tarjeta activa (seleccionada) y no activa
  const activeClass = active 
    ? "bg-blue-100 border-blue-300 text-blue-800" 
    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300";

  return (
    <Card 
      className={`w-full border ${activeClass} transition-all cursor-pointer shadow-sm`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <CardTitle className="text-sm font-medium mb-2">{level}</CardTitle>
        <div className="space-y-1">
          {examples.map((example, idx) => (
            <p key={idx} className="font-mono text-xs text-gray-600">{example}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DifficultyExamples({ 
  operation = "addition", 
  activeDifficulty = "beginner", 
  onSelectDifficulty
}: { 
  operation?: string; 
  activeDifficulty?: string;
  onSelectDifficulty?: (difficulty: string) => void;
}) {
  // Ejemplos específicos para diferentes operaciones (coinciden exactamente con utils.ts)
  const examples = {
    addition: {
      beginner: ["1 + 8 = ?", "7 + 5 = ?"],
      elementary: ["12 + 15 = ?", "24 + 13 = ?"],
      intermediate: ["65 + 309 = ?", "392 + 132 = ?"],
      advanced: ["1247 + 3568 = ?", "5934 + 8742 = ?"],
      expert: ["70960 + 11650 = ?", "28730 + 59436 = ?"]
    },
    fractions: {
      beginner: ["1/4 + 2/4 = ?", "3/5 - 1/5 = ?"],
      elementary: ["2/3 + 1/6 = ?", "3/4 - 1/8 = ?"],
      intermediate: ["2/5 + 3/8 = ?", "4/7 compared to 5/9"],
      advanced: ["2 3/4 + 1 5/6 = ?", "3 1/3 - 1 2/5 = ?"],
      expert: ["5 2/3 ÷ 2 1/2 = ?", "3 3/4 × 2 2/5 = ?"]
    },
    counting: {
      beginner: ["Count to 5", "Count by 1s to 10"],
      elementary: ["Count by 2s to 20", "Count by 5s to 50"],
      intermediate: ["Count by 10s to 100", "Count from 15 to 30"],
      advanced: ["Count backwards from 30", "Count by 3s to 30"],
      expert: ["Count by 25s to 200", "Count backwards by 10s from 100"]
    }
  };

  const selectedOperation = operation in examples ? operation : "addition";
  const operationExamples = examples[selectedOperation as keyof typeof examples];

  // Si no hay función para cambiar dificultad, mostrar como solo lectura
  const handleClick = onSelectDifficulty ? onSelectDifficulty : undefined;
  
  return (
    <div className="w-full">
      {/* Eliminamos el título para que coincida con la imagen original */}
      <div className="flex flex-wrap gap-2">
        <DifficultyExample 
          level="Beginner"
          examples={operationExamples.beginner} 
          active={activeDifficulty === "beginner"}
          onClick={handleClick ? () => handleClick("beginner") : undefined}
        />
        <DifficultyExample 
          level="Elementary"
          examples={operationExamples.elementary} 
          active={activeDifficulty === "elementary"}
          onClick={handleClick ? () => handleClick("elementary") : undefined}
        />
        <DifficultyExample 
          level="Intermediate"
          examples={operationExamples.intermediate} 
          active={activeDifficulty === "intermediate"}
          onClick={handleClick ? () => handleClick("intermediate") : undefined}
        />
        <DifficultyExample 
          level="Advanced"
          examples={operationExamples.advanced} 
          active={activeDifficulty === "advanced"}
          onClick={handleClick ? () => handleClick("advanced") : undefined}
        />
        <DifficultyExample 
          level="Expert"
          examples={operationExamples.expert} 
          active={activeDifficulty === "expert"}
          onClick={handleClick ? () => handleClick("expert") : undefined}
        />
      </div>
    </div>
  );
}