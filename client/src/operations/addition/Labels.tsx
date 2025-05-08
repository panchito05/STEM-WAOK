import { DifficultyLevel } from "./types";

interface DifficultyLabelProps {
  difficulty: DifficultyLevel;
}

export function DifficultyLabel({ difficulty }: DifficultyLabelProps) {
  // Color y símbolo basado en la dificultad
  const getColorAndSymbol = () => {
    switch (difficulty) {
      case "beginner":
        return {
          symbol: "●",
          text: "Nivel: Principiante",
          className: "bg-blue-100 text-blue-800 border-blue-200"
        };
      case "elementary":
        return {
          symbol: "●",
          text: "Nivel: Elemental",
          className: "bg-emerald-100 text-emerald-800 border-emerald-200"
        };
      case "intermediate":
        return {
          symbol: "●",
          text: "Nivel: Intermedio",
          className: "bg-orange-100 text-orange-800 border-orange-200"
        };
      case "advanced":
        return {
          symbol: "●",
          text: "Nivel: Avanzado",
          className: "bg-purple-100 text-purple-800 border-purple-200"
        };
      case "expert":
        return {
          symbol: "●",
          text: "Nivel: Experto",
          className: "bg-gray-100 text-gray-800 border-gray-500"
        };
      default:
        return {
          symbol: "○",
          text: "Nivel: Desconocido",
          className: "bg-indigo-100 text-indigo-800 border-indigo-200"
        };
    }
  };

  const { symbol, text, className } = getColorAndSymbol();

  return (
    <div className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center border ${className}`}>
      <span className="mr-1">{symbol}</span> {text}
    </div>
  );
}