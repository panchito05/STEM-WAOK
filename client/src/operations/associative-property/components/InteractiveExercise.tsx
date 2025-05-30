import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface InteractiveExerciseProps {
  operands: number[];
  onAnswer: (answers: number[]) => void;
}

const InteractiveExercise: React.FC<InteractiveExerciseProps> = ({ operands, onAnswer }) => {
  const [form1Answer, setForm1Answer] = useState<string>('');
  const [form2Blank1, setForm2Blank1] = useState<string>('');
  const [form2Blank2, setForm2Blank2] = useState<string>('');
  const [form2Answer, setForm2Answer] = useState<string>('');

  const handleSubmit = () => {
    const answers = [
      parseFloat(form1Answer) || 0,
      parseFloat(form2Blank1) || 0,
      parseFloat(form2Blank2) || 0,
      parseFloat(form2Answer) || 0
    ];
    onAnswer(answers);
  };

  const expectedForm1Answer = operands[0] + operands[1];
  const expectedForm2Sum = operands[1] + operands[2];

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
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-3 text-center">
            💡 Propiedad Asociativa: Puedes agrupar de diferentes maneras
          </h4>
          
          {/* Forma 1 con agrupación visual */}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 text-lg flex-wrap">
              <span className="text-sm font-medium text-blue-800">Forma 1:</span>
              <span className="px-2 py-1 bg-green-100 border-2 border-green-400 rounded">
                ({operands[0]} + {operands[1]})
              </span>
              <span className="text-gray-600">+</span>
              <span className="px-2 py-1 bg-yellow-100 border border-gray-300 rounded">
                {operands[2]}
              </span>
              <span className="text-gray-600">=</span>
              <span className="px-2 py-1 bg-green-100 border-2 border-green-400 rounded">
                {expectedForm1Answer}
              </span>
              <span className="text-gray-600">+</span>
              <span className="px-2 py-1 bg-yellow-100 border border-gray-300 rounded">
                {operands[2]}
              </span>
              <span className="text-gray-600">=</span>
              <Input
                type="number"
                value={form1Answer}
                onChange={(e) => setForm1Answer(e.target.value)}
                className="w-16 h-8 text-center text-blue-600 font-bold"
                placeholder="?"
              />
            </div>
          </div>
          
          {/* Forma 2 con agrupación visual diferente */}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 text-lg flex-wrap">
              <span className="text-sm font-medium text-blue-800">Forma 2:</span>
              <span className="px-2 py-1 bg-yellow-100 border border-gray-300 rounded">
                {operands[0]}
              </span>
              <span className="text-gray-600">+</span>
              <span className="px-2 py-1 bg-purple-100 border-2 border-purple-400 rounded">
                (
                <Input
                  type="number"
                  value={form2Blank1}
                  onChange={(e) => setForm2Blank1(e.target.value)}
                  className="w-12 h-6 text-center inline mx-1"
                  placeholder="?"
                />
                +
                <Input
                  type="number"
                  value={form2Blank2}
                  onChange={(e) => setForm2Blank2(e.target.value)}
                  className="w-12 h-6 text-center inline mx-1"
                  placeholder="?"
                />
                )
              </span>
              <span className="text-gray-600">=</span>
              <span className="px-2 py-1 bg-yellow-100 border border-gray-300 rounded">
                {operands[0]}
              </span>
              <span className="text-gray-600">+</span>
              <span className="px-2 py-1 bg-purple-100 border-2 border-purple-400 rounded">
                {expectedForm2Sum}
              </span>
              <span className="text-gray-600">=</span>
              <Input
                type="number"
                value={form2Answer}
                onChange={(e) => setForm2Answer(e.target.value)}
                className="w-16 h-8 text-center text-blue-600 font-bold"
                placeholder="?"
              />
            </div>
          </div>

          <div className="text-center mt-4">
            <Button 
              onClick={handleSubmit}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Verificar Respuestas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveExercise;