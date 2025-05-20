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
import ProblemRenderer, { MathProblem } from "@/components/ProblemRenderer";

export default function ProgressPage() {
  const { exerciseHistory, moduleProgress, clearProgress, refreshProgress, isLoading } = useProgress();
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [selectedExercise, setSelectedExercise] = useState<ExerciseResult | null>(null);

  // Función para refrescar los datos manualmente
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshProgress();
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

  // Recent exercises list
  const recentExercises = [...exerciseHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
        
        {exerciseHistory.length === 0 ? (
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
                                  {exerciseHistory
                                    .filter(ex => ex.operationId === module.id)
                                    .reduce((sum, ex) => sum + ex.correctProblems, 0)}
                                </p>
                              </div>
                            </div>
                            <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-gray-500">Average Accuracy</p>
                                <p className="text-lg font-bold">
                                  {progress?.averageScore 
                                    ? `${Math.round(progress.averageScore * 100)}%` 
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${progress?.averageScore ? Math.round(progress.averageScore * 100) : 0}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="bg-white shadow p-4 rounded-lg border border-gray-100">
                              <p className="text-sm text-gray-500 mb-2">Recent Performance</p>
                              <div className="h-24">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart
                                    data={recentProgressData}
                                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                                  >
                                    <Line 
                                      type="monotone" 
                                      dataKey={module.id} 
                                      stroke={getModuleColor(module.id)} 
                                      strokeWidth={2}
                                      dot={{ r: 3 }}
                                    />
                                    <YAxis 
                                      domain={[0, 100]} 
                                      hide 
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
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
                  <CardDescription>Your latest exercise results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-6 py-3">Module</th>
                          <th className="px-6 py-3">Date & Time</th>
                          <th className="px-6 py-3">Difficulty</th>
                          <th className="px-6 py-3">Score</th>
                          <th className="px-6 py-3">Time</th>
                          <th className="px-6 py-3">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentExercises.map((exercise) => (
                          <tr key={exercise.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {getModuleName(exercise.operationId)}
                            </td>
                            <td className="px-6 py-4">
                              {format(new Date(exercise.date), "MMM dd, yyyy HH:mm")}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyBadgeClass(exercise.difficulty)}`}>
                                {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium">
                              <div className="flex items-center">
                                {exercise.score >= exercise.totalProblems * 0.7 ? 
                                  <Check className="h-5 w-5 text-green-600 mr-2" /> : 
                                  <X className="h-5 w-5 text-red-600 mr-2" />
                                }
                                {`${exercise.correctProblems}/${exercise.totalProblems} (${Math.round((exercise.score / exercise.totalProblems) * 100)}%)`}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {exercise.timeSpent ? `${Math.round(exercise.timeSpent / 1000)}s` : "N/A"}
                            </td>
                            <td className="px-6 py-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedExercise(exercise)}>
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                  <DialogHeader>
                                    <DialogTitle>Exercise Details</DialogTitle>
                                    <DialogDescription>
                                      {getModuleName(exercise.operationId)} - {format(new Date(exercise.date), "MMM dd, yyyy HH:mm")}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6 py-4">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-sm font-medium">Difficulty</p>
                                        <p className="text-sm">{exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Score</p>
                                        <p className="text-sm">{`${exercise.correctProblems}/${exercise.totalProblems} (${Math.round((exercise.score / exercise.totalProblems) * 100)}%)`}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Time Spent</p>
                                        <p className="text-sm">{exercise.timeSpent ? `${Math.round(exercise.timeSpent / 1000)}s` : "N/A"}</p>
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-sm font-medium mb-2">Problems Review</p>
                                      {(() => {
                                        // Intenta obtener los problemas de varias ubicaciones posibles
                                        let problems: any[] = [];
                                        
                                        // MEJORA IMPORTANTE: Check all possible locations for problem details
                                        // Revisar primero en exercise.extra_data.problemDetails (nueva ubicación)
                                        if (exercise.extra_data && exercise.extra_data.problemDetails && Array.isArray(exercise.extra_data.problemDetails)) {
                                          problems = exercise.extra_data.problemDetails;
                                          console.log("✅ Encontrados problemas en extra_data.problemDetails");
                                        }
                                        // Luego intentar en otras ubicaciones por compatibilidad
                                        else if (exercise.extra_data && exercise.extra_data.mathProblems && Array.isArray(exercise.extra_data.mathProblems)) {
                                          problems = exercise.extra_data.mathProblems;
                                          console.log("✅ ENCONTRADOS PROBLEMAS en extra_data.mathProblems");
                                        }
                                        else if (exercise.extra_data && exercise.extra_data.problems && Array.isArray(exercise.extra_data.problems)) {
                                          problems = exercise.extra_data.problems;
                                          console.log("✅ ENCONTRADOS PROBLEMAS en extra_data.problems");
                                        }
                                        else if (exercise.extra_data && exercise.extra_data.exactProblems && Array.isArray(exercise.extra_data.exactProblems)) {
                                          problems = exercise.extra_data.exactProblems;
                                          console.log("✅ ENCONTRADOS PROBLEMAS en extra_data.exactProblems");
                                        }
                                        else if (exercise.extra_data && exercise.extra_data.capturedProblems && Array.isArray(exercise.extra_data.capturedProblems)) {
                                          problems = exercise.extra_data.capturedProblems;
                                          console.log("✅ ENCONTRADOS PROBLEMAS en extra_data.capturedProblems");
                                        }
                                        // Intentar en otras ubicaciones para compatibilidad con versiones antiguas
                                        else if (exercise.extra_data && exercise.extra_data.screenshot && 
                                            exercise.extra_data.screenshot.problemReview && 
                                            Array.isArray(exercise.extra_data.screenshot.problemReview)) {
                                          problems = exercise.extra_data.screenshot.problemReview;
                                          console.log("✅ Encontrados problemas en exercise.extra_data.screenshot.problemReview");
                                        }
                                        
                                        // Si no hay problemas, mostrar mensaje
                                        if (problems.length === 0) {
                                          console.log("⚠️ NO SE ENCONTRARON PROBLEMAS para este ejercicio");
                                          console.log("🔍 extra_data:", exercise.extra_data);
                                          return <p className="text-sm text-gray-500">No problem details available for this exercise.</p>;
                                        }
                                        
                                        // Renderizar los problemas encontrados
                                        return (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {problems.map((problem, idx) => {
                                              const isAnswerCorrect = problem.isCorrect !== undefined ? problem.isCorrect : 
                                                                      problem.status === "correct";
                                              
                                              return (
                                                <div 
                                                  key={idx} 
                                                  className={`p-3 rounded-lg border ${isAnswerCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                                                >
                                                  <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                      {/* Renderizar el problema usando ProblemRenderer si es posible */}
                                                      {problem.operands || problem.operation || problem.answer ? (
                                                        <ProblemRenderer problem={problem as MathProblem} />
                                                      ) : (
                                                        // Fallback plain text representation
                                                        <div>
                                                          <p className="text-sm font-medium">
                                                            {typeof problem === "string" 
                                                              ? problem 
                                                              : problem.problem || problem.text || JSON.stringify(problem)}
                                                          </p>
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className="ml-2">
                                                      {isAnswerCorrect ? (
                                                        <Check className="h-5 w-5 text-green-600" />
                                                      ) : (
                                                        <X className="h-5 w-5 text-red-600" />
                                                      )}
                                                    </div>
                                                  </div>
                                                  
                                                  {/* Mostrar la respuesta del usuario si está disponible */}
                                                  {problem.userAnswer && (
                                                    <div className="mt-1 text-xs">
                                                      <span className="font-medium">Your answer:</span> {problem.userAnswer}
                                                    </div>
                                                  )}
                                                  
                                                  {/* Mostrar la respuesta correcta si el problema fue incorrecto */}
                                                  {!isAnswerCorrect && problem.correctAnswer && (
                                                    <div className="mt-1 text-xs">
                                                      <span className="font-medium">Correct answer:</span> {problem.correctAnswer}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })()}
                                    </div>
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