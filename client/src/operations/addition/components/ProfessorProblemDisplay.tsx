import React from 'react';
import { useTranslation } from 'react-i18next';
import { AdditionProblem } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProfessorProblemDisplayProps {
  problem: AdditionProblem;
  currentProblemIndex: number;
  totalProblems: number;
  onExplain: () => void;
  onSkip: () => void;
}

/**
 * Componente para mostrar el problema en el modo profesor
 * Responsabilidad: Mostrar el problema actual y botones de acción
 */
export const ProfessorProblemDisplay: React.FC<ProfessorProblemDisplayProps> = ({
  problem,
  currentProblemIndex,
  totalProblems,
  onExplain,
  onSkip
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {/* Contador de problemas */}
      <div className="text-center mb-2">
        <span className="text-sm font-medium">
          {t('exercises.problemCounter', { 
            current: currentProblemIndex + 1, 
            total: totalProblems 
          })}
        </span>
      </div>

      {/* Tarjeta del problema */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-6">
          <div className="text-center text-2xl font-bold mb-4">
            {problem.operands[0]} + {problem.operands[1]} = ?
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-center gap-4 mt-4">
        <Button 
          onClick={onExplain}
          variant="default"
          className="w-full md:w-auto"
        >
          {t('professorMode.startExplanation')}
        </Button>
        
        <Button 
          onClick={onSkip}
          variant="outline"
          className="w-full md:w-auto"
        >
          {t('common.skip')}
        </Button>
      </div>
    </div>
  );
};