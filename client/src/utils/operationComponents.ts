import * as Addition from "../operations/addition";
import * as Subtraction from "../operations/subtraction";
import * as AdditionCopy from "../operations/additioncopy";
import * as AdditionCopy2 from "../operations/additioncopy2";
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
    id: "subtraction",
    displayName: "Subtraction",
    description: "Practice subtraction with various difficulty levels",
    difficulty: "beginner",
    color: "#ef4444", // Rojo para distinguir de suma
    icon: "Minus",
  },
  {
    id: "additioncopy",
    displayName: "Multiplication",
    description: "Practice multiplication with various difficulty levels",
    difficulty: "beginner",
    color: "#10b981", // Verde para distinguir de otros módulos
    icon: "X",
  },
  {
    id: "additioncopy2",
    displayName: "División",
    description: "Practice division with various difficulty levels",
    difficulty: "beginner",
    color: "#8b5cf6", // Violeta para distinguir de otros módulos
    icon: "DivideIcon",
  },

];

// Map operation IDs to their React components
export const operationComponents: Record<string, ModuleComponent> = {
  addition: Addition, // El módulo principal de adición
  subtraction: Subtraction, // El módulo de resta
  additioncopy: AdditionCopy, // El módulo copia de adición
  additioncopy2: AdditionCopy2, // El segundo módulo copia de adición
};
