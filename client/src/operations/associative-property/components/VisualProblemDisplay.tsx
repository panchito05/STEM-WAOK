import React, { useState, useEffect } from 'react';
import { VisualObject } from '../types';

interface VisualProblemDisplayProps {
  visualObjects: VisualObject[];
  operands: number[];
  difficulty?: string;
}

const VisualProblemDisplay: React.FC<VisualProblemDisplayProps> = ({ visualObjects, operands, difficulty = 'beginner' }) => {
  const [shuffledObjects, setShuffledObjects] = useState<VisualObject[]>(visualObjects);

  // Función para mezclar el array
  const shuffleArray = (array: VisualObject[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Efecto para cambiar posiciones cada 5 segundos
  useEffect(() => {
    setShuffledObjects(visualObjects);
    
    const interval = setInterval(() => {
      setShuffledObjects(prev => shuffleArray(prev));
    }, 5000);

    return () => clearInterval(interval);
  }, [visualObjects]);
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

  const renderAssociativeExplanation = () => {
    if (operands.length < 3) return null;

    return (
      null
    );
  };

  // Renderizado específico por nivel de dificultad
  if (difficulty === 'beginner') {
    return (
      <div className="w-full">
        {/* Texto explicativo centrado */}
        <div className="text-center mb-4">
          <p className="text-lg font-medium text-gray-700">
            Puedes agrupar de diferentes maneras y el resultado siempre será el mismo
          </p>
        </div>
        {/* Visualización con frutas para principiantes */}
        <div className="flex justify-center items-center flex-wrap mb-6 p-4 bg-gray-50 rounded-lg transition-all duration-1000 ease-in-out">
          {shuffledObjects.map((visual, index) => (
            <React.Fragment key={`${visual.emoji}-${visual.count}-${index}`}>
              {renderFruitGroup(visual, index)}
              {index < shuffledObjects.length - 1 && (
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
        {renderAssociativeExplanation()}
      </div>
    );
  }

  if (difficulty === 'elementary') {
    return (
      <div className="w-full">
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-green-800 mb-2">
              🔢 Nivel Elemental: Introducción Numérica con Sumas
            </h4>
            <p className="text-sm text-green-700">
              Observa cómo el resultado es el mismo aunque cambie el agrupamiento
            </p>
          </div>
          {renderAssociativeExplanation()}
        </div>
      </div>
    );
  }

  if (difficulty === 'intermediate') {
    return (
      <div className="w-full">
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-purple-800 mb-2">
              🎯 Nivel Intermedio: Aplicar la Propiedad en Ejercicios Guiados
            </h4>
            <p className="text-sm text-purple-700">
              Completa los espacios usando diferentes agrupaciones
            </p>
          </div>
          {renderAssociativeExplanation()}
        </div>
      </div>
    );
  }

  // Para niveles avanzados, no mostrar visualización
  return null;
};

export default VisualProblemDisplay;