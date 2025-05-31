import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Check, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssociativePropertyProblem } from '../types';

interface ProgressiveGroupingDisplayProps {
  problem: AssociativePropertyProblem;
  onComplete: (finalAnswer: number) => void;
}

type Step = 'intro' | 'grouping1' | 'grouping2' | 'comparison' | 'complete';

const ProgressiveGroupingDisplay: React.FC<ProgressiveGroupingDisplayProps> = ({
  problem,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [showStepDetails, setShowStepDetails] = useState(false);
  const [grouping1Result, setGrouping1Result] = useState<number | null>(null);
  const [grouping2Result, setGrouping2Result] = useState<number | null>(null);

  const { operands, grouping1, grouping2 } = problem;
  const [a, b, c] = operands;

  // Auto-advance step details after animation
  useEffect(() => {
    if (currentStep !== 'intro' && currentStep !== 'complete') {
      const timer = setTimeout(() => setShowStepDetails(true), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleNextStep = () => {
    setShowStepDetails(false);
    
    switch (currentStep) {
      case 'intro':
        setCurrentStep('grouping1');
        break;
      case 'grouping1':
        if (grouping1) {
          setGrouping1Result(grouping1.totalSum);
        }
        setCurrentStep('grouping2');
        break;
      case 'grouping2':
        if (grouping2) {
          setGrouping2Result(grouping2.totalSum);
        }
        setCurrentStep('comparison');
        break;
      case 'comparison':
        setCurrentStep('complete');
        onComplete(problem.correctAnswer);
        break;
    }
  };

  const handlePrevStep = () => {
    setShowStepDetails(false);
    
    switch (currentStep) {
      case 'grouping1':
        setCurrentStep('intro');
        break;
      case 'grouping2':
        setCurrentStep('grouping1');
        break;
      case 'comparison':
        setCurrentStep('grouping2');
        break;
      case 'complete':
        setCurrentStep('comparison');
        break;
    }
  };

  const renderIntroStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">
          Demostraremos la Propiedad Asociativa
        </h2>
        <div className="text-lg text-gray-700 mb-4">
          Vamos a resolver: <span className="font-mono text-xl text-blue-600">{a} + {b} + {c}</span>
        </div>
        <p className="text-gray-600">
          Veremos que cambiar los paréntesis no altera el resultado
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-green-800 font-semibold mb-2">Primera agrupación</div>
            <div className="text-lg font-mono">({a} + {b}) + {c}</div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <div className="text-purple-800 font-semibold mb-2">Segunda agrupación</div>
            <div className="text-lg font-mono">{a} + ({b} + {c})</div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  const renderGrouping1Step = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <Card className="border-green-300 bg-gradient-to-r from-green-50 to-green-100">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-green-800 mb-4 text-center">
            Primera agrupación: ({a} + {b}) + {c}
          </h3>
          
          <div className="space-y-4">
            {/* Paso 1: Mostrar la expresión original */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="inline-flex items-center space-x-2 text-2xl font-mono">
                <span className="text-green-600">(</span>
                <span className="bg-green-200 px-3 py-1 rounded">{a}</span>
                <span>+</span>
                <span className="bg-green-200 px-3 py-1 rounded">{b}</span>
                <span className="text-green-600">)</span>
                <span>+</span>
                <span className="bg-blue-200 px-3 py-1 rounded">{c}</span>
              </div>
            </motion.div>

            {showStepDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Flecha hacia abajo */}
                <div className="text-center">
                  <ArrowDown className="mx-auto text-green-600 h-6 w-6" />
                </div>

                {/* Paso 2: Resolver el paréntesis */}
                <div className="text-center">
                  <div className="text-gray-600 mb-2">Primero resolvemos el paréntesis:</div>
                  <div className="inline-flex items-center space-x-2 text-2xl font-mono">
                    <span className="bg-green-300 px-4 py-2 rounded-lg font-bold">
                      {grouping1?.leftSum}
                    </span>
                    <span>+</span>
                    <span className="bg-blue-200 px-3 py-1 rounded">{c}</span>
                  </div>
                </div>

                {/* Flecha hacia abajo */}
                <div className="text-center">
                  <ArrowDown className="mx-auto text-green-600 h-6 w-6" />
                </div>

                {/* Paso 3: Resultado final */}
                <div className="text-center">
                  <div className="text-gray-600 mb-2">Resultado final:</div>
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center space-x-2 text-3xl font-mono"
                  >
                    <span className="bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                      {grouping1?.totalSum}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderGrouping2Step = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <Card className="border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">
            Segunda agrupación: {a} + ({b} + {c})
          </h3>
          
          <div className="space-y-4">
            {/* Paso 1: Mostrar la expresión original */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="inline-flex items-center space-x-2 text-2xl font-mono">
                <span className="bg-blue-200 px-3 py-1 rounded">{a}</span>
                <span>+</span>
                <span className="text-purple-600">(</span>
                <span className="bg-purple-200 px-3 py-1 rounded">{b}</span>
                <span>+</span>
                <span className="bg-purple-200 px-3 py-1 rounded">{c}</span>
                <span className="text-purple-600">)</span>
              </div>
            </motion.div>

            {showStepDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Flecha hacia abajo */}
                <div className="text-center">
                  <ArrowDown className="mx-auto text-purple-600 h-6 w-6" />
                </div>

                {/* Paso 2: Resolver el paréntesis */}
                <div className="text-center">
                  <div className="text-gray-600 mb-2">Primero resolvemos el paréntesis:</div>
                  <div className="inline-flex items-center space-x-2 text-2xl font-mono">
                    <span className="bg-blue-200 px-3 py-1 rounded">{a}</span>
                    <span>+</span>
                    <span className="bg-purple-300 px-4 py-2 rounded-lg font-bold">
                      {grouping2?.rightSum}
                    </span>
                  </div>
                </div>

                {/* Flecha hacia abajo */}
                <div className="text-center">
                  <ArrowDown className="mx-auto text-purple-600 h-6 w-6" />
                </div>

                {/* Paso 3: Resultado final */}
                <div className="text-center">
                  <div className="text-gray-600 mb-2">Resultado final:</div>
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center space-x-2 text-3xl font-mono"
                  >
                    <span className="bg-gradient-to-r from-purple-400 to-purple-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                      {grouping2?.totalSum}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderComparisonStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="space-y-6"
    >
      <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
        <CardContent className="p-6">
          <h3 className="text-2xl font-bold text-amber-800 mb-6 text-center">
            ¡Los resultados son iguales!
          </h3>
          
          <div className="space-y-6">
            {/* Mostrar ambos resultados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-green-700 font-semibold mb-2">Primera agrupación</div>
                <div className="text-lg font-mono mb-2">({a} + {b}) + {c}</div>
                <div className="bg-green-500 text-white px-6 py-3 rounded-xl text-2xl font-bold">
                  {grouping1Result}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="text-purple-700 font-semibold mb-2">Segunda agrupación</div>
                <div className="text-lg font-mono mb-2">{a} + ({b} + {c})</div>
                <div className="bg-purple-500 text-white px-6 py-3 rounded-xl text-2xl font-bold">
                  {grouping2Result}
                </div>
              </motion.div>
            </div>

            {/* Símbolo de igualdad */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <div className="text-6xl font-bold text-amber-600">=</div>
              <div className="text-xl text-amber-700 font-semibold mt-2">
                ¡La propiedad asociativa funciona!
              </div>
            </motion.div>

            {/* Conclusión */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="bg-amber-100 rounded-lg p-4 text-center border border-amber-200"
            >
              <div className="text-amber-800 font-semibold">
                No importa cómo agrupemos los números, el resultado es el mismo: <span className="text-2xl font-bold">{problem.correctAnswer}</span>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderCompleteStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="text-center space-y-6"
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center"
      >
        <Check className="text-white h-10 w-10" />
      </motion.div>
      
      <h2 className="text-3xl font-bold text-green-700">¡Excelente!</h2>
      <p className="text-xl text-gray-700">
        Has aprendido cómo funciona la propiedad asociativa
      </p>
      <div className="text-lg text-gray-600">
        Respuesta final: <span className="font-bold text-2xl text-green-600">{problem.correctAnswer}</span>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Indicador de progreso */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2">
          {['intro', 'grouping1', 'grouping2', 'comparison', 'complete'].map((step, index) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full transition-colors ${
                currentStep === step 
                  ? 'bg-blue-500' 
                  : ['intro', 'grouping1', 'grouping2', 'comparison', 'complete'].indexOf(currentStep) > index
                    ? 'bg-green-500'
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {currentStep === 'intro' && renderIntroStep()}
          {currentStep === 'grouping1' && renderGrouping1Step()}
          {currentStep === 'grouping2' && renderGrouping2Step()}
          {currentStep === 'comparison' && renderComparisonStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </AnimatePresence>
      </div>

      {/* Controles de navegación */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 'intro'}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Anterior</span>
        </Button>

        <div className="text-sm text-gray-500">
          Paso {['intro', 'grouping1', 'grouping2', 'comparison', 'complete'].indexOf(currentStep) + 1} de 5
        </div>

        <Button
          onClick={handleNextStep}
          disabled={currentStep === 'complete'}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
        >
          <span>
            {currentStep === 'comparison' ? 'Finalizar' : 'Siguiente'}
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProgressiveGroupingDisplay;