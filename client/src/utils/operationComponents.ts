import * as Addition from "../operations/addition";
import * as Fractions from "../operations/fractions";
import * as Counting from "../operations/counting";
import { ModuleSettings } from "@/context/SettingsContext";

export interface Module {
  id: string;
  displayName: string;
  description: string;
  difficulty: string;
  comingSoon?: boolean;
  color?: string;
  icon?: string;
}

export interface ModuleComponent {
  Exercise: React.ComponentType<{
    settings: ModuleSettings;
    onOpenSettings: () => void;
  }>;
  Settings: React.ComponentType<{
    settings: ModuleSettings;
    onBack: () => void;
  }>;
}

export const defaultModuleSettings: ModuleSettings = {
  difficulty: "beginner",
  problemCount: 12,
  timeLimit: "per-problem",
  timeValue: 0, // 0 para sin límite
  maxAttempts: 2, // Por defecto, 3 intentos por problema
  showImmediateFeedback: true,
  enableSoundEffects: true,
  showAnswerWithExplanation: true, // Botón de ayuda que muestra respuesta con explicación
  enableAdaptiveDifficulty: true, // Ajusta automáticamente la dificultad según desempeño
  enableCompensation: true, // Añade problemas adicionales por respuestas incorrectas/reveladas
  enableRewards: true, // Activar sistema de recompensas/premios
  rewardType: "stars", // Tipo de premio a mostrar (medals, trophies, stars)
};

// List of all operation modules
export const operationModules: Module[] = [
  {
    id: "addition",
    displayName: "Addition",
    description: "Practice addition with various difficulty levels",
    difficulty: "beginner",
    color: "#4287f5", // Azul vivo como en la imagen
    icon: "Plus",
  },
  {
    id: "unifiedAddition",
    displayName: "Addition (New)",
    description: "Practice addition with our improved unified module",
    difficulty: "beginner",
    color: "#3b82f6", // Un azul diferente
    icon: "PlusCircle",
  },
  {
    id: "fractions",
    displayName: "Fractions",
    description: "Learn to add, subtract, and compare fractions",
    difficulty: "advanced",
    color: "#ff5c57", // Rojo-naranja
    icon: "PieChart",
  },
  // Los módulos de Alphabet han sido eliminados
  {
    id: "counting",
    displayName: "Counting Numbers",
    description: "Practice counting with fun visualization",
    difficulty: "beginner",
    color: "#4299e1", // Azul claro como en la imagen
    icon: "Hash",
  },
  {
    id: "combinedOperations",
    displayName: "Combined Operations",
    description: "Practice operations with PEMDAS/BODMAS rules",
    difficulty: "advanced",
    color: "#10b981", // Verde como en la imagen
    icon: "Calculator",
  },
  {
    id: "numberConversions",
    displayName: "Number Conversions",
    description: "Convert between fractions, decimals, and percentages",
    difficulty: "intermediate",
    color: "#8b5cf6", // Púrpura
    icon: "ArrowLeftRight",
  },
  {
    id: "geometry",
    displayName: "Geometry",
    description: "Calculate area and perimeter of shapes",
    difficulty: "intermediate",
    color: "#6b7280", // Gris
    icon: "Square",
  },
  {
    id: "equivalentFractions",
    displayName: "Equivalent Fractions",
    description: "Find equivalent fractions with specified denominators",
    difficulty: "intermediate",
    color: "#10b981", // Verde
    icon: "Percent",
  },
  {
    id: "fractionReducer",
    displayName: "Fraction Reducer",
    description: "Reduce fractions to their simplest form",
    difficulty: "intermediate",
    color: "#ff7900", // Naranja como en la imagen
    icon: "Percent",
  },
  {
    id: "factFamilies",
    displayName: "Fact Families",
    description: "Practice related addition/subtraction and multiplication/division facts",
    difficulty: "intermediate",
    color: "#f59e0b", // Amarillo/Naranja como en la imagen
    icon: "Triangle",
  },
  {
    id: "fractionTypes",
    displayName: "Fraction Types",
    description: "Learn to identify and differentiate between proper fractions, improper fractions, and mixed numbers",
    difficulty: "intermediate",
    color: "#10b981", // Verde como en la imagen
    icon: "Percent",
  },
  {
    id: "decimals",
    displayName: "Decimals",
    description: "Coming soon! Decimal operations and conversions",
    difficulty: "coming-soon",
    comingSoon: true,
    color: "#6b7280", // Gris
    icon: "Percent",
  },
];

// Map operation IDs to their React components
export const operationComponents: Record<string, ModuleComponent> = {
  addition: Addition, // Mantenemos el módulo original por compatibilidad
  // Usamos el mismo módulo de addition también para unifiedAddition
  unifiedAddition: Addition,
  fractions: Fractions,
  counting: Counting,
};
