import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Eye, Play, Shuffle } from 'lucide-react';
import { useModuleStore, useModuleFavorites } from "@/store/moduleStore";
import { operationModules } from "@/utils/operationComponents";

export default function MultiOperationsButtons() {
  const [, setLocation] = useLocation();
  const { hiddenModules } = useModuleStore();
  const { favoriteModules } = useModuleFavorites();

  // Contar módulos disponibles
  const favoritesCount = operationModules.filter(module => 
    favoriteModules.includes(module.id)
  ).length;

  const visibleCount = operationModules.filter(module => 
    !hiddenModules.includes(module.id)
  ).length;

  const handleStartFavorites = () => {
    setLocation('/multi-operations?mode=favorites');
  };

  const handleStartVisible = () => {
    setLocation('/multi-operations?mode=visible');
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 mb-6">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-purple-800 mb-2 flex items-center justify-center gap-2">
            <Shuffle className="w-5 h-5" />
            Ejercicios Multi-Operaciones
          </h2>
          <p className="text-purple-600 text-sm">
            Practica múltiples operaciones matemáticas en una sola sesión personalizada
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Botón para favoritas */}
          <div className="space-y-2">
            <Button
              onClick={handleStartFavorites}
              disabled={favoritesCount === 0}
              className="w-full h-auto p-4 bg-yellow-500 hover:bg-yellow-600 text-white border-0"
              size="lg"
            >
              <div className="flex flex-col items-center gap-2">
                <Star className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold">Solo Operaciones Favoritas</div>
                  <div className="text-xs opacity-90">
                    {favoritesCount > 0 ? (
                      `${favoritesCount} operación${favoritesCount !== 1 ? 'es' : ''} marcada${favoritesCount !== 1 ? 's' : ''}`
                    ) : (
                      'Marca algunas como favoritas primero'
                    )}
                  </div>
                </div>
              </div>
            </Button>
            
            <p className="text-xs text-gray-600 text-center">
              Practica únicamente las operaciones que has marcado con ⭐
            </p>
          </div>

          {/* Botón para visibles */}
          <div className="space-y-2">
            <Button
              onClick={handleStartVisible}
              disabled={visibleCount === 0}
              className="w-full h-auto p-4 bg-blue-500 hover:bg-blue-600 text-white border-0"
              size="lg"
            >
              <div className="flex flex-col items-center gap-2">
                <Eye className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold">Todas las Operaciones Visibles</div>
                  <div className="text-xs opacity-90">
                    {visibleCount > 0 ? (
                      `${visibleCount} operación${visibleCount !== 1 ? 'es' : ''} visible${visibleCount !== 1 ? 's' : ''}`
                    ) : (
                      'Haz visible al menos una operación'
                    )}
                  </div>
                </div>
              </div>
            </Button>
            
            <p className="text-xs text-gray-600 text-center">
              Practica todas las operaciones que no has ocultado
            </p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
          <div className="flex items-start gap-2">
            <Play className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-purple-700">
              <strong>Características:</strong> Cada operación mantiene su configuración individual • 
              Problemas en orden aleatorio • Progreso guardado automáticamente • 
              Respeta temporizadores y niveles de dificultad
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}