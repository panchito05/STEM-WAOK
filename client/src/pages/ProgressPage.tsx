import { useState } from "react";
import { Helmet } from "react-helmet";
import { useProgress, ExerciseResult } from "@/context/ProgressContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { operationModules } from "@/utils/operationComponents";
import { Loader2 } from "lucide-react";

export default function ProgressPage() {
  const { exerciseHistory, moduleProgress, clearProgress, isLoading } = useProgress();
  const [isClearing, setIsClearing] = useState(false);
  
  // Nos aseguramos de que exerciseHistory y moduleProgress siempre sean objetos válidos
  const safeExerciseHistory = Array.isArray(exerciseHistory) ? exerciseHistory : [];
  const safeModuleProgress = moduleProgress || {};

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
    // Usamos safeExerciseHistory para garantizar que siempre es un array 
    const dayResults = safeExerciseHistory.filter(result => {
      if (!result || !result.date) return false;
      try {
        const resultDate = parseISO(result.date);
        return (
          resultDate.getDate() === day.dateObj.getDate() &&
          resultDate.getMonth() === day.dateObj.getMonth() &&
          resultDate.getFullYear() === day.dateObj.getFullYear()
        );
      } catch (error) {
        console.error("Error al procesar fecha:", error, result);
        return false;
      }
    });

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
    .filter(module => !module.comingSoon && module.id)
    .map(module => {
      // Verificación de seguridad para asegurar que existe moduleProgress y tiene el id del módulo
      const progress = safeModuleProgress && module.id ? safeModuleProgress[module.id] : undefined;
      return {
        name: module.displayName || module.id,
        completed: progress?.totalCompleted || 0,
        accuracy: progress?.averageScore ? Math.round(progress.averageScore * 100) : 0,
        color: getModuleColor(module.id)
      };
    });

  // Recent exercises list
  const recentExercises = [...safeExerciseHistory]
    .filter(exercise => exercise && exercise.date) // Filtramos solo ejercicios válidos
    .sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (error) {
        return 0; // En caso de error en la fecha, mantener orden
      }
    })
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
        <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-6 overflow-hidden">
          {/* Background pattern similar to DraggableModuleCard */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="progress-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#progress-grid)" />
            </svg>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between relative z-10">
            <div>
              <h1 className="text-2xl font-bold text-white text-shadow">Your Progress</h1>
              <p className="text-white text-opacity-90">Track your math learning journey</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="mt-4 md:mt-0 bg-white/20 hover:bg-white/30 text-white border-white/30" 
                  disabled={isClearing || !exerciseHistory || !Array.isArray(exerciseHistory) || exerciseHistory.length === 0}
                >
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
                  This action cannot be undone. This will permanently delete all your progress data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearProgress}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        {safeExerciseHistory.length === 0 ? (
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
          <Tabs defaultValue="overview">
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
                  .filter(module => !module.comingSoon && module.id)
                  .map(module => {
                    const progress = safeModuleProgress[module.id || ""];
                    return (
                      <Card key={module.id}>
                        <CardHeader>
                          <CardTitle>{module.displayName}</CardTitle>
                          <CardDescription>Module performance details</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Exercises Completed</p>
                                <p className="text-2xl font-bold">{progress?.totalCompleted || 0}</p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Average Score</p>
                                <p className="text-2xl font-bold">
                                  {progress?.averageScore 
                                    ? `${Math.round(progress.averageScore * 100)}%` 
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Best Score</p>
                                <p className="text-2xl font-bold">
                                  {progress?.bestScore 
                                    ? `${Math.round(progress.bestScore * 100)}%` 
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Average Time</p>
                                <p className="text-2xl font-bold">
                                  {progress?.averageTime 
                                    ? `${Math.round(progress.averageTime)}s` 
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                              <a href={`/operation/${module.id}`}>Practice Again</a>
                            </Button>
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
                        </tr>
                      </thead>
                      <tbody>
                        {recentExercises.length > 0 ? (
                          recentExercises.map((exercise: ExerciseResult, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="py-3 px-4">
                                {exercise.date ? format(new Date(exercise.date), "MMM dd, yyyy HH:mm") : "N/A"}
                              </td>
                              <td className="py-3 px-4">{getModuleName(exercise.operationId || "")}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyBadgeClass(exercise.difficulty || "beginner")}`}>
                                  {exercise.difficulty 
                                    ? exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1) 
                                    : "Beginner"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {exercise.score !== undefined ? exercise.score : 0}/
                                {exercise.totalProblems || 0} 
                                ({exercise.totalProblems && exercise.score !== undefined
                                  ? Math.round((exercise.score / exercise.totalProblems) * 100)
                                  : 0}%)
                              </td>
                              <td className="py-3 px-4">{exercise.timeSpent || 0}s</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              No se encontró historial de ejercicios. ¡Completa algunos ejercicios para ver tu progreso!
                            </td>
                          </tr>
                        )}
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
