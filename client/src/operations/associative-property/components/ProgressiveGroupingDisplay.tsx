import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { AssociativePropertyProblem } from '../types';

interface ProgressiveGroupingDisplayProps {
  problem: AssociativePropertyProblem;
  onComplete: (finalAnswer: number) => void;
  onCheckAnswers?: () => void;
  showAnswers?: boolean;
}

interface PracticeAnswers {
  leftSum1: string;
  final1: string;
  rightSum2: string;
  final2: string;
}

const ProgressiveGroupingDisplay: React.FC<ProgressiveGroupingDisplayProps> = ({
  problem,
  onComplete,
  showAnswers = false
}) => {
  const [answers, setAnswers] = useState<PracticeAnswers>({
    leftSum1: '',
    final1: '',
    rightSum2: '',
    final2: ''
  });

  const [feedback, setFeedback] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { operands, grouping1, grouping2 } = problem;
  const [a, b, c] = operands;

  // Agregar event listener para el teclado físico
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedField || isComplete) return;

      if (e.key >= '0' && e.key <= '9') {
        handleAnswerChange(focusedField as keyof PracticeAnswers, e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleAnswerChange(focusedField as keyof PracticeAnswers, '');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        checkAnswers();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedField, isComplete]);

  // RESETEO AUTOMÁTICO: Limpiar respuestas cuando cambia el problema
  useEffect(() => {
    console.log('🔄 [RESET-DEBUG] Problem change detected');
    console.log('🔄 [RESET-DEBUG] Problem operands:', problem.operands);
    console.log('🔄 [RESET-DEBUG] Problem id:', problem.id);
    console.log('🔄 [RESET-DEBUG] Current answers before reset:', answers);
    
    // Solo resetear si no es la primera carga (evitar reseteo innecesario)
    const hasAnswers = Object.values(answers).some(answer => answer !== '');
    
    if (hasAnswers || !showAnswers) {
      console.log('🔄 [RESET-DEBUG] Resetting answers to empty state');
      
      setAnswers({
        leftSum1: '',
        final1: '',
        rightSum2: '',
        final2: ''
      });
      
      setFocusedField('leftSum1');
      setFeedback('');
      setIsComplete(false);
      
      console.log('🔄 [RESET-DEBUG] Reset completed successfully');
    } else {
      console.log('🔄 [RESET-DEBUG] Skipping reset - no answers to clear');
    }
    
  }, [problem.operands?.join(','), problem.id, showAnswers]);

  // Llenar automáticamente las respuestas cuando showAnswers es true
  useEffect(() => {
    if (showAnswers && grouping1 && grouping2) {
      console.log('📝 [AUTO-FILL] Filling answers automatically');
      setAnswers({
        leftSum1: grouping1.leftSum.toString(),
        final1: grouping1.totalSum.toString(),
        rightSum2: grouping2.rightSum.toString(),
        final2: grouping2.totalSum.toString()
      });
    }
  }, [showAnswers, grouping1, grouping2]);

  const handleAnswerChange = (field: keyof PracticeAnswers, newDigit: string) => {
    if (newDigit === '') {
      // Limpiar el campo
      setAnswers(prev => ({
        ...prev,
        [field]: ''
      }));
      setFeedback('');
    } else if (/^\d$/.test(newDigit)) {
      // Agregar el dígito al campo actual
      setAnswers(prev => {
        const currentValue = prev[field];
        const newValue = currentValue + newDigit;
        
        // Limitar a máximo 3 dígitos para evitar números muy grandes
        if (newValue.length <= 3) {
          setFeedback('');
          return {
            ...prev,
            [field]: newValue
          };
        }
        return prev;
      });
    }
  };

  const checkAnswers = () => {
    const leftSum1 = parseInt(answers.leftSum1) || 0;
    const final1 = parseInt(answers.final1) || 0;
    const rightSum2 = parseInt(answers.rightSum2) || 0;
    const final2 = parseInt(answers.final2) || 0;

    const correctLeftSum1 = grouping1?.leftSum || 0;
    const correctFinal1 = grouping1?.totalSum || 0;
    const correctRightSum2 = grouping2?.rightSum || 0;
    const correctFinal2 = grouping2?.totalSum || 0;

    const allCorrect = 
      leftSum1 === correctLeftSum1 &&
      final1 === correctFinal1 &&
      rightSum2 === correctRightSum2 &&
      final2 === correctFinal2;

    if (allCorrect) {
      setFeedback("¡Excelente! Has demostrado que ambas agrupaciones dan el mismo resultado.");
      setIsComplete(true);
      setTimeout(() => {
        onComplete(correctFinal1);
      }, 1500);
    } else {
      // Feedback específico por campo
      let specificFeedback = "Revisa tus cálculos: ";
      const errors = [];
      
      if (leftSum1 !== correctLeftSum1) errors.push(`(${a} + ${b}) = ${correctLeftSum1}`);
      if (final1 !== correctFinal1) errors.push(`resultado final primera agrupación = ${correctFinal1}`);
      if (rightSum2 !== correctRightSum2) errors.push(`(${b} + ${c}) = ${correctRightSum2}`);
      if (final2 !== correctFinal2) errors.push(`resultado final segunda agrupación = ${correctFinal2}`);
      
      setFeedback(specificFeedback + errors.join(", "));
    }
  };

  const allFieldsFilled = answers.leftSum1 && answers.final1 && answers.rightSum2 && answers.final2;

  return (
    <div className="space-y-6">
      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-blue-800 mb-2">
          Practica la Propiedad Asociativa
        </h2>
        <p className="text-gray-600">
          Completa los espacios en blanco para resolver ambas agrupaciones
        </p>
      </motion.div>

      {/* Ambas agrupaciones lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Primera agrupación */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-green-300 bg-gradient-to-br from-green-50 to-green-100 h-full">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-green-800 mb-6 text-center">
                Primera agrupación
              </h3>
              
              <div className="space-y-4">
                {/* Expresión original */}
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 text-2xl font-mono">
                    <span className="text-green-600">(</span>
                    <span className="bg-green-200 px-3 py-2 rounded font-bold">{a}</span>
                    <span className="text-xl">+</span>
                    <span className="bg-green-200 px-3 py-2 rounded font-bold">{b}</span>
                    <span className="text-green-600">)</span>
                    <span className="text-xl">+</span>
                    <span className="bg-blue-200 px-3 py-2 rounded font-bold">{c}</span>
                  </div>
                </div>

                {/* Primer paso */}
                <div className="text-center">
                  <div className="text-gray-600 mb-2 text-sm">Primero resuelve el paréntesis:</div>
                  <div className="inline-flex items-center space-x-2 text-2xl font-mono">
                    <div
                      ref={el => inputRefs.current['leftSum1'] = el}
                      data-field="leftSum1"
                      tabIndex={0}
                      className={`w-16 h-12 text-center text-xl font-bold border-2 rounded flex items-center justify-center cursor-text transition-all ${
                        focusedField === 'leftSum1' 
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                          : 'border-green-400 bg-white hover:border-green-500'
                      }`}
                      onClick={() => setFocusedField('leftSum1')}
                      onFocus={() => setFocusedField('leftSum1')}
                    >
                      {answers.leftSum1 || <span className="text-gray-400">?</span>}
                    </div>
                    <span className="text-xl">+</span>
                    <span className="bg-blue-200 px-3 py-2 rounded font-bold">{c}</span>
                  </div>
                </div>

                {/* Resultado final */}
                <div className="text-center">
                  <div className="text-gray-600 mb-2 text-sm">Resultado final:</div>
                  <div className="inline-flex items-center space-x-2 text-2xl font-mono">
                    <span className="text-xl">=</span>
                    <div
                      ref={el => inputRefs.current['final1'] = el}
                      data-field="final1"
                      tabIndex={0}
                      className={`w-20 h-12 text-center text-xl font-bold border-2 rounded flex items-center justify-center cursor-text transition-all ${
                        focusedField === 'final1' 
                          ? 'border-green-600 bg-green-50 ring-2 ring-green-200' 
                          : 'border-green-400 bg-white hover:border-green-600'
                      }`}
                      onClick={() => setFocusedField('final1')}
                      onFocus={() => setFocusedField('final1')}
                    >
                      {answers.final1 || <span className="text-gray-400">?</span>}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Segunda agrupación */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100 h-full">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-purple-800 mb-6 text-center">
                Segunda agrupación
              </h3>
              
              <div className="space-y-4">
                {/* Expresión original */}
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 text-2xl font-mono">
                    <span className="bg-blue-200 px-3 py-2 rounded font-bold">{a}</span>
                    <span className="text-xl">+</span>
                    <span className="text-purple-600">(</span>
                    <span className="bg-purple-200 px-3 py-2 rounded font-bold">{b}</span>
                    <span className="text-xl">+</span>
                    <span className="bg-purple-200 px-3 py-2 rounded font-bold">{c}</span>
                    <span className="text-purple-600">)</span>
                  </div>
                </div>

                {/* Primer paso */}
                <div className="text-center">
                  <div className="text-gray-600 mb-2 text-sm">Primero resuelve el paréntesis:</div>
                  <div className="inline-flex items-center space-x-2 text-2xl font-mono">
                    <span className="bg-blue-200 px-3 py-2 rounded font-bold">{a}</span>
                    <span className="text-xl">+</span>
                    <div
                      ref={el => inputRefs.current['rightSum2'] = el}
                      data-field="rightSum2"
                      tabIndex={0}
                      className={`w-16 h-12 text-center text-xl font-bold border-2 rounded flex items-center justify-center cursor-text transition-all ${
                        focusedField === 'rightSum2' 
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                          : 'border-purple-400 bg-white hover:border-purple-500'
                      }`}
                      onClick={() => setFocusedField('rightSum2')}
                      onFocus={() => setFocusedField('rightSum2')}
                    >
                      {answers.rightSum2 || <span className="text-gray-400">?</span>}
                    </div>
                  </div>
                </div>

                {/* Resultado final */}
                <div className="text-center">
                  <div className="text-gray-600 mb-2 text-sm">Resultado final:</div>
                  <div className="inline-flex items-center space-x-2 text-2xl font-mono">
                    <span className="text-xl">=</span>
                    <div
                      ref={el => inputRefs.current['final2'] = el}
                      data-field="final2"
                      tabIndex={0}
                      className={`w-20 h-12 text-center text-xl font-bold border-2 rounded flex items-center justify-center cursor-text transition-all ${
                        focusedField === 'final2' 
                          ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200' 
                          : 'border-purple-400 bg-white hover:border-purple-600'
                      }`}
                      onClick={() => setFocusedField('final2')}
                      onFocus={() => setFocusedField('final2')}
                    >
                      {answers.final2 || <span className="text-gray-400">?</span>}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>



      {/* Feedback */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className={`p-4 rounded-lg border-2 ${
            isComplete 
              ? 'bg-green-100 border-green-400 text-green-800'
              : 'bg-amber-100 border-amber-400 text-amber-800'
          }`}>
            <p className="font-semibold">{feedback}</p>
          </div>
        </motion.div>
      )}

      {/* Conclusión cuando ambas respuestas son correctas */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-amber-800 mb-4">
                🎉 ¡Propiedad Asociativa Demostrada!
              </h3>
              <div className="text-lg text-amber-700">
                Ambas agrupaciones dieron el mismo resultado: <span className="font-bold text-2xl">{grouping1?.totalSum}</span>
              </div>
              <div className="text-sm text-amber-600 mt-2">
                Esto demuestra que (a + b) + c = a + (b + c)
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ProgressiveGroupingDisplay;