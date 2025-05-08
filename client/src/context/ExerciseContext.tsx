import { createContext, ReactNode, useContext, useState } from "react";

interface ExerciseContextType {
  isExerciseActive: boolean;
  setExerciseActive: (active: boolean) => void;
}

const ExerciseContext = createContext<ExerciseContextType | null>(null);

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const [isExerciseActive, setIsExerciseActive] = useState(false);

  const setExerciseActive = (active: boolean) => {
    setIsExerciseActive(active);
  };

  return (
    <ExerciseContext.Provider
      value={{
        isExerciseActive,
        setExerciseActive,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercise() {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error("useExercise must be used within an ExerciseProvider");
  }
  return context;
}