import React from 'react';
import { VisualObject } from '../types';

interface VisualProblemDisplayProps {
  visualObjects: VisualObject[];
  operands: number[];
}

const VisualProblemDisplay: React.FC<VisualProblemDisplayProps> = ({ visualObjects, operands }) => {
  const renderFruitGroup = (visual: VisualObject, index: number) => {
    const fruits = Array.from({ length: visual.count }, (_, i) => (
      <span key={i} className="text-3xl mr-1">
        {visual.emoji}
      </span>
    ));

    return (
      <div 
        key={index}
        className="inline-flex flex-col items-center mx-4 p-3 rounded-lg border-2 border-dashed border-gray-300"
        style={{ backgroundColor: visual.color }}
      >
        <div className="flex flex-wrap justify-center mb-2">
          {fruits}
        </div>
        <div className="text-lg font-bold text-gray-700">
          {visual.count}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Visualización con frutas */}
      <div className="flex justify-center items-center flex-wrap mb-6 p-4 bg-gray-50 rounded-lg">
        {visualObjects.map((visual, index) => (
          <React.Fragment key={index}>
            {renderFruitGroup(visual, index)}
            {index < visualObjects.length - 1 && (
              <div className="text-3xl font-bold text-gray-600 mx-2">
                +
              </div>
            )}
          </React.Fragment>
        ))}
        <div className="text-3xl font-bold text-gray-600 mx-2">
          =
        </div>
        <div className="text-2xl font-bold text-blue-600">
          ?
        </div>
      </div>
      {/* Explicación de agrupación con paréntesis visuales */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-3 text-center">
          💡 Propiedad Asociativa: Puedes agrupar de diferentes maneras
        </h4>
        
        {/* Forma 1 con agrupación visual */}
        <div className="mb-3">
          <div className="text-sm font-medium text-blue-800 mb-1">Forma 1:</div>
          <div className="flex items-center justify-center gap-1 text-lg">
            <span className="px-2 py-1 bg-green-100 border-2 border-green-400 rounded">
              ({operands[0]} + {operands[1]})
            </span>
            <span className="text-gray-600">+</span>
            <span className="px-2 py-1 bg-yellow-100 border border-gray-300 rounded">
              {operands[2]}
            </span>
            <span className="text-gray-600">=</span>
            <span className="px-2 py-1 bg-green-100 border-2 border-green-400 rounded">
              {operands[0] + operands[1]}
            </span>
            <span className="text-gray-600">+</span>
            <span className="px-2 py-1 bg-yellow-100 border border-gray-300 rounded">
              {operands[2]}
            </span>
            <span className="text-gray-600">=</span>
            <span className="font-bold text-blue-600">
              {operands[0] + operands[1] + operands[2]}
            </span>
          </div>
        </div>
        
        {/* Forma 2 con agrupación visual diferente */}
        <div>
          <div className="text-sm font-medium text-blue-800 mb-1">Forma 2:</div>
          <div className="flex items-center justify-center gap-1 text-lg">
            <span className="px-2 py-1 bg-yellow-100 border border-gray-300 rounded">
              {operands[0]}
            </span>
            <span className="text-gray-600">+</span>
            <span className="px-2 py-1 bg-purple-100 border-2 border-purple-400 rounded">
              ({operands[1]} + {operands[2]})
            </span>
            <span className="text-gray-600">=</span>
            <span className="px-2 py-1 bg-yellow-100 border border-gray-300 rounded">
              {operands[0]}
            </span>
            <span className="text-gray-600">+</span>
            <span className="px-2 py-1 bg-purple-100 border-2 border-purple-400 rounded">
              {operands[1] + operands[2]}
            </span>
            <span className="text-gray-600">=</span>
            <span className="font-bold text-blue-600">
              {operands[0] + operands[1] + operands[2]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualProblemDisplay;