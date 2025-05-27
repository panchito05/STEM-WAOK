import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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
            moduleColor: module?.color || '#3B82F6',
            completed: p.completed,
            correctAnswers: p.correctAnswers,
            totalAnswers: p.totalAnswers,
            timeSpent: p.timeSpent,
            accuracy: p.totalAnswers > 0 ? (p.correctAnswers / p.totalAnswers) * 100 : 0
          };
        });

        // Calcular totales
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing results...</p>
        </div>
      </div>
    );
  }

  if (!sessionSummary) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="border border-red-200 rounded-lg p-8 text-center bg-red-50">
          <p className="text-red-600 mb-4">Could not load session results.</p>
          <Button onClick={goBack} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Multi-Operations Summary - Math W+A+O+K</title>
        <meta name="description" content="Complete summary of your multi-operations exercise session." />
      </Helmet>
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={goBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Resumen Principal - Formato similar al de ejercicio individual */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Multi-Operations Exercise Complete!
          </h2>

          {/* Tiempo total */}
          <div className="bg-gray-100 p-3 rounded-lg mb-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Total Time</div>
            <div className="text-xl font-bold">{formatTime(sessionSummary.totalTime)}</div>
          </div>

          {/* Grid de estadísticas combinadas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg shadow-sm text-center border border-blue-100">
              <div className="text-sm text-gray-600 mb-1">Score</div>
              <div className="text-xl text-blue-600 font-semibold">
                {sessionSummary.totalCorrect}/{sessionSummary.totalAnswers} ({Math.round(sessionSummary.overallAccuracy)}%)
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg shadow-sm text-center border border-green-100">
              <div className="text-sm text-gray-600 mb-1">Accuracy</div>
              <div className="text-xl text-green-600 font-semibold">{Math.round(sessionSummary.overallAccuracy)}%</div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg shadow-sm text-center border border-purple-100">
              <div className="text-sm text-gray-600 mb-1">Avg. Time</div>
              <div className="text-xl text-purple-600 font-semibold">
                {sessionSummary.totalAnswers > 0 ? Math.round(sessionSummary.totalTime / sessionSummary.totalAnswers) : 0}s
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg shadow-sm text-center border border-amber-100">
              <div className="text-sm text-gray-600 mb-1">Modules</div>
              <div className="text-xl text-amber-600 font-semibold">{sessionSummary.completedModules}</div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg shadow-sm text-center border border-red-100 col-span-2">
              <div className="text-sm text-gray-600 mb-1">Operations</div>
              <div className="text-xl text-red-600 font-semibold">
                {sessionSummary.moduleResults.map(m => m.moduleName).join(', ')}
              </div>
            </div>
          </div>

          {/* Sección de revisión de problemas por módulo */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Module Review</h3>
            <div className="space-y-3">
              {sessionSummary.moduleResults.map((moduleResult) => (
                <div key={moduleResult.moduleId} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-lg capitalize">{moduleResult.moduleName}</h4>
                    <div className={`px-2 py-1 rounded text-sm font-semibold ${
                      moduleResult.accuracy >= 90 ? 'bg-green-100 text-green-700' :
                      moduleResult.accuracy >= 70 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Math.round(moduleResult.accuracy)}%
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>Score: {moduleResult.correctAnswers}/{moduleResult.totalAnswers}</div>
                    <div>Time: {formatTime(moduleResult.timeSpent)}</div>
                    <div>Avg: {moduleResult.totalAnswers > 0 ? Math.round(moduleResult.timeSpent / moduleResult.totalAnswers) : 0}s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Button onClick={goBack} className="w-full sm:w-auto">
              Try Again
            </Button>
            <Button variant="outline" onClick={goBack} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}