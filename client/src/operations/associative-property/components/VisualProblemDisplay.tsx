import React, { useState, useEffect } from 'react';
import { VisualObject } from '../types';

interface VisualProblemDisplayProps {
  visualObjects: VisualObject[];
  operands: number[];
  difficulty?: string;
}

const VisualProblemDisplay: React.FC<VisualProblemDisplayProps> = ({ visualObjects, operands, difficulty = 'beginner' }) => {
  const [shuffledObjects, setShuffledObjects] = useState<VisualObject[]>(visualObjects);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [currentGrouping, setCurrentGrouping] = useState<'first' | 'second'>('first');

  // Función para mezclar el array
  const shuffleArray = (array: VisualObject[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Efecto para cambiar posiciones con intervalos crecientes: 10s, 20s, 30s, 40s
  useEffect(() => {
    setShuffledObjects(visualObjects);
    setShuffleCount(0);
    setCurrentGrouping('first');
    
    const scheduleNextShuffle = (count: number) => {
      if (count >= 4) return;
      
      // Intervalos: 10s, 20s, 30s, 40s
      const intervals = [10000, 20000, 30000, 40000];
      const delay = intervals[count];
      
      setTimeout(() => {
        setShuffleCount(count + 1);
        setCurrentGrouping(prev => prev === 'first' ? 'second' : 'first');
        if (difficulty === 'beginner') {
          setShuffledObjects(prev => shuffleArray(prev));
        }
        scheduleNextShuffle(count + 1);
      }, delay);
    };
    
    scheduleNextShuffle(0);
  }, [visualObjects, difficulty]);
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

  const renderAnimatedGrouping = () => {
    if (operands.length < 3) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
        <div className="flex items-center justify-center gap-3 text-2xl transition-all duration-1000 ease-in-out">
          {currentGrouping === 'first' ? (
            <>
              <span className="px-3 py-2 bg-green-100 border-3 border-green-400 rounded-lg font-bold transform scale-105 shadow-md">
                ({operands[0]} + {operands[1]})
              </span>
              <span className="text-gray-600 font-bold">+</span>
              <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                {operands[2]}
              </span>
              <span className="text-gray-600 font-bold">=</span>
              <span className="text-gray-400 font-bold">?</span>
            </>
          ) : (
            <>
              <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                {operands[0]}
              </span>
              <span className="text-gray-600 font-bold">+</span>
              <span className="px-3 py-2 bg-purple-100 border-3 border-purple-400 rounded-lg font-bold transform scale-105 shadow-md">
                ({operands[1]} + {operands[2]})
              </span>
              <span className="text-gray-600 font-bold">=</span>
              <span className="text-gray-400 font-bold">?</span>
            </>
          )}
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {shuffleCount < 4 ? `Ciclo ${shuffleCount + 1} de 4` : 'Demostración completada'}
          </p>
        </div>
      </div>
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
        <div className="text-center text-gray-600">
          Resultado: {operands.reduce((sum, op) => sum + op, 0)}
        </div>
      </div>
    );
  }

  if (difficulty === 'elementary') {
    return (
      <div className="w-full">
        <div className="text-center mb-4">
          <p className="text-lg font-medium text-gray-700">Observa cómo cambia la agrupación automáticamente y el resultado siempre será el mismo</p>
        </div>
        {renderAnimatedGrouping()}
      </div>
    );
  }

  if (difficulty === 'intermediate') {
    return (
      <div className="w-full">
        <div className="text-center mb-4">
          <p className="text-lg font-medium text-gray-700">
            Completa las ecuaciones con la propiedad asociativa
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-lg text-center">
            ({operands[0]} + {operands[1]}) + {operands[2]} = ? y {operands[0]} + ({operands[1]} + {operands[2]}) = ?
          </div>
        </div>
      </div>
    );
  }

  // Para otros niveles, mostrar una versión básica
  return (
    <div className="w-full">
      <div className="text-center text-lg">
        ({operands[0]} + {operands[1]}) + {operands[2]} = {operands[0]} + ({operands[1]} + {operands[2]})
      </div>
    </div>
  );
};

export default VisualProblemDisplay;