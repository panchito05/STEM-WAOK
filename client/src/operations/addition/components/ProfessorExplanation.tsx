import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdditionProblem } from '../types';
import { DrawingCanvas } from '@/components/DrawingCanvas';

interface ProfessorExplanationProps {
  problem: AdditionProblem;
  currentProblemIndex: number;
  totalProblems: number;
  initialDrawing?: string;
  onSaveDrawing: (drawingData: string) => void;
  onContinue: () => void;
  onChangePosition?: () => void;
}

/**
 * Componente para la explicación del profesor con lienzo de dibujo
 * Responsabilidad: Gestionar el lienzo de dibujo y guardar la explicación
 */
export const ProfessorExplanation: React.FC<ProfessorExplanationProps> = ({
  problem,
  currentProblemIndex,
  totalProblems,
  initialDrawing,
  onSaveDrawing,
  onContinue,
  onChangePosition
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasPosition, setCanvasPosition] = useState<'right' | 'below'>('right');
  
  // Capturar la imagen del canvas cuando se guarda
  const handleSaveDrawing = () => {
    if (canvasRef.current) {
      const drawingData = canvasRef.current.toDataURL('image/png');
      onSaveDrawing(drawingData);
    }
  };

  // Cambiar posición del canvas al hacer clic en el botón
  const handleChangePosition = () => {
    setCanvasPosition(prev => prev === 'right' ? 'below' : 'right');
    if (onChangePosition) {
      onChangePosition();
    }
  };

  // Guardar automáticamente antes de continuar
  const handleContinue = () => {
    handleSaveDrawing();
    onContinue();
  };

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

      {/* Contenedor flexible que cambia según la posición */}
      <div className={`flex ${canvasPosition === 'below' ? 'flex-col' : 'flex-col md:flex-row'} gap-4`}>
        {/* Tarjeta del problema */}
        <Card className="border-2 border-primary flex-1">
          <CardContent className="pt-6">
            <div className="text-center text-2xl font-bold mb-4">
              {problem.operands[0]} + {problem.operands[1]} = {problem.correctAnswer}
            </div>
          </CardContent>
        </Card>

        {/* Canvas de dibujo */}
        <div className="flex-1 min-h-[300px]">
          <DrawingCanvas 
            ref={canvasRef}
            initialDrawing={initialDrawing}
            width={canvasPosition === 'right' ? 400 : 600}
            height={canvasPosition === 'right' ? 300 : 250}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <Button 
          onClick={handleContinue}
          variant="default"
          className="w-full md:w-auto"
        >
          {t('professorMode.finishExplanation')}
        </Button>
        
        <Button 
          onClick={handleChangePosition}
          variant="outline"
          className="w-full md:w-auto"
          data-testid="change-position-button"
        >
          {t('professorMode.changePosition')}
        </Button>
      </div>
    </div>
  );
};