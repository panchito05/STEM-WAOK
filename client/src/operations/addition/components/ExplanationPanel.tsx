// ExplanationPanel.tsx - Componente para mostrar explicaciones de problemas
import React from 'react';
import { Problem } from '../types';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface ExplanationPanelProps {
  problem: Problem;
  onClose: () => void;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ problem, onClose }) => {
  const operands = problem.operands || [];
  const firstOperand = operands[0] || 0;
  const secondOperand = operands[1] || 0;
  
  return (
    <div className="explanation-panel bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
      <div className="flex items-center mb-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
        <h3 className="text-lg font-semibold text-amber-800">Explicación</h3>
      </div>
      
      <div className="explanation-content space-y-3">
        <p className="text-gray-700">
          Para sumar <span className="font-bold">{firstOperand}</span> y <span className="font-bold">{secondOperand}</span>, 
          podemos seguir estos pasos:
        </p>
        
        {firstOperand >= 10 || secondOperand >= 10 ? (
          // Explicación para números de 2 o más dígitos
          <div className="steps space-y-2">
            {/* Descomposición de números */}
            <div className="step bg-white p-3 rounded border border-amber-100">
              <p className="text-sm font-medium text-amber-800 mb-1">Paso 1: Descomponer los números</p>
              <div className="flex items-center">
                <div className="text-gray-700">
                  {firstOperand} = {Math.floor(firstOperand/10)*10} + {firstOperand % 10}
                </div>
              </div>
              <div className="flex items-center mt-1">
                <div className="text-gray-700">
                  {secondOperand} = {Math.floor(secondOperand/10)*10} + {secondOperand % 10}
                </div>
              </div>
            </div>
            
            {/* Suma de unidades */}
            <div className="step bg-white p-3 rounded border border-amber-100">
              <p className="text-sm font-medium text-amber-800 mb-1">Paso 2: Sumar las unidades</p>
              <div className="flex items-center">
                <div className="text-gray-700">
                  {firstOperand % 10} + {secondOperand % 10} = {(firstOperand % 10) + (secondOperand % 10)}
                </div>
              </div>
            </div>
            
            {/* Suma de decenas */}
            <div className="step bg-white p-3 rounded border border-amber-100">
              <p className="text-sm font-medium text-amber-800 mb-1">Paso 3: Sumar las decenas</p>
              <div className="flex items-center">
                <div className="text-gray-700">
                  {Math.floor(firstOperand/10)*10} + {Math.floor(secondOperand/10)*10} = {Math.floor(firstOperand/10)*10 + Math.floor(secondOperand/10)*10}
                </div>
              </div>
            </div>
            
            {/* Resultado final */}
            <div className="step bg-white p-3 rounded border border-green-200">
              <p className="text-sm font-medium text-green-800 mb-1">Paso 4: Sumar ambos resultados</p>
              <div className="flex items-center">
                <div className="text-gray-700">
                  {Math.floor(firstOperand/10)*10 + Math.floor(secondOperand/10)*10} + {(firstOperand % 10) + (secondOperand % 10)} = {firstOperand + secondOperand}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Explicación simple para números pequeños
          <div className="simple-explanation bg-white p-3 rounded border border-amber-100">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{firstOperand}</span>
              <span className="text-xl">+</span>
              <span className="text-2xl font-bold">{secondOperand}</span>
              <ArrowRight className="h-5 w-5 text-amber-500 mx-2" />
              <span className="text-2xl font-bold text-green-600">{firstOperand + secondOperand}</span>
            </div>
            <p className="text-gray-600 mt-2">
              Al sumar {firstOperand} unidades más {secondOperand} unidades, obtenemos un total de {firstOperand + secondOperand} unidades.
            </p>
          </div>
        )}
        
        <div className="conclusion mt-3">
          <p className="text-gray-700">
            La respuesta correcta es: <span className="font-bold text-green-600">{firstOperand + secondOperand}</span>
          </p>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-2 py-2 px-4 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default ExplanationPanel;