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
  const [focusedField, setFocusedField] = useState<keyof PracticeAnswers | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { operands, grouping1, grouping2 } = problem;
  const [a, b, c] = operands;

  // Sistema robusto de manejo de entrada de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      console.log('🔍 [PROGRESSIVE-DEBUG] Key pressed:', e.key, 'Focused field:', focusedField);
      
      if (!focusedField || isComplete) {
        console.log('⚠️ [PROGRESSIVE-DEBUG] No focused field or complete, ignoring keypress');
        return;
      }
      
      // Prevenir comportamiento por defecto para teclas que manejamos
      if ((e.key >= '0' && e.key <= '9') || e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        console.log('🚫 [PROGRESSIVE-DEBUG] Prevented default behavior for:', e.key);
      }
      
      if (e.key >= '0' && e.key <= '9') {
        console.log('✅ [PROGRESSIVE-DEBUG] Adding digit:', e.key, 'to field:', focusedField);
        setAnswers(prev => {
          const newValue = prev[focusedField] + e.key;
          console.log('📝 [PROGRESSIVE-DEBUG] New value for', focusedField, ':', newValue);
          return {
            ...prev,
            [focusedField]: newValue
          };
        });
      } else if (e.key === 'Backspace') {
        console.log('⬅️ [PROGRESSIVE-DEBUG] Backspace pressed for field:', focusedField);
        setAnswers(prev => {
          const newValue = prev[focusedField].slice(0, -1);
          console.log('📝 [PROGRESSIVE-DEBUG] New value after backspace:', newValue);
          return {
            ...prev,
            [focusedField]: newValue
          };
        });
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        console.log('➡️ [PROGRESSIVE-DEBUG] Moving to next field from:', focusedField);
        // Mover al siguiente campo
        const fields: (keyof PracticeAnswers)[] = ['leftSum1', 'final1', 'rightSum2', 'final2'];
        const currentIndex = fields.indexOf(focusedField);
        const nextIndex = (currentIndex + 1) % fields.length;
        const nextField = fields[nextIndex];
        console.log('🎯 [PROGRESSIVE-DEBUG] Next field:', nextField);
        setFocusedField(nextField);
        setTimeout(() => {
          inputRefs.current[nextField]?.focus();
        }, 0);
      }
    };

    console.log('🎮 [PROGRESSIVE-DEBUG] Adding keydown listener, focused field:', focusedField);
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      console.log('🗑️ [PROGRESSIVE-DEBUG] Removing keydown listener');
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [focusedField, isComplete]);

  // Log cuando cambia el estado de respuestas
  useEffect(() => {
    console.log('📊 [PROGRESSIVE-DEBUG] Answers state updated:', answers);
  }, [answers]);

  // Log cuando cambia el campo enfocado
  useEffect(() => {
    console.log('🎯 [PROGRESSIVE-DEBUG] Focused field changed to:', focusedField);
  }, [focusedField]);

  // Llenar automáticamente las respuestas cuando showAnswers es true
  useEffect(() => {
    if (showAnswers && grouping1 && grouping2) {
      setAnswers({
        leftSum1: grouping1.leftSum.toString(),
        final1: grouping1.totalSum.toString(),
        rightSum2: grouping2.rightSum.toString(),
        final2: grouping2.totalSum.toString()
      });
    }
  }, [showAnswers, grouping1, grouping2]);

  const handleAnswerChange = (field: keyof PracticeAnswers, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value
    }));
    setFeedback('');
  };

  const handleClearInput = (field: keyof PracticeAnswers) => {
    setAnswers(prev => ({
      ...prev,
      [field]: ''
    }));
    setFeedback('');
  };

  const checkAnswers = () => {
    const leftSum1Num = parseInt(answers.leftSum1);
    const final1Num = parseInt(answers.final1);
    const rightSum2Num = parseInt(answers.rightSum2);
    const final2Num = parseInt(answers.final2);

    const isCorrectLeftSum = leftSum1Num === grouping1?.leftSum;
    const isCorrectFinal1 = final1Num === grouping1?.totalSum;
    const isCorrectRightSum = rightSum2Num === grouping2?.rightSum;
    const isCorrectFinal2 = final2Num === grouping2?.totalSum;

    if (isCorrectLeftSum && isCorrectFinal1 && isCorrectRightSum && isCorrectFinal2) {
      setFeedback('¡Perfecto! Ambas agrupaciones dan el mismo resultado.');
      setIsComplete(true);
      if (onComplete) {
        onComplete(final1Num);
      }
    } else {
      const a = operands[0], b = operands[1], c = operands[2];
      const hintMessage = `Pista: (${a} + ${b}) = ${b + c} y (${b} + ${c}) = ${grouping2?.rightSum}`;
      setFeedback(hintMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
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
                      className={`w-16 h-12 text-center text-xl font-bold border-2 rounded flex items-center justify-center cursor-text transition-all outline-none ${
                        focusedField === 'leftSum1' 
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                          : 'border-green-400 bg-white hover:border-green-500'
                      }`}
                      onClick={(e) => {
                        console.log('🖱️ [PROGRESSIVE-DEBUG] Clicked leftSum1');
                        e.preventDefault();
                        setFocusedField('leftSum1');
                        e.currentTarget.focus();
                      }}
                      onFocus={(e) => {
                        console.log('🎯 [PROGRESSIVE-DEBUG] Focused leftSum1');
                        setFocusedField('leftSum1');
                      }}
                      onBlur={() => {
                        console.log('👋 [PROGRESSIVE-DEBUG] Blurred leftSum1');
                      }}
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
                      className={`w-20 h-12 text-center text-xl font-bold border-2 rounded flex items-center justify-center cursor-text transition-all outline-none ${
                        focusedField === 'final1' 
                          ? 'border-green-600 bg-green-50 ring-2 ring-green-200' 
                          : 'border-green-400 bg-white hover:border-green-600'
                      }`}
                      onClick={(e) => {
                        console.log('🖱️ [PROGRESSIVE-DEBUG] Clicked final1');
                        e.preventDefault();
                        setFocusedField('final1');
                        e.currentTarget.focus();
                      }}
                      onFocus={(e) => {
                        console.log('🎯 [PROGRESSIVE-DEBUG] Focused final1');
                        setFocusedField('final1');
                      }}
                      onBlur={() => {
                        console.log('👋 [PROGRESSIVE-DEBUG] Blurred final1');
                      }}
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
                      className={`w-16 h-12 text-center text-xl font-bold border-2 rounded flex items-center justify-center cursor-text transition-all outline-none ${
                        focusedField === 'rightSum2' 
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                          : 'border-purple-400 bg-white hover:border-purple-500'
                      }`}
                      onClick={(e) => {
                        console.log('🖱️ [PROGRESSIVE-DEBUG] Clicked rightSum2');
                        e.preventDefault();
                        setFocusedField('rightSum2');
                        e.currentTarget.focus();
                      }}
                      onFocus={(e) => {
                        console.log('🎯 [PROGRESSIVE-DEBUG] Focused rightSum2');
                        setFocusedField('rightSum2');
                      }}
                      onBlur={() => {
                        console.log('👋 [PROGRESSIVE-DEBUG] Blurred rightSum2');
                      }}
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
                      className={`w-20 h-12 text-center text-xl font-bold border-2 rounded flex items-center justify-center cursor-text transition-all outline-none ${
                        focusedField === 'final2' 
                          ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200' 
                          : 'border-purple-400 bg-white hover:border-purple-600'
                      }`}
                      onClick={(e) => {
                        console.log('🖱️ [PROGRESSIVE-DEBUG] Clicked final2');
                        e.preventDefault();
                        setFocusedField('final2');
                        e.currentTarget.focus();
                      }}
                      onFocus={(e) => {
                        console.log('🎯 [PROGRESSIVE-DEBUG] Focused final2');
                        setFocusedField('final2');
                      }}
                      onBlur={() => {
                        console.log('👋 [PROGRESSIVE-DEBUG] Blurred final2');
                      }}
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

      {/* Botón para verificar respuestas */}
      {!isComplete && (
        <div className="text-center">
          <Button 
            onClick={checkAnswers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
            disabled={!answers.leftSum1 || !answers.final1 || !answers.rightSum2 || !answers.final2}
          >
            <Check className="w-5 h-5 mr-2" />
            Verificar Respuestas
          </Button>
        </div>
      )}

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