// Demostración del Sistema de Recompensas
// Componente para probar y mostrar el funcionamiento del sistema modular

import React, { useState } from 'react';
import { useRewards, RewardModal, useRewardQueue, RewardUtils } from '@/rewards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Zap, Settings, RefreshCw } from 'lucide-react';

export function RewardSystemDemo() {
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [difficulty, setDifficulty] = useState('beginner');

  // Usar el hook del sistema de recompensas
  const rewards = useRewards({
    moduleId: 'addition',
    userId: 'demo-user',
    autoCheck: false // Deshabilitamos verificación automática para la demo
  });

  // Manejar la cola de recompensas
  const rewardQueue = useRewardQueue();

  // Simular completar un problema
  const handleSolveProblem = async () => {
    const newProblemsCount = problemsSolved + 1;
    const newStreak = currentStreak + 1;
    
    setProblemsSolved(newProblemsCount);
    setCurrentStreak(newStreak);

    // Simular cambio de nivel basado en problemas resueltos
    const newLevel = RewardUtils.calculateLevel(newProblemsCount);
    if (newLevel !== difficulty) {
      setDifficulty(newLevel);
    }

    // Crear datos de progreso simulados
    const progressData = RewardUtils.transformExerciseProgress({
      totalProblems: newProblemsCount,
      currentStreak: newStreak,
      difficulty: newLevel,
      operationId: 'addition',
      accuracy: 85 + Math.random() * 10, // Simular precisión realista
      avgTimePerProblem: 15 + Math.random() * 10
    });

    // Verificar por nuevas recompensas
    const newRewards = await rewards.checkForRewards(progressData);
    
    if (newRewards.length > 0) {
      rewardQueue.addToQueue(newRewards);
    }
  };

  // Simular fallar un problema
  const handleFailProblem = () => {
    setCurrentStreak(0);
  };

  // Resetear demo
  const handleReset = () => {
    setProblemsSolved(0);
    setCurrentStreak(0);
    setDifficulty('beginner');
    rewards.getMetrics(); // Actualizar métricas
  };

  const metrics = rewards.getMetrics();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎯 Sistema de Recompensas Modular
        </h1>
        <p className="text-gray-600">
          Demostración del sistema de recompensas para el módulo de suma
        </p>
      </div>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{problemsSolved}</div>
              <div className="text-sm text-gray-600">Problemas Resueltos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentStreak}</div>
              <div className="text-sm text-gray-600">Racha Actual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{rewards.totalPoints}</div>
              <div className="text-sm text-gray-600">Puntos Totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{rewards.newRewardsCount}</div>
              <div className="text-sm text-gray-600">Recompensas Nuevas</div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Badge variant="outline" className="capitalize">
              Nivel: {difficulty}
            </Badge>
          </div>
          
          <div className="flex justify-center">
            <Badge 
              variant={rewards.isEnabled ? "default" : "destructive"}
            >
              Sistema: {rewards.isEnabled ? "Habilitado" : "Deshabilitado"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Acciones de Simulación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Simular Ejercicios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={handleSolveProblem}
              className="bg-green-600 hover:bg-green-700"
            >
              ✅ Resolver Problema Correctamente
            </Button>
            <Button 
              onClick={handleFailProblem}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              ❌ Fallar Problema
            </Button>
            <Button 
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Resetear
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Simula resolver problemas para desbloquear recompensas basadas en hitos reales
          </div>
        </CardContent>
      </Card>

      {/* Métricas del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Métricas de Recompensas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">{metrics.totalRewardsUnlocked}</div>
              <div className="text-sm text-gray-600">Total Desbloqueadas</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">
                {(metrics.engagementScore * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Puntuación de Engagement</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">
                {metrics.lastRewardDate ? 
                  metrics.lastRewardDate.toLocaleDateString() : 
                  'Ninguna'
                }
              </div>
              <div className="text-sm text-gray-600">Última Recompensa</div>
            </div>
          </div>

          {/* Distribución por Rareza */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Distribución por Rareza:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(metrics.rewardsByRarity).map(([rarity, count]) => (
                <div key={rarity} className="text-center p-2 bg-white border rounded">
                  <div className="font-medium capitalize">{rarity}</div>
                  <div className="text-sm text-gray-600">{count || 0}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recompensas Recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Recompensas Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rewards.recentRewards.length > 0 ? (
            <div className="space-y-3">
              {rewards.recentRewards.map((reward) => (
                <div 
                  key={reward.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-2xl">{reward.icon || '🏆'}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{reward.name}</div>
                    <div className="text-sm text-gray-600">{reward.description}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="capitalize">
                      {reward.rarity}
                    </Badge>
                    <div className="text-sm text-green-600 font-medium">
                      +{reward.points} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <div>No hay recompensas aún</div>
              <div className="text-sm">¡Resuelve problemas para desbloquear recompensas!</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Recompensas */}
      <RewardModal
        reward={rewardQueue.currentReward}
        isOpen={rewardQueue.isModalOpen}
        onClose={rewardQueue.closeModal}
        onViewReward={rewards.markRewardAsViewed}
      />

      {/* Información de Estado del Sistema (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">🔧 Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div>Health Check: {JSON.stringify(rewards.performHealthCheck(), null, 2)}</div>
            <div>Queue Length: {rewardQueue.queueLength}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}