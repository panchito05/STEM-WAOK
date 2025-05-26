import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { EmptyProblem, DifficultyLevel } from './types';

interface EmptyExerciseProps {
  difficulty: DifficultyLevel;
  problemCount: number;
  onComplete?: (results: any) => void;
}

interface ExerciseResult {
  problem: EmptyProblem;
  userAnswer: any;
  isCorrect: boolean;
  timeSpent: number;
}

export default function EmptyExercise({ 
  difficulty = 'beginner', 
  problemCount = 5, 
  onComplete 
}: EmptyExerciseProps) {
  const [currentProblem, setCurrentProblem] = useState<EmptyProblem | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [problems, setProblems] = useState<EmptyProblem[]>([]);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  const { toast } = useToast();

  // Generar problemas según la dificultad
  const generateProblems = (count: number, difficulty: DifficultyLevel): EmptyProblem[] => {
    const problems: EmptyProblem[] = [];
    
    for (let i = 0; i < count; i++) {
      // PERSONALIZA AQUÍ: Genera problemas según tu módulo
      const problem: EmptyProblem = {
        id: `empty-${i + 1}`,
        content: `Problema de ejemplo ${i + 1}`, // Cambia esto por tu contenido
        correctAnswer: `Respuesta ${i + 1}`, // Cambia esto por tu lógica de respuesta
        layout: 'horizontal',
        index: i + 1,
        total: count,
        metadata: {
          difficulty,
          // Añade metadatos específicos de tu módulo
        }
      };
      
      problems.push(problem);
    }
    
    return problems;
  };

  // Inicializar ejercicio
  useEffect(() => {
    const newProblems = generateProblems(problemCount, difficulty);
    setProblems(newProblems);
    setCurrentProblem(newProblems[0]);
    setStartTime(Date.now());
  }, [difficulty, problemCount]);

  // Verificar respuesta
  const checkAnswer = () => {
    if (!currentProblem) return;

    const isCorrect = userAnswer.trim() === currentProblem.correctAnswer;
    const timeSpent = Date.now() - startTime;

    const result: ExerciseResult = {
      problem: currentProblem,
      userAnswer: userAnswer.trim(),
      isCorrect,
      timeSpent
    };

    setResults(prev => [...prev, result]);

    if (isCorrect) {
      toast({
        title: "¡Correcto!",
        description: "Excelente trabajo",
        variant: "default",
      });
    } else {
      toast({
        title: "Incorrecto",
        description: `La respuesta correcta era: ${currentProblem.correctAnswer}`,
        variant: "destructive",
      });
    }

    // Avanzar al siguiente problema
    setTimeout(() => {
      nextProblem();
    }, 1500);
  };

  // Avanzar al siguiente problema
  const nextProblem = () => {
    const nextIndex = currentProblemIndex + 1;
    
    if (nextIndex >= problems.length) {
      // Ejercicio completado
      setIsCompleted(true);
      onComplete?.(results);
    } else {
      setCurrentProblemIndex(nextIndex);
      setCurrentProblem(problems[nextIndex]);
      setUserAnswer('');
      setStartTime(Date.now());
    }
  };

  // Reiniciar ejercicio
  const restart = () => {
    const newProblems = generateProblems(problemCount, difficulty);
    setProblems(newProblems);
    setCurrentProblem(newProblems[0]);
    setCurrentProblemIndex(0);
    setUserAnswer('');
    setResults([]);
    setIsCompleted(false);
    setStartTime(Date.now());
  };

  if (isCompleted) {
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / results.length) * 100);

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-green-600">¡Ejercicio Completado!</h2>
            
            <div className="space-y-2">
              <p className="text-lg">
                Puntuación: <span className="font-bold">{correctCount}/{results.length}</span>
              </p>
              <p className="text-lg">
                Precisión: <span className="font-bold">{accuracy}%</span>
              </p>
            </div>

            <Button onClick={restart} className="mt-4">
              Practicar de Nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentProblem) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <p>Cargando ejercicio...</p>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentProblemIndex + 1) / problems.length) * 100;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header con progreso */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Badge variant="outline">
                Problema {currentProblem.index} de {currentProblem.total}
              </Badge>
              <Badge variant="secondary">
                Dificultad: {difficulty}
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Contenido del problema */}
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">
              {/* PERSONALIZA AQUÍ: Cambia cómo se muestra el problema */}
              {currentProblem.content}
            </h3>
            
            <div className="space-y-4">
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Escribe tu respuesta aquí"
                className="text-center text-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    checkAnswer();
                  }
                }}
              />
              
              <Button 
                onClick={checkAnswer}
                disabled={!userAnswer.trim()}
                className="w-full"
              >
                Verificar Respuesta
              </Button>
            </div>
          </div>

          {/* Estadísticas en tiempo real */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Correctas: {results.filter(r => r.isCorrect).length}</span>
            <span>Restantes: {problems.length - currentProblemIndex - 1}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}