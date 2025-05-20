// ExplanationPanel.tsx - Componente para mostrar explicaciones de problemas
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Problem } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ExplanationPanelProps {
  problem: Problem;
  isVisible: boolean;
}

/**
 * Componente que muestra una explicación detallada del problema actual
 */
export function ExplanationPanel({ problem, isVisible }: ExplanationPanelProps) {
  const { t } = useTranslation();
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <Card className="mt-4 bg-blue-50 border-blue-200 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-blue-700">
          {t('exercise.help')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <p className="text-gray-700">
            {problem.explanation || 
              `${t('exercise.explanation')}: ${problem.operands[0]} + ${problem.operands[1]} = ${problem.result}`}
          </p>
          
          {/* Visualización paso a paso de la suma */}
          {problem.hasRegrouping && (
            <div className="mt-2 pt-3 border-t border-blue-200">
              <h4 className="font-medium text-blue-700 mb-2">
                {t('exercise.stepByStep')}:
              </h4>
              <div className="font-mono bg-white p-3 rounded-md shadow-sm">
                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-500 mb-1">
                    {getCarryMarks(problem.operands[0], problem.operands[1])}
                  </div>
                  <div className="mb-1">
                    {problem.operands[0]}
                  </div>
                  <div className="flex items-center mb-1">
                    <span className="mr-1">+</span>
                    <span>{problem.operands[1]}</span>
                  </div>
                  <div className="border-t border-gray-400 pt-1">
                    {problem.result}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Genera las marcas de llevada para la visualización paso a paso
 */
function getCarryMarks(a: number, b: number): string {
  let carry = 0;
  let carryMarks = '';
  
  const aStr = a.toString();
  const bStr = b.toString();
  const maxLength = Math.max(aStr.length, bStr.length);
  
  // Añadir espacios a la izquierda para alinear
  const paddedLen = maxLength + 1; // +1 para el espacio adicional
  
  for (let i = 0; i < maxLength; i++) {
    const digitAIndex = aStr.length - 1 - i;
    const digitBIndex = bStr.length - 1 - i;
    
    const digitA = digitAIndex >= 0 ? parseInt(aStr[digitAIndex]) : 0;
    const digitB = digitBIndex >= 0 ? parseInt(bStr[digitBIndex]) : 0;
    
    const sum = digitA + digitB + carry;
    carry = sum >= 10 ? 1 : 0;
    
    // Añadir la marca de llevada si es necesario
    if (carry > 0) {
      carryMarks = '1' + carryMarks;
    } else {
      carryMarks = ' ' + carryMarks;
    }
  }
  
  return carryMarks.padStart(paddedLen, ' ');
}