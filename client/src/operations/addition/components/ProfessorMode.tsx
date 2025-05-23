import React from 'react';
import { AdditionProblem } from '../types';
import { ProfessorModeModular } from './professor';

interface ProfessorModeProps {
  problem: AdditionProblem;
  onClose: () => void;
  onCorrectAnswer: (wasCorrect: boolean) => void;
  showVerticalFormat?: boolean;
  settings: {
    maxAttempts: number;
    enableCompensation: boolean;
  };
}

// Componente wrapper que utiliza la nueva estructura modular
export const ProfessorMode: React.FC<ProfessorModeProps> = (props) => {
  return <ProfessorModeModular {...props} />;
};

export default ProfessorMode;