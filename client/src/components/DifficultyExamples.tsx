import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface DifficultyExampleProps {
  level: string;
  examples: string[];
  active?: boolean;
  onClick?: () => void;
}

function DifficultyExample({ level, examples, active = false, onClick }: DifficultyExampleProps) {
  // Color para la tarjeta activa (seleccionada) y no activa
  const activeClass = active 
    ? "bg-blue-900 border-blue-700 text-white" 
    : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:scale-105";

  return (
    <Card 
      className={`w-full border border-gray-700 ${activeClass} transition-all cursor-pointer`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <CardTitle className="text-lg font-medium mb-2">{level}</CardTitle>
        <div className="space-y-1 mt-2">
          {examples.map((example, idx) => (
            <p key={idx} className="font-mono text-sm">{example}</p>
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
    subtraction: {
      beginner: ["9 - 4 = ?", "7 - 3 = ?"],
      elementary: ["15 - 8 = ?", "24 - 17 = ?"],
      intermediate: ["156 - 89 = ?", "342 - 164 = ?"],
      advanced: ["5467 - 3982 = ?", "7000 - 3456 = ?"],
      expert: ["80540 - 25763 = ?", "100000 - 45678 = ?"]
    },
    multiplication: {
      beginner: ["2 × 3 = ?", "5 × 4 = ?"],
      elementary: ["6 × 7 = ?", "9 × 8 = ?"],
      intermediate: ["12 × 15 = ?", "23 × 18 = ?"],
      advanced: ["34 × 57 = ?", "125 × 43 = ?"],
      expert: ["347 × 256 = ?", "589 × 742 = ?"]
    },
    division: {
      beginner: ["6 ÷ 2 = ?", "8 ÷ 4 = ?"],
      elementary: ["15 ÷ 3 = ?", "24 ÷ 6 = ?"],
      intermediate: ["72 ÷ 9 = ?", "125 ÷ 5 = ?"],
      advanced: ["196 ÷ 14 = ?", "374 ÷ 11 = ?"],
      expert: ["2856 ÷ 24 = ?", "9317 ÷ 37 = ?"]
    }
  };

  const selectedOperation = operation in examples ? operation : "addition";
  const operationExamples = examples[selectedOperation as keyof typeof examples];

  // Si no hay función para cambiar dificultad, mostrar como solo lectura
  const handleClick = onSelectDifficulty ? onSelectDifficulty : undefined;
  
  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-4">Difficulty Examples</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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