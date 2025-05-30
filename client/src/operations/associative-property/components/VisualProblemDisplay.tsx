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

      {/* Explicación de agrupación */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">
          💡 Propiedad Asociativa: Puedes agrupar de diferentes maneras
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>
            Forma 1: ({operands[0]} + {operands[1]}) + {operands[2]} = {operands[0] + operands[1]} + {operands[2]} = {operands[0] + operands[1] + operands[2]}
          </div>
          <div>
            Forma 2: {operands[0]} + ({operands[1]} + {operands[2]}) = {operands[0]} + {operands[1] + operands[2]} = {operands[0] + operands[1] + operands[2]}
          </div>
        </div>
      </div>

      {/* Problema numérico */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-800 mb-4">
          {operands.join(' + ')} = 
        </div>
      </div>
    </div>
  );
};

export default VisualProblemDisplay;