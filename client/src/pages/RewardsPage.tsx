import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { ArrowLeft, Star, Trophy, Zap, Target, Award } from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'milestone' | 'streak';
  icon: string;
  timestamp: number;
}

interface RewardStats {
  totalPoints: number;
  unlockedRewards: Reward[];
  completedMilestones: number[];
  completedStreaks: number[];
}

export default function RewardsPage() {
  const [rewardStats, setRewardStats] = useState<RewardStats>({
    totalPoints: 0,
    unlockedRewards: [],
    completedMilestones: [],
    completedStreaks: []
  });

  useEffect(() => {
    // Cargar datos de recompensas desde localStorage
    const loadRewardStats = () => {
      try {
        const saved = localStorage.getItem('addition_rewards');
        if (saved) {
          const parsed = JSON.parse(saved);
          setRewardStats({
            totalPoints: parsed.totalPoints || 0,
            unlockedRewards: parsed.unlockedRewards || [],
            completedMilestones: parsed.completedMilestones || [],
            completedStreaks: parsed.completedStreaks || []
          });
        }
      } catch (error) {
        console.warn('Error cargando estadísticas de recompensas:', error);
      }
    };

    loadRewardStats();
  }, []);

  const clearAllRewards = () => {
    if (confirm('¿Estás seguro de que quieres borrar todas las recompensas? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('addition_rewards');
      setRewardStats({
        totalPoints: 0,
        unlockedRewards: [],
        completedMilestones: [],
        completedStreaks: []
      });
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <Target className="h-5 w-5" />;
      case 'streak':
        return <Zap className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/operation/addition">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Ejercicios
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Mis Recompensas
          </h1>
        </div>
        <Button variant="destructive" size="sm" onClick={clearAllRewards}>
          Borrar Todo
        </Button>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-yellow-500" />
              Puntos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {rewardStats.totalPoints}
            </div>
            <p className="text-sm text-gray-600 mt-1">puntos acumulados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-500" />
              Hitos Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {rewardStats.completedMilestones.length}
            </div>
            <p className="text-sm text-gray-600 mt-1">objetivos alcanzados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-purple-500" />
              Rachas Logradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {rewardStats.completedStreaks.length}
            </div>
            <p className="text-sm text-gray-600 mt-1">rachas conseguidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de recompensas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-green-500" />
            Historial de Recompensas
          </CardTitle>
          <CardDescription>
            Todas las recompensas que has desbloqueado durante tus ejercicios de matemáticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rewardStats.unlockedRewards.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                ¡Aún no tienes recompensas!
              </h3>
              <p className="text-gray-500 mb-4">
                Resuelve ejercicios de suma para desbloquear tu primera recompensa
              </p>
              <Link href="/operation/addition">
                <Button>
                  Empezar a Practicar
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {rewardStats.unlockedRewards
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((reward, index) => (
                  <div
                    key={reward.id || index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{reward.icon}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {reward.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {reward.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(reward.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={reward.type === 'milestone' ? 'default' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        {getRewardIcon(reward.type)}
                        {reward.type === 'milestone' ? 'Hito' : 'Racha'}
                      </Badge>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-600">
                          +{reward.points}
                        </div>
                        <div className="text-xs text-gray-500">puntos</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}