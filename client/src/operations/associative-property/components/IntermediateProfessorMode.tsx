import React from 'react';
import { AssociativePropertyProblem } from '../types';

interface IntermediateProfessorModeProps {
  problem: AssociativePropertyProblem;
  showAnswers?: boolean;
}

const IntermediateProfessorMode: React.FC<IntermediateProfessorModeProps> = ({
  problem,
  showAnswers = false
}) => {
  const { operands, grouping1, grouping2 } = problem;
  const [a, b, c] = operands;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Título principal */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700 mb-2">
          Practica la Propiedad Asociativa
        </h2>
        <p className="text-gray-600 text-sm">
          Completa los espacios en blanco para resolver ambas agrupaciones
        </p>
      </div>

      {/* Contenedor de las dos agrupaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Primera agrupación - fondo verde */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4 text-center">
            Primera agrupación
          </h3>
          
          {/* Expresión original */}
          <div className="flex items-center justify-center mb-6 text-xl">
            <span className="text-gray-600">(</span>
            <div className="mx-2 px-3 py-2 bg-green-200 rounded-md font-bold text-green-800">
              {a}
            </div>
            <span className="mx-2 text-gray-600">+</span>
            <div className="mx-2 px-3 py-2 bg-green-300 rounded-md font-bold text-green-800">
              {b}
            </div>
            <span className="text-gray-600">)</span>
            <span className="mx-2 text-gray-600">+</span>
            <div className="mx-2 px-3 py-2 bg-blue-200 rounded-md font-bold text-blue-800">
              {c}
            </div>
          </div>

          {/* Primer paso: resolver el paréntesis */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2 text-center">
              Primero resuelve el paréntesis:
            </p>
            <div className="flex items-center justify-center text-lg">
              <div className="mx-2 px-4 py-2 border-2 border-gray-300 bg-white rounded-md min-w-[50px] text-center">
                {showAnswers ? grouping1?.leftSum : ''}
              </div>
              <span className="mx-2 text-gray-600">+</span>
              <div className="mx-2 px-3 py-2 bg-blue-200 rounded-md font-bold text-blue-800">
                {c}
              </div>
            </div>
          </div>

          {/* Resultado final */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2 text-center">
              Resultado final:
            </p>
            <div className="flex items-center justify-center text-lg">
              <span className="mx-2 text-gray-600">=</span>
              <div className="mx-2 px-4 py-2 border-2 border-gray-300 bg-white rounded-md min-w-[50px] text-center">
                {showAnswers ? grouping1?.totalSum : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Segunda agrupación - fondo morado */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-700 mb-4 text-center">
            Segunda agrupación
          </h3>
          
          {/* Expresión original */}
          <div className="flex items-center justify-center mb-6 text-xl">
            <div className="mx-2 px-3 py-2 bg-blue-200 rounded-md font-bold text-blue-800">
              {a}
            </div>
            <span className="mx-2 text-gray-600">+</span>
            <span className="text-gray-600">(</span>
            <div className="mx-2 px-3 py-2 bg-purple-200 rounded-md font-bold text-purple-800">
              {b}
            </div>
            <span className="mx-2 text-gray-600">+</span>
            <div className="mx-2 px-3 py-2 bg-purple-300 rounded-md font-bold text-purple-800">
              {c}
            </div>
            <span className="text-gray-600">)</span>
          </div>

          {/* Primer paso: resolver el paréntesis */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2 text-center">
              Primero resuelve el paréntesis:
            </p>
            <div className="flex items-center justify-center text-lg">
              <div className="mx-2 px-3 py-2 bg-blue-200 rounded-md font-bold text-blue-800">
                {a}
              </div>
              <span className="mx-2 text-gray-600">+</span>
              <div className="mx-2 px-4 py-2 border-2 border-gray-300 bg-white rounded-md min-w-[50px] text-center">
                {showAnswers ? grouping2?.rightSum : ''}
              </div>
            </div>
          </div>

          {/* Resultado final */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2 text-center">
              Resultado final:
            </p>
            <div className="flex items-center justify-center text-lg">
              <span className="mx-2 text-gray-600">=</span>
              <div className="mx-2 px-4 py-2 border-2 border-gray-300 bg-white rounded-md min-w-[50px] text-center">
                {showAnswers ? grouping2?.totalSum : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de conclusión */}
      {showAnswers && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-center text-blue-800 font-medium">
            ¡Ambos resultados son iguales! Esto demuestra la propiedad asociativa: 
            el resultado no cambia sin importar cómo agrupes los números.
          </p>
        </div>
      )}
    </div>
  );
};

export default IntermediateProfessorMode;