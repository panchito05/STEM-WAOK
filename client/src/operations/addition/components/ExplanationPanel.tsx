// ExplanationPanel.tsx - Componente para mostrar explicaciones de problemas
import React from 'react';
import { Problem } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExplanationPanelProps {
  problem: Problem;
  userAnswer?: string | number;
  onContinue?: () => void;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ 
  problem, 
  userAnswer,
  onContinue 
}) => {
  const { t } = useTranslation();
  
  // Generar explicación paso a paso
  const generateExplanation = (): string[] => {
    // Si es un problema de texto, usar explicación personalizada
    if (problem.displayFormat === 'word') {
      return [
        t('explanation.wordProblemIntro'),
        t('explanation.extractNumbers', { numbers: problem.operands.join(', ') }),
        t('explanation.performAddition', { 
          operands: problem.operands.join(' + '),
          result: problem.correctAnswer
        })
      ];
    }
    
    // Para problemas numéricos - explicar suma paso a paso
    const steps: string[] = [];
    
    // Paso 1: Introducción
    steps.push(t('explanation.additionIntro', { 
      operands: problem.operands.join(' + ')
    }));
    
    // Si hay decimales, explicar alineación
    if (problem.allowDecimals) {
      steps.push(t('explanation.decimalAlignment'));
    }
    
    // Si hay más de 2 operandos, explicar agrupación
    if (problem.operands.length > 2) {
      steps.push(t('explanation.groupingNumbers'));
    }
    
    // Explicar el cálculo
    let partialSum = problem.operands[0];
    for (let i = 1; i < problem.operands.length; i++) {
      steps.push(t('explanation.addingNumbers', {
        current: partialSum,
        next: problem.operands[i],
        result: partialSum + problem.operands[i]
      }));
      partialSum += problem.operands[i];
    }
    
    // Conclusión
    steps.push(t('explanation.additionResult', {
      operands: problem.operands.join(' + '),
      result: problem.correctAnswer
    }));
    
    return steps;
  };
  
  const explanationSteps = generateExplanation();
  
  return (
    <div className="explanation-panel bg-primary-50 dark:bg-primary-950/30 p-4 rounded-lg mt-4">
      <h3 className="text-lg font-semibold mb-2">{t('explanation.title')}</h3>
      
      <div className="space-y-2">
        {explanationSteps.map((step, index) => (
          <p key={index} className="text-sm">
            {index + 1}. {step}
          </p>
        ))}
      </div>
      
      {onContinue && (
        <div className="mt-4 text-right">
          <Button onClick={onContinue} size="sm">
            {t('common.continue')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExplanationPanel;