import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useProgress, ExerciseResult } from "@/context/ProgressContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { operationModules } from "@/utils/operationComponents";
import { Loader2, RefreshCw, Check, X } from "lucide-react";
import ProblemRenderer, { MathProblem } from "../components/ProblemRenderer";
import AdditionProblemRenderer from '../components/AdditionProblemRenderer';
import ExerciseHistoryDisplay from '../components/ExerciseHistoryDisplay';

export default function ProgressPage() {
  const { exerciseHistory, moduleProgress, clearProgress, refreshProgress, isLoading } = useProgress();
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [selectedExercise, setSelectedExercise] = useState<ExerciseResult | null>(null);
  const [localExerciseHistory, setLocalExerciseHistory] = useState<any[]>([]);
  
  // Cargar datos del localStorage cuando se monta el componente
  useEffect(() => {
    const storedResults = localStorage.getItem('math_results');
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setLocalExerciseHistory(parsedResults);
      } catch (error) {
        console.error("Error parsing localStorage data:", error);
        setLocalExerciseHistory([]);
      }
    }
  }, []);

  // Función para refrescar los datos manualmente
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshProgress();
      
      // También actualizamos los datos de localStorage
      const storedResults = localStorage.getItem('math_results');
      if (storedResults) {
        try {
          const parsedResults = JSON.parse(storedResults);
          setLocalExerciseHistory(parsedResults);
        } catch (error) {
          console.error("Error parsing localStorage data:", error);
        }
      }
      
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProgress]);

  // Nota: La actualización automática ha sido desactivada
  // La actualización ahora sólo ocurre cuando el usuario
  // hace clic en el botón de "Refresh Data"

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleClearProgress = async () => {
    setIsClearing(true);
    await clearProgress();
    
    // También limpiar los datos del localStorage
    localStorage.removeItem('math_results');
    setLocalExerciseHistory([]);
    
    setIsClearing(false);
  };

  // Prepare data for charts
  const getModuleColor = (moduleId: string) => {
    const colorMap: Record<string, string> = {
      addition: "#3B82F6", // primary
      subtraction: "#8B5CF6", // secondary
      multiplication: "#10B981", // success
      division: "#F59E0B", // amber-500
      fractions: "#EF4444", // error
    };
    return colorMap[moduleId] || "#6B7280"; // gray-500 as default
  };

  // Recent progress data - last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return {
      date: format(date, "MMM dd"),
      dateObj: date,
    };
  }).reverse();

  const recentProgressData = last7Days.map(day => {
    const dayResults = exerciseHistory ? exerciseHistory.filter(result => {
      if (!result || !result.date) return false;
      const resultDate = parseISO(result.date);
      return (
        resultDate.getDate() === day.dateObj.getDate() &&
        resultDate.getMonth() === day.dateObj.getMonth() &&
        resultDate.getFullYear() === day.dateObj.getFullYear()
      );
    }) : [];

    const dayData: any = {
      date: day.date,
    };

    operationModules.forEach(module => {
      if (!module.comingSoon) {
        const moduleResults = dayResults.filter(result => result.operationId === module.id);
        if (moduleResults.length > 0) {
          const avgScore = moduleResults.reduce((sum, result) => sum + (result.score / result.totalProblems), 0) / moduleResults.length;
          dayData[module.id] = Math.round(avgScore * 100);
        } else {
          dayData[module.id] = 0;
        }
      }
    });

    return dayData;
  });

  // Module comparison data
  const moduleComparisonData = operationModules
    .filter(module => !module.comingSoon)
    .map(module => {
      const progress = moduleProgress[module.id];
      return {
        name: module.displayName,
        completed: progress?.totalCompleted || 0,
        accuracy: progress?.averageScore ? Math.round(progress.averageScore * 100) : 0,
        color: getModuleColor(module.id)
      };
    });

  // Combinar datos del ejercicio normal y local
  const recentExercises = [...exerciseHistory, ...localExerciseHistory]
    .sort((a, b) => new Date(b.date || b.extraData?.date || b.createdAt || 0).getTime() - new Date(a.date || a.extraData?.date || a.createdAt || 0).getTime())
    .slice(0, 10);

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getModuleName = (id: string) => {
    const module = operationModules.find(m => m.id === id);
    return module?.displayName || id;
  };

  return (
    <>
      <Helmet>
        <title>Your Progress - Math W+A+O+K</title>
        <meta name="description" content="Track your math learning progress and view your performance statistics." />
      </Helmet>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Progress</h1>
            <p className="text-gray-600">Track your math learning journey</p>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {format(lastUpdateTime, "MMM dd, yyyy HH:mm:ss")}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isClearing || exerciseHistory.length === 0}>
                  {isClearing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    "Clear All Progress"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your progress data and your rewards collection.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearProgress}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {recentExercises.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">No progress data yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Complete exercises to start tracking your progress
                </p>
                <Button className="mt-4" asChild>
                  <a href="/">Start an Exercise</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="detailed">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Progress</TabsTrigger>
              <TabsTrigger value="recent">Recent Exercises</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Progress</CardTitle>
                    <CardDescription>Your performance over the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={recentProgressData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis unit="%" domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, ""]} />
                          <Legend />
                          {operationModules
                            .filter(module => !module.comingSoon)
                            .map(module => (
                              <Line
                                key={module.id}
                                type="monotone"
                                dataKey={module.id}
                                name={module.displayName}
                                stroke={getModuleColor(module.id)}
                                activeDot={{ r: 8 }}
                              />
                            ))
                          }
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Module Comparison</CardTitle>
                    <CardDescription>Comparing your performance across modules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={moduleComparisonData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis unit="%" domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, ""]} />
                          <Legend />
                          <Bar dataKey="accuracy" name="Accuracy" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {operationModules
                  .filter(module => !module.comingSoon)
                  .map(module => {
                    const progress = moduleProgress[module.id];
                    return (
                      <Card key={module.id} className="overflow-hidden transition-all">
                        <div
                          className="flex justify-between items-center p-4 border-b border-gray-200 relative overflow-hidden"
                          style={{
                            backgroundColor: module.color || '#4287f5',
                            color: 'white'
                          }}
                        >
                          {/* Background pattern */}
                          <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <pattern id={`grid-${module.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                                  <circle cx="2" cy="2" r="1" fill="white" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill={`url(#grid-${module.id})`} />
                            </svg>
                          </div>

                          <div className="flex items-center relative z-10">
                            <div className="flex items-center">
                              <div className="mr-3 bg-white/25 p-2 rounded-lg shadow-inner">
                                {module.icon === "Plus" && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                                {module.icon === "PieChart" && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
                                {module.icon === "Hash" && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
                                {!module.icon && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                              </div>
                              <h3 className="text-xl font-bold text-white">
                                {module.displayName}
                              </h3>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-5 bg-gradient-to-b from-white to-blue-50">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500">Exercises Completed</p>
                                <p className="text-2xl font-bold">{progress?.totalCompleted || 0}</p>
                              </div>
                              <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500">Problems Solved</p>
                                <p className="text-2xl font-bold">
                                  {(() => {
                                    const problemsSolved = exerciseHistory
                                      .filter(ex => ex.operationId === module.id)
                                      .reduce((acc, ex) => acc + (ex.totalProblems || 0), 0);
                                    return problemsSolved;
                                  })()}
                                </p>
                              </div>
                            </div>

                            <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                              <div className="flex justify-between items-baseline mb-2">
                                <p className="text-sm text-gray-500">Average Accuracy</p>
                                <p className="text-sm font-medium text-blue-600">
                                  {progress?.averageScore ? `${Math.round(progress.averageScore * 100)}%` : 'N/A'}
                                </p>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${progress?.averageScore ? Math.round(progress.averageScore * 100) : 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>

            <TabsContent value="recent">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Exercise History</CardTitle>
                  <CardDescription>Your last 10 completed exercises</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Module</th>
                          <th className="text-left py-3 px-4">Difficulty</th>
                          <th className="text-left py-3 px-4">Score</th>
                          <th className="text-left py-3 px-4">Time</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentExercises.map((exercise: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">
                              {format(new Date(exercise.date || exercise.createdAt || exercise.extraData?.date || new Date()), "MMMM dd, yyyy h:mm a")}
                            </td>
                            <td className="py-3 px-4">{getModuleName(exercise.operationId)}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyBadgeClass(exercise.difficulty || 'beginner')}`}>
                                {(exercise.difficulty || 'beginner').charAt(0).toUpperCase() + (exercise.difficulty || 'beginner').slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {exercise.score !== undefined && exercise.totalProblems ?
                                `${exercise.score}/${exercise.totalProblems} (${Math.round((exercise.score / exercise.totalProblems) * 100)}%)` :
                                exercise.extraData?.accuracy ? 
                                  `${Math.round(exercise.extraData.accuracy)}%` : 
                                  "N/A"}
                            </td>
                            <td className="py-3 px-4">{exercise.timeSpent !== undefined ? `${exercise.timeSpent}s` : "N/A"}</td>
                            <td className="py-3 px-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedExercise(exercise)}
                                  >
                                    Ver detalles
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="text-center text-xl font-bold">
                                      {getModuleName(exercise.operationId)} Exercise Complete!
                                    </DialogTitle>
                                  </DialogHeader>
                                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                                    <p className="text-center text-sm text-gray-500">Total Time</p>
                                    <p className="text-center text-2xl font-bold">
                                      {exercise.timeSpent ?
                                        exercise.timeSpent < 60 ?
                                          `00:${exercise.timeSpent.toString().padStart(2, '0')}` :
                                          `${Math.floor(exercise.timeSpent / 60).toString().padStart(2, '0')}:${(exercise.timeSpent % 60).toString().padStart(2, '0')}`
                                        : '00:00'}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-blue-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Score</p>
                                      <p className="text-center text-lg font-bold text-blue-600">
                                        {/* Mostrar correctamente el score teniendo en cuenta las respuestas reveladas */}
                                        {Math.max(0, exercise.score - (exercise.revealedAnswers || exercise.extraData?.revealedAnswers || 0))}/{exercise.totalProblems}
                                      </p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Accuracy</p>
                                      <p className="text-center text-lg font-bold text-green-600">
                                        {(() => {
                                          // Obtener el número de respuestas reveladas
                                          const revealed = exercise.revealedAnswers || exercise.extraData?.revealedAnswers || 0;
                                          // Calcular problemas intentados (excluyendo los revelados)
                                          const attemptedProblems = exercise.totalProblems - revealed;
                                          
                                          // Calcular accuracy excluyendo respuestas reveladas
                                          if (attemptedProblems > 0) {
                                            // Restar las respuestas reveladas del score para accuracy
                                            const correctAnswers = Math.max(0, exercise.score - revealed);
                                            return `${Math.round((correctAnswers / attemptedProblems) * 100)}%`;
                                          } else if (exercise.extraData?.accuracy) {
                                            return `${Math.round(exercise.extraData.accuracy)}%`;
                                          }
                                          return '0%';
                                        })()}
                                      </p>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Avg. Time</p>
                                      <p className="text-center text-lg font-bold text-purple-600">
                                        {exercise.timeSpent && exercise.totalProblems ?
                                          `${Math.round(exercise.timeSpent / exercise.totalProblems)}s` :
                                          exercise.extraData?.avgTimePerProblem ? 
                                            `${exercise.extraData.avgTimePerProblem}s` : 
                                            'N/A'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="bg-yellow-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Avg. Attempts</p>
                                      <p className="text-center text-lg font-bold text-yellow-600">
                                        {exercise.avgAttempts ? exercise.avgAttempts.toFixed(1) : 
                                         exercise.extraData?.avgAttempts ? exercise.extraData.avgAttempts.toFixed(1) : '1.0'}
                                      </p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Revealed</p>
                                      <p className="text-center text-lg font-bold text-red-600">
                                        {exercise.revealedAnswers || exercise.extraData?.revealedAnswers || 0}
                                      </p>
                                    </div>
                                    <div className="bg-teal-50 p-3 rounded-md">
                                      <p className="text-center text-sm text-gray-600">Final Level</p>
                                      <p className="text-center text-lg font-bold text-teal-600">
                                        {exercise.difficulty === 'beginner' ? 'Principiante' :
                                         exercise.difficulty === 'intermediate' ? 'Intermedio' :
                                         exercise.difficulty === 'advanced' ? 'Avanzado' : 'Principiante'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Mostrar Problem Review con el nuevo componente */}
                                  <div className="mt-4">
                                    <h3 className="font-medium mb-2">Problem Review</h3>
                                    <ExerciseHistoryDisplay exercise={exercise} />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}