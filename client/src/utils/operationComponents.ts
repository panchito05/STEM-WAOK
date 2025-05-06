import * as Addition from "../operations/addition";
import * as Subtraction from "../operations/subtraction";
import * as Multiplication from "../operations/multiplication";
import * as Division from "../operations/division";
import * as Fractions from "../operations/fractions";
import { ModuleSettings } from "@/context/SettingsContext";

export interface Module {
  id: string;
  displayName: string;
  description: string;
  difficulty: string;
  comingSoon?: boolean;
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
  problemCount: 10,
  timeLimit: "none",
  timeValue: 30,
  showImmediateFeedback: true,
  enableSoundEffects: true,
  showSolution: false,
};

// List of all operation modules
export const operationModules: Module[] = [
  {
    id: "addition",
    displayName: "Addition",
    description: "Practice addition with various difficulty levels",
    difficulty: "beginner",
  },
  {
    id: "subtraction",
    displayName: "Subtraction",
    description: "Master subtraction with interactive exercises",
    difficulty: "beginner",
  },
  {
    id: "multiplication",
    displayName: "Multiplication",
    description: "Learn multiplication tables and solve problems",
    difficulty: "intermediate",
  },
  {
    id: "division",
    displayName: "Division",
    description: "Practice division with step-by-step guidance",
    difficulty: "intermediate",
  },
  {
    id: "fractions",
    displayName: "Fractions",
    description: "Learn to add, subtract, and compare fractions",
    difficulty: "advanced",
  },
  {
    id: "decimals",
    displayName: "Decimals",
    description: "Coming soon! Decimal operations and conversions",
    difficulty: "coming-soon",
    comingSoon: true,
  },
];

// Map operation IDs to their React components
export const operationComponents: Record<string, ModuleComponent> = {
  addition: Addition,
  subtraction: Subtraction,
  multiplication: Multiplication,
  division: Division,
  fractions: Fractions,
};
