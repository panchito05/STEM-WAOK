import React, { useState, useEffect, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";
import { ModuleSettings, useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBarUI } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  generateAssociativePropertyProblem, 
  checkAssociativeAnswer 
} from "./utils";
import { 
  AssociativePropertyProblem, 
  AssociativeActivityLevel,
  Level1Problem,
  Level2Problem,
  Level3Problem,
  Level4Problem,
  Level5Problem,
  VisualObject
} from "./types";
import { formatTime } from "@/lib/utils";
import { 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Star,
  Trophy,
  Lightbulb,
  Target,
  Users
} from "lucide-react";
import { Link } from "wouter";

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

// Componente para Nivel 1: Agrupar Objetos Visuales
const Level1Component: React.FC<{
  problem: Level1Problem;
  onAnswer: (answer: boolean) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}> = ({ problem, onAnswer, showResult, isCorrect }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);

  const renderGrouping = (grouping: any, title: string, color: string) => (
    <div className="mb-6 p-4 border-2 rounded-lg" style={{ borderColor: color }}>
      <h4 className="font-bold text-lg mb-3 text-center" style={{ color }}>{title}</h4>
      <div className="flex justify-center space-x-4">
        <div className="p-3 bg-gray-100 rounded-lg">
          <div className="text-center text-sm font-medium mb-2">Grupo 1</div>
          <div className="flex space-x-2">
            {grouping.groups.first.map((idx: number) => (
              <div key={idx} className="text-4xl">{problem.objects[idx].emoji}</div>
            ))}
          </div>
        </div>
        <div className="text-2xl self-center">+</div>
        <div className="p-3 bg-gray-100 rounded-lg">
          <div className="text-center text-sm font-medium mb-2">Grupo 2</div>
          <div className="flex space-x-2">
            {grouping.groups.second.map((idx: number) => (
              <div key={idx} className="text-4xl">{problem.objects[idx].emoji}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          <Users className="inline mr-2" />
          Nivel 1: Agrupar Objetos Visuales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {renderGrouping(problem.grouping1, "Primera forma de agrupar", "#FF6B6B")}
          {renderGrouping(problem.grouping2, "Segunda forma de agrupar", "#4ECDC4")}
          
          <div className="text-center">
            <div className="text-lg font-medium mb-4">{problem.question}</div>
            
            {!showResult && (
              <div className="space-x-4">
                <Button
                  onClick={() => {
                    setSelectedAnswer(true);
                    onAnswer(true);
                  }}
                  variant={selectedAnswer === true ? "default" : "outline"}
                  className="px-8"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Sí, igual cantidad
                </Button>
                <Button
                  onClick={() => {
                    setSelectedAnswer(false);
                    onAnswer(false);
                  }}
                  variant={selectedAnswer === false ? "default" : "outline"}
                  className="px-8"
                >
                  <X className="mr-2 h-4 w-4" />
                  No, diferente cantidad
                </Button>
              </div>
            )}
            
            {showResult && (
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className="font-bold text-lg">
                  {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                </div>
                <div className="text-sm mt-2">
                  Los dos agrupamientos contienen exactamente {problem.objects.length} animales.
                  La propiedad asociativa nos dice que podemos agrupar de diferentes maneras sin cambiar el total.
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para Nivel 2: Introducción Numérica
const Level2Component: React.FC<{
  problem: Level2Problem;
  onAnswer: (answer: number) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}> = ({ problem, onAnswer, showResult, isCorrect }) => {
  const [answer1, setAnswer1] = useState<string>("");
  const [answer2, setAnswer2] = useState<string>("");

  const handleSubmit = () => {
    const result1 = parseInt(answer1);
    const result2 = parseInt(answer2);
    if (result1 === result2 && result1 === problem.correctAnswer) {
      onAnswer(problem.correctAnswer);
    } else {
      onAnswer(-1); // Respuesta incorrecta
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          <Target className="inline mr-2" />
          Nivel 2: Introducción Numérica con Sumas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center text-lg">
            Resuelve ambas expresiones y verifica que den el mismo resultado:
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border-2 border-red-300 rounded-lg bg-red-50">
              <div className="text-center text-xl font-bold mb-4" style={{ color: '#FF6B6B' }}>
                {problem.expression1}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span>=</span>
                <Input
                  type="number"
                  value={answer1}
                  onChange={(e) => setAnswer1(e.target.value)}
                  className="w-20 text-center"
                  placeholder="?"
                  disabled={showResult}
                />
              </div>
            </div>
            
            <div className="p-4 border-2 border-teal-300 rounded-lg bg-teal-50">
              <div className="text-center text-xl font-bold mb-4" style={{ color: '#4ECDC4' }}>
                {problem.expression2}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span>=</span>
                <Input
                  type="number"
                  value={answer2}
                  onChange={(e) => setAnswer2(e.target.value)}
                  className="w-20 text-center"
                  placeholder="?"
                  disabled={showResult}
                />
              </div>
            </div>
          </div>
          
          {!showResult && (
            <div className="text-center">
              <Button 
                onClick={handleSubmit}
                disabled={!answer1 || !answer2}
                className="px-8"
              >
                Verificar Respuestas
              </Button>
            </div>
          )}
          
          {showResult && (
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="font-bold text-lg text-center">
                {isCorrect ? '¡Correcto!' : 'Incorrecto'}
              </div>
              <div className="text-sm mt-2 text-center">
                Respuesta correcta: {problem.correctAnswer}
                <br />
                La propiedad asociativa nos dice que {problem.expression1} = {problem.expression2} = {problem.correctAnswer}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para Nivel 3: Ejercicios Guiados
const Level3Component: React.FC<{
  problem: Level3Problem;
  onAnswer: (answer: number[]) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}> = ({ problem, onAnswer, showResult, isCorrect }) => {
  const [missing1, setMissing1] = useState<string>("");
  const [missing2, setMissing2] = useState<string>("");

  const handleSubmit = () => {
    const values = [parseInt(missing1), parseInt(missing2)];
    onAnswer(values);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          <Lightbulb className="inline mr-2" />
          Nivel 3: Ejercicios Guiados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-lg mb-4">
              Completa la expresión equivalente:
            </div>
            
            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg mb-4">
              <div className="text-2xl font-bold text-blue-700">
                {problem.originalExpression} = {problem.correctAnswer}
              </div>
            </div>
            
            <div className="text-lg mb-4">
              Por lo tanto:
            </div>
            
            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <div className="text-2xl font-bold text-green-700 flex items-center justify-center space-x-2">
                <span>{problem.operands[0]} + (</span>
                <Input
                  type="number"
                  value={missing1}
                  onChange={(e) => setMissing1(e.target.value)}
                  className="w-16 text-center font-bold"
                  placeholder="?"
                  disabled={showResult}
                />
                <span>+</span>
                <Input
                  type="number"
                  value={missing2}
                  onChange={(e) => setMissing2(e.target.value)}
                  className="w-16 text-center font-bold"
                  placeholder="?"
                  disabled={showResult}
                />
                <span>) = {problem.correctAnswer}</span>
              </div>
            </div>
          </div>
          
          {!showResult && (
            <div className="text-center">
              <Button 
                onClick={handleSubmit}
                disabled={!missing1 || !missing2}
                className="px-8"
              >
                Verificar Respuesta
              </Button>
            </div>
          )}
          
          {showResult && (
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="font-bold text-lg text-center">
                {isCorrect ? '¡Correcto!' : 'Incorrecto'}
              </div>
              <div className="text-sm mt-2 text-center">
                Respuesta correcta: {problem.missingValues[0]} y {problem.missingValues[1]}
                <br />
                Ambas expresiones dan el mismo resultado: {problem.correctAnswer}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para Nivel 4: Problemas Verbales
const Level4Component: React.FC<{
  problem: Level4Problem;
  onAnswer: (answer: number) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}> = ({ problem, onAnswer, showResult, isCorrect }) => {
  const [answer, setAnswer] = useState<string>("");

  const handleSubmit = () => {
    onAnswer(parseInt(answer));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          <Star className="inline mr-2" />
          Nivel 4: Problemas Verbales y Cálculo Mental
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
            <div className="text-lg">{problem.problemText}</div>
          </div>
          
          <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <div className="font-bold text-blue-700 mb-2">💡 Estrategia sugerida:</div>
            <div className="text-blue-600">{problem.suggestedStrategy}</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg mb-4">¿Cuál es el total?</div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">Respuesta:</span>
              <Input
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-24 text-center text-lg"
                placeholder="?"
                disabled={showResult}
              />
            </div>
          </div>
          
          {!showResult && (
            <div className="text-center">
              <Button 
                onClick={handleSubmit}
                disabled={!answer}
                className="px-8"
              >
                Verificar Respuesta
              </Button>
            </div>
          )}
          
          {showResult && (
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="font-bold text-lg text-center">
                {isCorrect ? '¡Correcto!' : 'Incorrecto'}
              </div>
              <div className="text-sm mt-2 text-center">
                Respuesta correcta: {problem.correctAnswer}
                <br />
                Agrupamiento óptimo: {problem.optimalGrouping} = {problem.correctAnswer}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para Nivel 5: Crear y Justificar
const Level5Component: React.FC<{
  problem: Level5Problem;
  onAnswer: (answer: number) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}> = ({ problem, onAnswer, showResult, isCorrect }) => {
  const [answer, setAnswer] = useState<string>("");

  const handleSubmit = () => {
    onAnswer(parseInt(answer));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          <Trophy className="inline mr-2" />
          Nivel 5: Crear y Justificar Expresiones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-lg mb-4">
              Crea expresiones equivalentes que sumen exactamente:
            </div>
            <div className="text-4xl font-bold text-purple-600 mb-4">
              {problem.targetSum}
            </div>
            <div className="text-lg mb-4">
              Usando estos números: 
              <span className="font-bold ml-2">
                {problem.availableNumbers.join(", ")}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {problem.correctExpressions.slice(0, 2).map((expr, idx) => (
              <div key={idx} className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                <div className="text-center font-mono text-lg">
                  {showResult ? expr : "( ___ + ___ ) + ___"}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <div className="text-lg mb-4">¿Cuál es el resultado de ambas expresiones?</div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">Resultado:</span>
              <Input
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-24 text-center text-lg"
                placeholder="?"
                disabled={showResult}
              />
            </div>
          </div>
          
          {!showResult && (
            <div className="text-center">
              <Button 
                onClick={handleSubmit}
                disabled={!answer}
                className="px-8"
              >
                Verificar Respuesta
              </Button>
            </div>
          )}
          
          {showResult && (
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="font-bold text-lg text-center">
                {isCorrect ? '¡Excelente!' : 'Incorrecto'}
              </div>
              <div className="text-sm mt-2 text-center">
                Respuesta correcta: {problem.targetSum}
                <br />
                Todas estas expresiones son equivalentes por la propiedad asociativa.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const { saveExerciseResult } = useProgress();
  const [currentLevel, setCurrentLevel] = useState<AssociativeActivityLevel>(1);
  const [currentProblem, setCurrentProblem] = useState<AssociativePropertyProblem | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isExerciseComplete, setIsExerciseComplete] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  // Inicializar ejercicio
  useEffect(() => {
    generateNewProblem();
    setStartTime(Date.now());
  }, [currentLevel]);

  const generateNewProblem = useCallback(() => {
    const problem = generateAssociativePropertyProblem(currentLevel);
    setCurrentProblem(problem);
    setShowResult(false);
    setIsCorrect(false);
  }, [currentLevel]);

  const handleAnswer = useCallback((answer: any) => {
    if (!currentProblem) return;

    const correct = checkAssociativeAnswer(currentProblem, answer);
    setIsCorrect(correct);
    setShowResult(true);

    const answerData = {
      problemId: currentProblem.id,
      level: currentLevel,
      userAnswer: answer,
      isCorrect: correct,
      timestamp: Date.now() - startTime
    };

    setUserAnswers(prev => [...prev, answerData]);

    // Auto-avanzar después de 3 segundos
    setTimeout(() => {
      if (currentProblemIndex < settings.problemCount - 1) {
        setCurrentProblemIndex(prev => prev + 1);
        generateNewProblem();
      } else {
        completeExercise();
      }
    }, 3000);
  }, [currentProblem, currentLevel, currentProblemIndex, settings.problemCount, startTime]);

  const completeExercise = useCallback(() => {
    const totalTime = Date.now() - startTime;
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = (correctAnswers / userAnswers.length) * 100;

    saveExerciseResult({
      operationId: "associative-property",
      date: new Date().toISOString(),
      score: correctAnswers,
      totalProblems: settings.problemCount,
      timeSpent: Math.floor(totalTime / 1000),
      difficulty: `level-${currentLevel}`,
      accuracy,
      avgTimePerProblem: totalTime / settings.problemCount / 1000,
      avgAttempts: 1,
      revealedAnswers: 0,
      extra_data: {
        level: currentLevel,
        problems: userAnswers
      }
    });

    setIsExerciseComplete(true);
  }, [startTime, userAnswers, currentLevel, settings.problemCount, saveExerciseResult]);

  const renderCurrentProblem = () => {
    if (!currentProblem) return null;

    switch (currentProblem.level) {
      case 1:
        return (
          <Level1Component
            problem={currentProblem as Level1Problem}
            onAnswer={handleAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
          />
        );
      case 2:
        return (
          <Level2Component
            problem={currentProblem as Level2Problem}
            onAnswer={handleAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
          />
        );
      case 3:
        return (
          <Level3Component
            problem={currentProblem as Level3Problem}
            onAnswer={handleAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
          />
        );
      case 4:
        return (
          <Level4Component
            problem={currentProblem as Level4Problem}
            onAnswer={handleAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
          />
        );
      case 5:
        return (
          <Level5Component
            problem={currentProblem as Level5Problem}
            onAnswer={handleAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
          />
        );
      default:
        return null;
    }
  };

  if (isExerciseComplete) {
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = (correctAnswers / userAnswers.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-green-600">
                <Trophy className="inline mr-2" />
                ¡Ejercicio Completado!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-4xl">🎉</div>
                <div className="text-lg">
                  <strong>Nivel {currentLevel}</strong> - Propiedad Asociativa
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Respuestas correctas: {correctAnswers}/{userAnswers.length}</div>
                  <div>Precisión: {accuracy.toFixed(1)}%</div>
                </div>
                <div className="space-x-4">
                  <Button asChild>
                    <Link href="/">Volver al Inicio</Link>
                  </Button>
                  <Button variant="outline" onClick={onOpenSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Propiedad Asociativa</h1>
            <Badge variant="secondary">Nivel {currentLevel}</Badge>
          </div>
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso</span>
            <span>{currentProblemIndex + 1} de {settings.problemCount}</span>
          </div>
          <ProgressBarUI 
            value={(currentProblemIndex / settings.problemCount) * 100} 
            className="h-2"
          />
        </div>

        {/* Level Selector */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <Button
                key={level}
                variant={currentLevel === level ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentLevel(level as AssociativeActivityLevel)}
                disabled={showResult}
              >
                Nivel {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Current Problem */}
        <div className="mb-6">
          {renderCurrentProblem()}
        </div>
      </div>
    </div>
  );
}