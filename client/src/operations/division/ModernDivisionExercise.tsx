// ModernDivisionExercise.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Exercise from "./Exercise";
import { defaultModuleSettings } from "@/utils/operationComponents";

// Este componente envuelve el ejercicio de división y proporciona el contexto
const ModernDivisionExercise: React.FC = () => {
  const settings = {
    ...defaultModuleSettings,
    difficulty: 'beginner', 
    problemCount: 10,
    timeLimit: 'per-problem',
    timeValue: 30,
    showExplanations: true,
    language: 'spanish'
  };
  
  return (
    <Card className="w-full p-0 overflow-hidden">
      <CardContent className="p-6">
        <Exercise 
          settings={settings as any}
          onOpenSettings={() => {}}
        />
      </CardContent>
    </Card>
  );
};

export default ModernDivisionExercise;