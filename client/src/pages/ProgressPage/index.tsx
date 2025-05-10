import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useProgress } from "@/context/ProgressContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, Clock, Award, BarChart2, TrendingUp, Users } from "lucide-react";
import { subDays, parseISO } from "date-fns";
import { operationModules } from "@/utils/operationComponents";

// Importar componentes de gráficos
import { ScoreTrendChart } from "./components/charts/ScoreTrendChart";
import { AccuracyChart } from "./components/charts/AccuracyChart";
import { TimeDistributionChart } from "./components/charts/TimeDistributionChart";
import { SkillRadarChart } from "./components/charts/SkillRadarChart";
import { StatCard } from "./components/StatCard";
import { ExerciseList } from "./components/ExerciseList";
import { FilterControls } from "./components/FilterControls";

export default function ProgressPage() {
  const { exerciseHistory, moduleProgress, clearProgress, isLoading } = useProgress();
  const [isClearing, setIsClearing] = useState(false);
  const [timeRange, setTimeRange] = useState("30days");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Si no hay datos o está cargando
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

  // Filtrar los datos según el rango de tiempo seleccionado
  const filteredExercises = useMemo(() => {
    if (exerciseHistory.length === 0) return [];

    let filtered = [...exerciseHistory];
    
    // Si hay un rango de fechas personalizado
    if (dateRange.from) {
      const start = new Date(dateRange.from);
      start.setHours(0, 0, 0, 0);
      
      let end;
      if (dateRange.to) {
        end = new Date(dateRange.to);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date();
      }
      
      filtered = filtered.filter(ex => {
        const date = parseISO(ex.date);
        return date >= start && date <= end;
      });
    } 
    // Si no hay rango personalizado, usar el selector predefinido
    else {
      let cutoffDate = new Date();
      
      switch (timeRange) {
        case "7days":
          cutoffDate = subDays(new Date(), 7);
          break;
        case "30days":
          cutoffDate = subDays(new Date(), 30);
          break;
        case "90days":
          cutoffDate = subDays(new Date(), 90);
          break;
        case "year":
          cutoffDate = subDays(new Date(), 365);
          break;
        case "all":
        case "custom":
          // No filtrar
          return filtered;
      }
      
      filtered = filtered.filter(ex => parseISO(ex.date) >= cutoffDate);
    }
    
    return filtered;
  }, [exerciseHistory, timeRange, dateRange]);

  // Calcular estadísticas generales
  const overallStats = useMemo(() => {
    if (filteredExercises.length === 0) {
      return {
        totalExercises: 0,
        totalProblems: 0,
        correctlyAnswered: 0,
        averageAccuracy: 0,
        averageTime: 0,
        totalTimeSpent: 0,
        accuracyTrend: 0,
        timeTrend: 0,
      };
    }

    // Todos los ejercicios
    const totalExercises = filteredExercises.length;
    const totalProblems = filteredExercises.reduce((sum, ex) => sum + ex.totalProblems, 0);
    const correctlyAnswered = filteredExercises.reduce((sum, ex) => sum + ex.score, 0);
    const totalTimeSpent = filteredExercises.reduce((sum, ex) => sum + ex.timeSpent, 0);
    
    // Promedios
    const averageAccuracy = Math.round((correctlyAnswered / totalProblems) * 100);
    const averageTime = Math.round(totalTimeSpent / totalExercises);
    
    // Calcular tendencias comparando la primera y segunda mitad de los datos
    const sortedByDate = [...filteredExercises].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (sortedByDate.length >= 4) {
      const midPoint = Math.floor(sortedByDate.length / 2);
      const firstHalf = sortedByDate.slice(0, midPoint);
      const secondHalf = sortedByDate.slice(midPoint);
      
      const firstHalfAccuracy = 
        firstHalf.reduce((sum, ex) => sum + ex.score, 0) / 
        firstHalf.reduce((sum, ex) => sum + ex.totalProblems, 0);
      
      const secondHalfAccuracy = 
        secondHalf.reduce((sum, ex) => sum + ex.score, 0) / 
        secondHalf.reduce((sum, ex) => sum + ex.totalProblems, 0);
      
      const firstHalfAvgTime = 
        firstHalf.reduce((sum, ex) => sum + ex.timeSpent, 0) / firstHalf.length;
      
      const secondHalfAvgTime = 
        secondHalf.reduce((sum, ex) => sum + ex.timeSpent, 0) / secondHalf.length;
      
      // Calcular cambio porcentual
      const accuracyTrend = Math.round(((secondHalfAccuracy - firstHalfAccuracy) / firstHalfAccuracy) * 100);
      
      // Para el tiempo, un valor negativo es bueno (más rápido)
      const timeTrend = Math.round(((firstHalfAvgTime - secondHalfAvgTime) / firstHalfAvgTime) * 100);
      
      return {
        totalExercises,
        totalProblems,
        correctlyAnswered,
        averageAccuracy,
        averageTime,
        totalTimeSpent,
        accuracyTrend,
        timeTrend,
      };
    }
    
    return {
      totalExercises,
      totalProblems,
      correctlyAnswered,
      averageAccuracy,
      averageTime,
      totalTimeSpent,
      accuracyTrend: 0,
      timeTrend: 0,
    };
  }, [filteredExercises]);

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    if (range !== "custom") {
      setDateRange({ from: undefined, to: undefined });
    }
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    if (range.from || range.to) {
      setTimeRange("custom");
    }
  };

  return (
    <>
      <Helmet>
        <title>Tu Progreso - Math W+A+O+K</title>
        <meta
          name="description"
          content="Analiza tu progreso de aprendizaje matemático y visualiza tu rendimiento con estadísticas detalladas."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tu Progreso</h1>
            <p className="text-gray-600">Sigue tu aprendizaje matemático con análisis detallado</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <FilterControls
              onTimeRangeChange={handleTimeRangeChange}
              onDateRangeChange={handleDateRangeChange}
            />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="ml-4"
                  disabled={isClearing || exerciseHistory.length === 0}
                >
                  {isClearing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Borrando...
                    </>
                  ) : (
                    "Borrar Progreso"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos de progreso.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearProgress}>
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {exerciseHistory.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  No hay datos de progreso todavía
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Completa ejercicios para comenzar a seguir tu progreso
                </p>
                <Button className="mt-4" asChild>
                  <a href="/">Comenzar un Ejercicio</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredExercises.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  No hay datos para el período seleccionado
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Intenta seleccionar un rango de tiempo diferente
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="dashboard">
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="analysis">Análisis Detallado</TabsTrigger>
              <TabsTrigger value="history">Historial de Ejercicios</TabsTrigger>
            </TabsList>

            {/* Panel de Dashboard */}
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                  title="Precisión General"
                  value={`${overallStats.averageAccuracy}%`}
                  trend={overallStats.accuracyTrend}
                  icon={<Activity className="h-5 w-5 text-blue-600" />}
                />
                <StatCard
                  title="Tiempo Promedio"
                  value={`${overallStats.averageTime}s`}
                  trend={overallStats.timeTrend}
                  icon={<Clock className="h-5 w-5 text-green-600" />}
                />
                <StatCard
                  title="Ejercicios Completados"
                  value={`${overallStats.totalExercises}`}
                  icon={<Award className="h-5 w-5 text-amber-600" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="h-96">
                  <CardHeader>
                    <CardTitle>Precisión a lo largo del tiempo</CardTitle>
                    <CardDescription>
                      Tu puntuación en cada módulo durante el período
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)]">
                    <ScoreTrendChart data={filteredExercises} />
                  </CardContent>
                </Card>

                <Card className="h-96">
                  <CardHeader>
                    <CardTitle>Análisis de habilidades</CardTitle>
                    <CardDescription>
                      Comparativa entre precisión, velocidad y experiencia
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)]">
                    <SkillRadarChart moduleProgress={moduleProgress} />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-96">
                  <CardHeader>
                    <CardTitle>Comparación de módulos</CardTitle>
                    <CardDescription>
                      Precisión por tipo de operación
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)]">
                    <AccuracyChart moduleProgress={moduleProgress} />
                  </CardContent>
                </Card>

                <Card className="h-96">
                  <CardHeader>
                    <CardTitle>Tiempos de resolución</CardTitle>
                    <CardDescription>
                      Velocidad promedio por tipo de operación
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)]">
                    <TimeDistributionChart moduleProgress={moduleProgress} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Panel de Análisis */}
            <TabsContent value="analysis">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {operationModules
                  .filter(module => !module.comingSoon)
                  .map(module => {
                    const progress = moduleProgress[module.id];
                    
                    // Filtrar ejercicios para este módulo específico
                    const moduleExercises = filteredExercises.filter(
                      ex => ex.operationId === module.id
                    );
                    
                    // Contar repeticiones por nivel de dificultad
                    const difficultyStats = moduleExercises.reduce(
                      (acc: Record<string, number>, ex) => {
                        acc[ex.difficulty] = (acc[ex.difficulty] || 0) + 1;
                        return acc;
                      },
                      {}
                    );
                    
                    // Encontrar la dificultad más frecuente
                    let mostFrequentDifficulty = "";
                    let maxCount = 0;
                    
                    Object.entries(difficultyStats).forEach(([diff, count]) => {
                      if (count > maxCount) {
                        mostFrequentDifficulty = diff;
                        maxCount = count;
                      }
                    });
                    
                    // Si hay al menos un ejercicio, calcular mejora de precisión
                    let accuracyTrend = 0;
                    
                    if (moduleExercises.length >= 4) {
                      // Ordenar por fecha
                      const sorted = [...moduleExercises].sort(
                        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                      );
                      
                      const midPoint = Math.floor(sorted.length / 2);
                      const firstHalf = sorted.slice(0, midPoint);
                      const secondHalf = sorted.slice(midPoint);
                      
                      const firstHalfAccuracy =
                        firstHalf.reduce((sum, ex) => sum + ex.score, 0) /
                        firstHalf.reduce((sum, ex) => sum + ex.totalProblems, 0);
                      
                      const secondHalfAccuracy =
                        secondHalf.reduce((sum, ex) => sum + ex.score, 0) /
                        secondHalf.reduce((sum, ex) => sum + ex.totalProblems, 0);
                      
                      accuracyTrend = Math.round(
                        ((secondHalfAccuracy - firstHalfAccuracy) / firstHalfAccuracy) * 100
                      );
                    }

                    return (
                      <Card key={module.id}>
                        <CardHeader>
                          <CardTitle>{module.displayName}</CardTitle>
                          <CardDescription>
                            Análisis detallado de rendimiento
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Completados</p>
                                <p className="text-2xl font-bold">
                                  {progress?.totalCompleted || 0}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Precisión</p>
                                <p className="text-2xl font-bold">
                                  {progress?.averageScore
                                    ? `${Math.round(progress.averageScore * 100)}%`
                                    : "N/A"}
                                </p>
                                {accuracyTrend !== 0 && (
                                  <div className={`text-sm ${accuracyTrend > 0 ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
                                    {accuracyTrend > 0 ? (
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                    ) : (
                                      <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                                    )}
                                    {accuracyTrend > 0 ? '+' : ''}{accuracyTrend}%
                                  </div>
                                )}
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Tiempo Medio</p>
                                <p className="text-2xl font-bold">
                                  {progress?.averageTime
                                    ? `${Math.round(progress.averageTime)}s`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Nivel Más Usado</p>
                                <p className="text-2xl font-bold capitalize">
                                  {mostFrequentDifficulty || "N/A"}
                                </p>
                              </div>
                            </div>
                            
                            <Button variant="outline" className="w-full" asChild>
                              <a href={`/operation/${module.id}`}>Practicar</a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>

            {/* Panel de Historial */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Ejercicios</CardTitle>
                  <CardDescription>
                    Revisa tus ejercicios completados durante el período seleccionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExerciseList exercises={filteredExercises} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}