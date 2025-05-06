import * as Addition from "../operations/addition";
import * as Subtraction from "../operations/subtraction";
import * as Multiplication from "../operations/multiplication";
import * as Division from "../operations/division";
import * as Fractions from "../operations/fractions";
import * as Alphabet from "../operations/alphabet";
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
    id: "alphabet",
    displayName: "Alphabet Learning",
    description: "Learn the alphabet with interactive exercises",
    difficulty: "beginner",
  },
  {
    id: "counting",
    displayName: "Counting Numbers",
    description: "Practice counting with fun visualization",
    difficulty: "beginner",
  },
  {
    id: "combinedOperations",
    displayName: "Combined Operations",
    description: "Practice operations with PEMDAS/BODMAS rules",
    difficulty: "advanced",
  },
  {
    id: "numberConversions",
    displayName: "Number Conversions",
    description: "Convert between fractions, decimals, and percentages",
    difficulty: "intermediate",
  },
  {
    id: "geometry",
    displayName: "Geometry",
    description: "Calculate area and perimeter of shapes",
    difficulty: "intermediate",
  },
  {
    id: "equivalentFractions",
    displayName: "Equivalent Fractions",
    description: "Find equivalent fractions with specified denominators",
    difficulty: "intermediate",
  },
  {
    id: "fractionReducer",
    displayName: "Fraction Reducer",
    description: "Reduce fractions to their simplest form",
    difficulty: "intermediate",
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
  alphabet: Alphabet,
};
