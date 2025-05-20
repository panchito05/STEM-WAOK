import React from 'react';
import { Check, X } from 'lucide-react';

// Interfaz específica para problemas de suma
interface AdditionProblem {
  id?: string;
  tipo?: string;
  displayText?: string;
  operands?: number[];
  operacion?: string;
  correctAnswer?: string;
  userAnswer?: any;
  isCorrect?: boolean;
  status?: string;
  level?: string;
  attempts?: number;
  timeSpent?: number;
  problem?: string; // Campo compatible para versiones antiguas
  info?: string;    // Campo compatible para versiones antiguas
}

interface AdditionProblemRendererProps {
  problems: AdditionProblem[];
  showProblemNumbers?: boolean;
}

const AdditionProblemRenderer: React.FC<AdditionProblemRendererProps> = ({ 
  problems, 
  showProblemNumbers = true
}) => {
  return (
    <div className="space-y-2">
      {problems.map((problem, index) => {
        // Determinar el texto a mostrar (usar displayText, problem, o construirlo desde operands)
        let displayText = '';
        if (problem.displayText) {
          displayText = problem.displayText;
        } else if (problem.problem) {
          displayText = problem.problem;
        } else if (problem.operands && problem.operands.length >= 2) {
          displayText = `${problem.operands[0]} ${problem.operacion || '+'} ${problem.operands[1]} = ${problem.correctAnswer}`;
        }
        
        // Determinar si es correcto
        const isCorrect = problem.isCorrect !== undefined ? problem.isCorrect : 
                         (problem.status === 'correct');
        
        // Crear información adicional
        const level = problem.level || '1';
        const levelDisplay = level === 'beginner' ? '1' : 
                            level === 'elementary' ? '2' : 
                            level === 'intermediate' ? '3' : 
                            level === 'advanced' ? '4' : 
                            level === 'expert' ? '5' : level;
        
        const infoText = problem.info || 
                        `Lvl: ${levelDisplay}, Att: ${problem.attempts || 1}, T: ${problem.timeSpent || 0}s`;
        
        return (
          <div 
            key={problem.id || index} 
            className={`p-3 rounded-lg ${isCorrect 
              ? 'bg-green-100 border border-green-200' 
              : 'bg-red-100 border border-red-200'}`}
          >
            <div className="flex justify-between items-center">
              <div>
                {showProblemNumbers && <span className="font-medium">(#{index + 1})</span>} {displayText}
                
                {/* Mostrar respuesta del usuario si fue incorrecta */}
                {!isCorrect && problem.userAnswer !== undefined && !isNaN(problem.userAnswer) && 
                  <span className="text-red-600 ml-2">({problem.userAnswer})</span>
                }
              </div>
              <div>
                {isCorrect 
                  ? <Check className="h-5 w-5 text-green-600" /> 
                  : <X className="h-5 w-5 text-red-600" />}
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {infoText}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdditionProblemRenderer;