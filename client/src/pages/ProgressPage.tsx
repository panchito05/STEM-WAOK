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
// Importar el componente de modal de detalles
import ExerciseDetailsModal from "@/components/ExerciseDetailsModal";
import { clearAllDOMSnapshots } from "@/services/DOMCapture";

export default function ProgressPage() {
  const { exerciseHistory, moduleProgress, clearProgress, refreshProgress, isLoading } = useProgress();
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [selectedExercise, setSelectedExercise] = useState<ExerciseResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    try {
      // Limpiar también los snapshots DOM guardados
      clearAllDOMSnapshots();
      
      // Limpiar todo el progreso
      await clearProgress();
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("Error al borrar progreso:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleOpenExerciseDetails = (exercise: ExerciseResult) => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  // Filtrar los ejercicios recientes para la vista de tabla
  const recentExercises = [...exerciseHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 20);
  
  // Preparar datos para el gráfico
  const getOperationName = (id: string) => {
    const module = operationModules.find(m => m.id === id);
    return module?.name || id;
  };

  // Obtener los últimos 30 días para el gráfico de tendencia
  const last30DaysData = Array.from({ length: 30 }).map((_, index) => {
    const date = subDays(new Date(), 29 - index);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayExercises = exerciseHistory.filter(ex => 
      ex.date && typeof ex.date === 'string' && ex.date.startsWith(dateStr)
    );
    
    return {
      date: dateStr,
      count: dayExercises.length,
      avgScore: dayExercises.length > 0 
        ? Math.round(dayExercises.reduce((sum, ex) => sum + (ex.score / ex.totalProblems * 100), 0) / dayExercises.length) 
        : 0
    };
  });

  // Datos por operación
  const operationStatsData = operationModules.map(module => {
    const moduleExercises = exerciseHistory.filter(ex => ex.operationId === module.id);
    const totalExercises = moduleExercises.length;
    const totalProblems = moduleExercises.reduce((sum, ex) => sum + ex.totalProblems, 0);
    const totalCorrect = moduleExercises.reduce((sum, ex) => sum + ex.score, 0);
    const accuracy = totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;
    
    return {
      name: module.name,
      exerciseCount: totalExercises,
      problemCount: totalProblems,
      accuracy
    };
  }).filter(stats => stats.exerciseCount > 0);

  return (
    <>
      <Helmet>
        <title>Tu Progreso - Math W.A.O.K.</title>
      </Helmet>

      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tu Progreso</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isRefreshing}
              onClick={handleRefresh}
              className="flex items-center gap-1"
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Actualizar Datos
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Borrar Todo el Progreso</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Borrará todo tu historial de ejercicios y recompensas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleClearProgress}
                    disabled={isClearing}
                  >
                    {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Borrar Todo'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Última actualización: {lastUpdateTime.toLocaleString()}
        </p>

        {exerciseHistory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-gray-500 mb-4">No tienes ejercicios completados todavía.</p>
              <p className="text-sm text-gray-400">¡Completa algunos ejercicios para comenzar a ver tu progreso!</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="recent">
            <TabsList className="mb-4">
              <TabsTrigger value="recent">Ejercicios Recientes</TabsTrigger>
              <TabsTrigger value="trends">Tendencias</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent">
              <Card>
                <CardHeader>
                  <CardTitle>Ejercicios Recientes</CardTitle>
                  <CardDescription>
                    Los últimos {recentExercises.length} ejercicios que has completado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          <th className="px-4 py-2 text-left">Fecha</th>
                          <th className="px-4 py-2 text-left">Operación</th>
                          <th className="px-4 py-2 text-left">Dificultad</th>
                          <th className="px-4 py-2 text-left">Puntuación</th>
                          <th className="px-4 py-2 text-left">Tiempo</th>
                          <th className="px-4 py-2 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentExercises.map((exercise: ExerciseResult, index: number) => (
                          <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="px-4 py-3">
                              {new Date(exercise.date).toLocaleString('es-ES', { 
                                dateStyle: 'medium', 
                                timeStyle: 'short' 
                              })}
                            </td>
                            <td className="px-4 py-3">{getOperationName(exercise.operationId)}</td>
                            <td className="px-4 py-3">
                              {exercise.difficulty === 'beginner' && 'Principiante'}
                              {exercise.difficulty === 'elementary' && 'Elemental'}
                              {exercise.difficulty === 'intermediate' && 'Intermedio'}
                              {exercise.difficulty === 'advanced' && 'Avanzado'}
                              {exercise.difficulty === 'expert' && 'Experto'}
                            </td>
                            <td className="px-4 py-3">
                              {exercise.score}/{exercise.totalProblems}
                              <span className="ml-2 text-xs text-gray-500">
                                ({Math.round(exercise.score / exercise.totalProblems * 100)}%)
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {Math.round(exercise.timeSpent)}s
                            </td>
                            <td className="px-4 py-3">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOpenExerciseDetails(exercise)}
                              >
                                Ver Detalles
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Tendencias de Práctica</CardTitle>
                  <CardDescription>
                    Tu actividad y desempeño durante los últimos 30 días
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={last30DaysData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => format(parseISO(value), 'dd/MM')}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'avgScore') return [`${value}%`, 'Precisión'];
                            return [value, 'Ejercicios'];
                          }}
                          labelFormatter={(label) => format(parseISO(label), 'dd/MM/yyyy')}
                        />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="count" 
                          name="Ejercicios" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="avgScore" 
                          name="Precisión" 
                          stroke="#82ca9d" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas por Operación</CardTitle>
                  <CardDescription>
                    Tu desempeño en diferentes tipos de operaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={operationStatsData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="exerciseCount" name="Ejercicios" fill="#8884d8" />
                        <Bar dataKey="problemCount" name="Problemas" fill="#82ca9d" />
                        <Bar dataKey="accuracy" name="Precisión (%)" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Componente de detalles del ejercicio */}
      <ExerciseDetailsModal
        exercise={selectedExercise}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}