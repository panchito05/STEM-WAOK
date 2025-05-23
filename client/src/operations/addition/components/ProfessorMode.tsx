import React from 'react';
import { AdditionProblem } from '../types';
import { ProfessorModeEnhanced } from './professor/ProfessorModeEnhanced';

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

// Componente wrapper que utiliza la nueva arquitectura mejorada
export const ProfessorMode: React.FC<ProfessorModeProps> = (props) => {
  return <ProfessorModeEnhanced {...props} />;
};

export default ProfessorMode;