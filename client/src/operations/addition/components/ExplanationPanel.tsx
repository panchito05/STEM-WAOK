// ExplanationPanel.tsx - Componente para mostrar explicaciones de soluciones
import React from 'react';
import { Button } from '@/components/ui/button';
import { Problem } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ExplanationPanelProps {
  problem: Problem | null;
  userAnswer: string;
  onContinue: () => void;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  problem,
  userAnswer,
  onContinue
}) => {
  const { t } = useTranslation();
  
  if (!problem) {
    return (
      <div className="text-center">
        <p className="mb-4">No hay problema para explicar.</p>
        <Button onClick={onContinue}>Continuar</Button>
      </div>
    );
  }
  
  // Función para formatear la explicación con saltos de línea
  const formatExplanation = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };
  
  return (
    <div className="explanation-panel">
      <h3 className="text-xl font-bold mb-4">Explicación</h3>
      
      {/* Problema original */}
      <div className="problem-display bg-muted p-4 rounded-lg mb-4">
        <h4 className="font-medium mb-2">Problema:</h4>
        <div className="text-lg">
          {problem.operands?.join(' + ')} = {problem.correctAnswer}
        </div>
        <div className="mt-2 text-sm">
          <span className="font-medium">Tu respuesta:</span> {userAnswer}
        </div>
      </div>
      
      {/* Explicación detallada */}
      <div className="explanation-text bg-primary/5 p-4 rounded-lg mb-6">
        {problem.explanation ? (
          <div className="whitespace-pre-line">
            {formatExplanation(problem.explanation)}
          </div>
        ) : (
          <div>
            <p>Suma los números para obtener la respuesta correcta:</p>
            <p className="mt-2 font-medium">
              {problem.operands?.join(' + ')} = {problem.correctAnswer}
            </p>
          </div>
        )}
      </div>
      
      {/* Pasos adicionales para problemas complejos */}
      {problem.operands && problem.operands.length > 2 && !problem.explanation && (
        <div className="steps bg-primary/5 p-4 rounded-lg mb-6">
          <h4 className="font-medium mb-2">Pasos:</h4>
          <div className="space-y-2">
            {(() => {
              const steps = [];
              let runningSum = problem.operands[0];
              
              steps.push(
                <div key="start">
                  Empezamos con {problem.operands[0]}
                </div>
              );
              
              for (let i = 1; i < problem.operands.length; i++) {
                const nextNumber = problem.operands[i];
                const newSum = runningSum + nextNumber;
                
                steps.push(
                  <div key={i}>
                    {runningSum} + {nextNumber} = {newSum}
                  </div>
                );
                
                runningSum = newSum;
              }
              
              return steps;
            })()}
          </div>
        </div>
      )}
      
      {/* Consejos para recordar */}
      <div className="tips border border-primary/20 p-4 rounded-lg mb-6">
        <h4 className="font-medium mb-2">Consejos:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Recuerda sumar dígito por dígito cuando trabajes con números grandes.</li>
          <li>Puedes descomponer números para hacer la suma más fácil (ej: 8+7 = 8+2+5 = 10+5 = 15).</li>
          <li>Practica sumas básicas para mejorar tu velocidad.</li>
        </ul>
      </div>
      
      <div className="flex justify-center">
        <Button onClick={onContinue} className="min-w-[120px]">
          {t('exercise.continue')}
        </Button>
      </div>
    </div>
  );
};

export default ExplanationPanel;