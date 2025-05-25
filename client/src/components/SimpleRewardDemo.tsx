import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Award, Star, Zap, Target, TrendingUp } from 'lucide-react';

export default function SimpleRewardDemo() {
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  // Recompensas predefinidas para demostración
  const availableRewards = [
    {
      id: 'first-steps',
      title: 'Primeros Pasos',
      description: 'Completaste tu primer problema',
      points: 10,
      rarity: 'common',
      icon: Star,
      unlockAt: 1,
      unlocked: problemsSolved >= 1
    },
    {
      id: 'milestone-10',
      title: 'Aprendiz Dedicado',
      description: 'Resolviste 10 problemas',
      points: 50,
      rarity: 'rare',
      icon: Target,
      unlockAt: 10,
      unlocked: problemsSolved >= 10
    },
    {
      id: 'milestone-25',
      title: 'Matemático en Progreso',
      description: 'Completaste 25 problemas',
      points: 100,
      rarity: 'epic',
      icon: Trophy,
      unlockAt: 25,
      unlocked: problemsSolved >= 25
    },
    {
      id: 'streak-master',
      title: 'Maestro de Rachas',
      description: 'Mantuviste una racha perfecta',
      points: 75,
      rarity: 'rare',
      icon: Zap,
      unlockAt: 15,
      unlocked: problemsSolved >= 15
    }
  ];

  const handleSolveProblem = () => {
    const newCount = problemsSolved + 1;
    const pointsEarned = Math.floor(Math.random() * 15) + 5; // 5-20 puntos aleatorios
    
    setProblemsSolved(newCount);
    setTotalPoints(prev => prev + pointsEarned);
  };

  const handleReset = () => {
    setProblemsSolved(0);
    setTotalPoints(0);
  };

  const unlockedRewards = availableRewards.filter(r => r.unlocked);
  const nextReward = availableRewards.find(r => !r.unlocked);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎯 Sistema de Recompensas
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          ¡Gana recompensas mientras practicas matemáticas! Resuelve problemas para desbloquear logros y ganar puntos.
        </p>
      </div>

      {/* Panel de Estado Actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-600">{problemsSolved}</CardTitle>
            <CardDescription>Problemas Resueltos</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">{totalPoints}</CardTitle>
            <CardDescription>Puntos Totales</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-600">{unlockedRewards.length}</CardTitle>
            <CardDescription>Recompensas Desbloqueadas</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Controles de Simulación */}
      <div className="text-center mb-8">
        <Button 
          onClick={handleSolveProblem}
          className="mx-2 bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          ✅ Resolver Problema
        </Button>
        <Button 
          onClick={handleReset}
          variant="outline"
          className="mx-2"
          size="lg"
        >
          🔄 Reiniciar Demo
        </Button>
      </div>

      {/* Próxima Recompensa */}
      {nextReward && (
        <Card className="mb-8 border-dashed border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Próxima Recompensa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{nextReward.title}</h3>
                <p className="text-gray-600">{nextReward.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {problemsSolved}/{nextReward.unlockAt} problemas
                </p>
                <Progress 
                  value={(problemsSolved / nextReward.unlockAt) * 100} 
                  className="w-32 mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Todas las Recompensas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableRewards.map((reward) => {
          const IconComponent = reward.icon;
          
          return (
            <Card 
              key={reward.id} 
              className={`transition-all ${
                reward.unlocked 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent 
                      className={`h-8 w-8 ${
                        reward.unlocked ? 'text-green-600' : 'text-gray-400'
                      }`} 
                    />
                    <div>
                      <CardTitle className="text-lg">{reward.title}</CardTitle>
                      <CardDescription>{reward.description}</CardDescription>
                    </div>
                  </div>
                  {reward.unlocked && (
                    <div className="text-green-600 font-bold text-lg">
                      ✓
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge className={getRarityColor(reward.rarity)}>
                    {reward.rarity.toUpperCase()}
                  </Badge>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">+{reward.points} puntos</p>
                    <p className="text-sm text-gray-500">
                      Desbloquear en: {reward.unlockAt} problemas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {unlockedRewards.length === availableRewards.length && (
        <div className="text-center mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-yellow-800 mb-2">
            ¡Felicitaciones!
          </h3>
          <p className="text-yellow-700">
            Has desbloqueado todas las recompensas disponibles en esta demostración.
          </p>
        </div>
      )}
    </div>
  );
}