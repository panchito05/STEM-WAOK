import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { ExplanationPanelProps } from '../types';
import { useTranslation } from '../hooks/useTranslation';

/**
 * Panel de explicación para mostrar después de responder un problema
 */
const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  problem,
  userAnswer,
  isCorrect,
  onContinue
}) => {
  const { t } = useTranslation();
  
  // Generar una explicación paso a paso
  const generateExplanation = () => {
    const { operands } = problem;
    
    // Para problemas de suma simples
    if (operands.length === 2) {
      return (
        <div className="space-y-2">
          <p>
            {t('explanationStart', {
              defaultValue: 'Para sumar',
              values: { operand1: operands[0], operand2: operands[1] }
            })}:
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
            <p className="font-medium">
              {operands[0]} + {operands[1]} = {problem.correctAnswer}
            </p>
          </div>
          {!isCorrect && (
            <p className="text-red-500 dark:text-red-400">
              {t('explanationWrong', {
                defaultValue: 'Tú respondiste',
                values: { answer: userAnswer }
              })}.
            </p>
          )}
        </div>
      );
    }
    
    // Para problemas con más de dos operandos
    return (
      <div className="space-y-3">
        <p>{t('explanationMultipleOperands', { defaultValue: 'Para resolver este problema, sumamos todos los números:' })}</p>
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
          <p className="font-medium">
            {operands.join(' + ')} = {problem.correctAnswer}
          </p>
        </div>
        <p>
          {t('explanationStepByStep', { defaultValue: 'Paso a paso:' })}
        </p>
        {operands.slice(0, -1).map((operand, index) => {
          const nextOperand = operands[index + 1];
          const partialSum = operands.slice(0, index + 2).reduce((a, b) => a + b, 0);
          
          return (
            <div key={`step-${index}`} className="ml-4">
              <p>
                {index === 0 ? operand : partialSum - nextOperand} + {nextOperand} = {partialSum}
              </p>
            </div>
          );
        })}
        {!isCorrect && (
          <p className="text-red-500 dark:text-red-400 mt-2">
            {t('explanationWrong', {
              defaultValue: 'Tú respondiste',
              values: { answer: userAnswer }
            })}.
          </p>
        )}
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader className={isCorrect ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}>
        <CardTitle className="flex items-center">
          {isCorrect ? (
            <>
              <CheckCircle className="mr-2 h-6 w-6 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">
                {t('correct', { defaultValue: '¡Correcto!' })}
              </span>
            </>
          ) : (
            <>
              <XCircle className="mr-2 h-6 w-6 text-red-600 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400">
                {t('incorrect', { defaultValue: 'Incorrecto' })}
              </span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {generateExplanation()}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onContinue}>
          {t('continue', { defaultValue: 'Continuar' })}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExplanationPanel;