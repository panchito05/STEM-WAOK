import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AdditionProblem } from '../types';

interface StudentAnswerCaptureProps {
  problem: AdditionProblem;
  currentProblemIndex: number;
  totalProblems: number;
  drawing?: string;
  onSubmitAnswer: (answer: number) => void;
  onRevealAnswer: () => void;
}

/**
 * Componente para capturar la respuesta del estudiante
 * Responsabilidad: Gestionar el input de respuesta y validación
 */
export const StudentAnswerCapture: React.FC<StudentAnswerCaptureProps> = ({
  problem,
  currentProblemIndex,
  totalProblems,
  drawing,
  onSubmitAnswer,
  onRevealAnswer
}) => {
  const { t } = useTranslation();
  const [answerInput, setAnswerInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Validar y enviar la respuesta
  const handleSubmitAnswer = () => {
    // Validar que la respuesta sea un número
    const numericAnswer = Number(answerInput);
    if (isNaN(numericAnswer)) {
      setErrorMessage(t('exercises.enterValidNumber'));
      return;
    }

    // Enviar la respuesta
    setErrorMessage('');
    onSubmitAnswer(numericAnswer);
    setAnswerInput(''); // Limpiar el input después de enviar
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

      <div className="flex flex-col md:flex-row gap-4">
        {/* Tarjeta del problema */}
        <Card className="border-2 border-primary flex-1">
          <CardContent className="pt-6">
            <div className="text-center text-2xl font-bold mb-4">
              {problem.operands[0]} + {problem.operands[1]} = ?
            </div>
          </CardContent>
        </Card>

        {/* Si hay dibujo, mostrarlo */}
        {drawing && (
          <div className="flex-1">
            <Card>
              <CardContent className="pt-6">
                <img 
                  src={drawing} 
                  alt={t('professorMode.explanationDrawing')} 
                  className="max-w-full h-auto"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Input para la respuesta */}
      <div className="mt-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              type="number"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder={t('exercises.enterAnswer')}
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmitAnswer();
                }
              }}
            />
            <Button onClick={handleSubmitAnswer} className="min-w-[100px]">
              {t('common.verify')}
            </Button>
          </div>
          
          {/* Mensaje de error */}
          {errorMessage && (
            <div className="text-destructive text-sm mt-1">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* Botón para revelar respuesta */}
      <div className="flex justify-center mt-2">
        <Button 
          onClick={onRevealAnswer} 
          variant="outline" 
          className="text-sm"
        >
          {t('exercises.revealAnswer')}
        </Button>
      </div>
    </div>
  );
};