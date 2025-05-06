import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface DifficultyExampleProps {
  level: string;
  examples: string[];
}

function DifficultyExample({ level, examples }: DifficultyExampleProps) {
  const getLevelColorClass = (level: string) => {
    switch(level.toLowerCase()) {
      case 'beginner':
        return 'bg-blue-100 border-blue-500 text-blue-700';
      case 'elementary': 
        return 'bg-green-100 border-green-500 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'advanced':
        return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'expert':
        return 'bg-red-100 border-red-500 text-red-700';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  return (
    <Card className={`w-full border-2 ${getLevelColorClass(level)}`}>
      <CardContent className="p-4">
        <CardTitle className="text-lg font-bold mb-2">{level}</CardTitle>
        <div className="space-y-1">
          {examples.map((example, idx) => (
            <p key={idx} className="font-mono">{example}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DifficultyExamples({ operation = "addition" }: { operation?: string }) {
  // Ejemplos específicos para diferentes operaciones
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

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-4">Ejemplos de Dificultad</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <DifficultyExample level="Beginner" examples={operationExamples.beginner} />
        <DifficultyExample level="Elementary" examples={operationExamples.elementary} />
        <DifficultyExample level="Intermediate" examples={operationExamples.intermediate} />
        <DifficultyExample level="Advanced" examples={operationExamples.advanced} />
        <DifficultyExample level="Expert" examples={operationExamples.expert} />
      </div>
    </div>
  );
}