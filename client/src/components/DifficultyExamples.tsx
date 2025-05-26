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
  onSelectDifficulty,
  language = "english" // Añadido parámetro para el idioma
}: { 
  operation?: string; 
  activeDifficulty?: string;
  onSelectDifficulty?: (difficulty: string) => void;
  language?: string; // Puede ser "english" o "spanish"
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
      beginner: ["9 - 3 = ?", "8 - 5 = ?"],
      elementary: ["25 - 13 = ?", "42 - 18 = ?"],
      intermediate: ["65 - 309 = ?", "392 - 132 = ?"],
      advanced: ["1247 - 3568 = ?", "5934 - 8742 = ?"],
      expert: ["70960 - 11650 = ?", "28730 - 59436 = ?"]
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
  
  // Traducción de los nombres de dificultad
  const difficultyNames = {
    english: {
      title: "Difficulty Examples",
      levels: {
        beginner: "Beginner",
        elementary: "Elementary",
        intermediate: "Intermediate",
        advanced: "Advanced",
        expert: "Expert"
      }
    },
    spanish: {
      title: "Ejemplos de Dificultad",
      levels: {
        beginner: "Principiante",
        elementary: "Elemental",
        intermediate: "Intermedio",
        advanced: "Avanzado",
        expert: "Experto"
      }
    }
  };

  // Determinar qué idioma usar
  const translations = language === "spanish" ? difficultyNames.spanish : difficultyNames.english;

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-4">{translations.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <DifficultyExample 
          level={translations.levels.beginner}
          examples={operationExamples.beginner} 
          active={activeDifficulty === "beginner"}
          onClick={handleClick ? () => handleClick("beginner") : undefined}
        />
        <DifficultyExample 
          level={translations.levels.elementary}
          examples={operationExamples.elementary} 
          active={activeDifficulty === "elementary"}
          onClick={handleClick ? () => handleClick("elementary") : undefined}
        />
        <DifficultyExample 
          level={translations.levels.intermediate}
          examples={operationExamples.intermediate} 
          active={activeDifficulty === "intermediate"}
          onClick={handleClick ? () => handleClick("intermediate") : undefined}
        />
        <DifficultyExample 
          level={translations.levels.advanced}
          examples={operationExamples.advanced} 
          active={activeDifficulty === "advanced"}
          onClick={handleClick ? () => handleClick("advanced") : undefined}
        />
        <DifficultyExample 
          level={translations.levels.expert}
          examples={operationExamples.expert} 
          active={activeDifficulty === "expert"}
          onClick={handleClick ? () => handleClick("expert") : undefined}
        />
      </div>
    </div>
  );
}