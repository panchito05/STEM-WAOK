import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Trophy, CheckCircle2, Clock, Target, TrendingUp, Star, Award } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface ModuleResult {
  moduleId: string;
  moduleName: string;
  moduleColor: string;
  completed: boolean;
  correctAnswers: number;
  totalAnswers: number;
  timeSpent: number;
  accuracy: number;
}

interface SessionSummary {
  totalModules: number;
  completedModules: number;
  totalCorrect: number;
  totalAnswers: number;
  totalTime: number;
  overallAccuracy: number;
  moduleResults: ModuleResult[];
}

export default function MultiOperationsSummaryPage() {
  const [, setLocation] = useLocation();
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionData = urlParams.get('session');
    
    if (sessionData) {
      try {
        const data = JSON.parse(decodeURIComponent(sessionData));
        
        // Procesar los datos para crear el resumen
        const moduleResults: ModuleResult[] = data.progress.map((p: any) => {
          const module = data.config.modules.find((m: any) => m.id === p.moduleId);
          return {
            moduleId: p.moduleId,
            moduleName: module?.name || p.moduleId,
            moduleColor: module?.color || '#4287f5',
            completed: p.completed,
            correctAnswers: p.correctAnswers,
            totalAnswers: p.totalAnswers,
            timeSpent: p.timeSpent,
            accuracy: p.totalAnswers > 0 ? (p.correctAnswers / p.totalAnswers) * 100 : 0
          };
        });

        const totalCorrect = moduleResults.reduce((sum, m) => sum + m.correctAnswers, 0);
        const totalAnswers = moduleResults.reduce((sum, m) => sum + m.totalAnswers, 0);
        const totalTime = moduleResults.reduce((sum, m) => sum + m.timeSpent, 0);

        const summary: SessionSummary = {
          totalModules: data.config.modules.length,
          completedModules: moduleResults.filter(m => m.completed).length,
          totalCorrect,
          totalAnswers,
          totalTime,
          overallAccuracy: totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0,
          moduleResults
        };

        setSessionSummary(summary);
      } catch (error) {
        console.error('Error parsing session summary data:', error);
      }
    }
    
    setIsLoading(false);
  }, []);

  const goBack = () => {
    setLocation('/');
  };

  const getPerformanceMessage = (accuracy: number) => {
    if (accuracy >= 90) return { message: "¡Excelente trabajo!", color: "text-green-600", icon: Trophy };
    if (accuracy >= 80) return { message: "¡Muy bien hecho!", color: "text-blue-600", icon: Award };
    if (accuracy >= 70) return { message: "¡Buen trabajo!", color: "text-yellow-600", icon: Star };
    return { message: "¡Sigue practicando!", color: "text-orange-600", icon: Target };
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Procesando resultados...</p>
        </div>
      </div>
    );
  }

  if (!sessionSummary) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="border-red-200">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">No se pudieron cargar los resultados de la sesión.</p>
            <Button onClick={goBack} variant="outline">
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const performance = getPerformanceMessage(sessionSummary.overallAccuracy);
  const PerformanceIcon = performance.icon;

  return (
    <>
      <Helmet>
        <title>Resumen Multi-Operaciones - Math W+A+O+K</title>
        <meta name="description" content="Resumen completo de tu sesión de ejercicios multi-operaciones." />
      </Helmet>
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={goBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inicio
          </Button>
        </div>

        {/* Resumen Principal */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <PerformanceIcon className="w-8 h-8 text-yellow-500" />
              ¡Sesión Multi-Operaciones Completada!
            </CardTitle>
            <p className={`text-lg font-semibold ${performance.color}`}>
              {performance.message}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">
                  {sessionSummary.completedModules}/{sessionSummary.totalModules}
                </div>
                <div className="text-sm text-gray-600">Módulos Completados</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {sessionSummary.totalCorrect}/{sessionSummary.totalAnswers}
                </div>
                <div className="text-sm text-gray-600">Respuestas Correctas</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionSummary.overallAccuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Precisión General</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-600">
                  {formatTime(sessionSummary.totalTime)}
                </div>
                <div className="text-sm text-gray-600">Tiempo Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progreso General */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Progreso General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Precisión General</span>
                <span className="font-semibold">{sessionSummary.overallAccuracy.toFixed(1)}%</span>
              </div>
              <Progress value={sessionSummary.overallAccuracy} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Resultados por Módulo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Resultados por Operación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessionSummary.moduleResults.map((module) => (
                <div key={module.moduleId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: module.moduleColor }}
                      />
                      <h3 className="font-semibold">{module.moduleName}</h3>
                      {module.completed && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Completado
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{module.accuracy.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">
                        {module.correctAnswers}/{module.totalAnswers}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span>Respuestas: {module.correctAnswers} de {module.totalAnswers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>Tiempo: {formatTime(module.timeSpent)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <Progress value={module.accuracy} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botón para Nueva Sesión */}
        <div className="text-center mt-6">
          <Button 
            onClick={goBack}
            size="lg"
            className="text-lg px-8 py-3"
          >
            Iniciar Nueva Sesión
          </Button>
        </div>
      </div>
    </>
  );
}