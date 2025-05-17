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
  // Eliminamos la entrada de "Addition (New)" ya que ahora usamos el módulo estándar
  // {
  //   id: "unifiedAddition",
  //   displayName: "Addition (New)",
  //   description: "Practice addition with our improved unified module",
  //   difficulty: "beginner",
  //   color: "#3b82f6", // Un azul diferente
  //   icon: "PlusCircle",
  // },
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

];

// Map operation IDs to their React components
export const operationComponents: Record<string, ModuleComponent> = {
  addition: Addition, // El módulo principal de adición
  fractions: Fractions,
  counting: Counting,
};
