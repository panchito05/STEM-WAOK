import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AdvancedMetricsTooltipProps {
  metric: 'streaks' | 'progressRate' | 'difficulty' | 'performance';
  data?: {
    currentStreak?: number;
    bestStreak?: number;
    recentAccuracy?: number[];
    improvementRate?: number;
    difficultyProgression?: string[];
  };
  className?: string;
}

export const AdvancedMetricsTooltip: React.FC<AdvancedMetricsTooltipProps> = ({
  metric,
  data,
  className = ""
}) => {
  const getProgressIcon = (rate: number) => {
    if (rate > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (rate < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-600" />;
  };

  const getTooltipContent = () => {
    switch (metric) {
      case 'streaks':
        return (
          <div className="max-w-sm space-y-2">
            <h4 className="font-semibold text-sm">Sistema de Rachas</h4>
            <p className="text-xs">
              Las rachas miden tu consistencia al resolver problemas correctamente.
            </p>
            {data && (
              <div className="text-xs border-t pt-2 space-y-1">
                <p>• Racha actual: <span className="font-medium text-blue-600">{data.currentStreak || 0}</span></p>
                <p>• Mejor racha: <span className="font-medium text-green-600">{data.bestStreak || 0}</span></p>
                <div className="bg-gray-50 p-2 rounded mt-2">
                  <p className="font-medium">Cómo funcionan:</p>
                  <p>• Se incrementa con cada respuesta correcta</p>
                  <p>• Se reinicia cuando cometes un error</p>
                  <p>• Respuestas reveladas no rompen la racha</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'progressRate':
        const rate = data?.improvementRate || 0;
        return (
          <div className="max-w-sm space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-1">
              Tasa de Progreso {getProgressIcon(rate)}
            </h4>
            <p className="text-xs">
              Análisis de tu mejora basado en los últimos ejercicios.
            </p>
            {data && (
              <div className="text-xs border-t pt-2 space-y-1">
                <div className="flex items-center gap-1">
                  <span>Tendencia:</span>
                  {rate > 5 && <span className="text-green-600 font-medium">📈 Mejorando rápidamente</span>}
                  {rate <= 5 && rate > 0 && <span className="text-blue-600 font-medium">📊 Mejorando gradualmente</span>}
                  {rate === 0 && <span className="text-gray-600 font-medium">➡️ Rendimiento estable</span>}
                  {rate < 0 && <span className="text-orange-600 font-medium">📉 Necesita práctica</span>}
                </div>
                {data.recentAccuracy && (
                  <div className="bg-gray-50 p-2 rounded mt-2">
                    <p className="font-medium">Últimos 5 ejercicios:</p>
                    <div className="flex gap-1 mt-1">
                      {data.recentAccuracy.map((acc, idx) => (
                        <div 
                          key={idx}
                          className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white font-medium ${
                            acc >= 80 ? 'bg-green-500' : acc >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        >
                          {Math.round(acc)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'difficulty':
        return (
          <div className="max-w-sm space-y-2">
            <h4 className="font-semibold text-sm">Progresión de Dificultad</h4>
            <p className="text-xs">
              El sistema ajusta automáticamente la dificultad según tu rendimiento.
            </p>
            <div className="text-xs border-t pt-2 space-y-1">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 p-2 rounded">
                  <p className="font-medium text-green-700">Principiante</p>
                  <p className="text-xs">Sumas básicas</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <p className="font-medium text-yellow-700">Intermedio</p>
                  <p className="text-xs">Más dígitos</p>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <p className="font-medium text-red-700">Avanzado</p>
                  <p className="text-xs">Desafíos complejos</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="max-w-sm space-y-2">
            <h4 className="font-semibold text-sm">Análisis de Rendimiento</h4>
            <p className="text-xs">
              Métricas combinadas que evalúan tu progreso general.
            </p>
            <div className="text-xs border-t pt-2 space-y-1">
              <p>• <span className="font-medium">Precisión:</span> % de respuestas correctas</p>
              <p>• <span className="font-medium">Velocidad:</span> Tiempo promedio por problema</p>
              <p>• <span className="font-medium">Consistencia:</span> Variación en el rendimiento</p>
              <p>• <span className="font-medium">Dificultad:</span> Nivel actual alcanzado</p>
              <div className="bg-blue-50 p-2 rounded mt-2">
                <p className="font-medium">💡 Consejos:</p>
                <p>• Enfócate en precisión antes que velocidad</p>
                <p>• Practica regularmente para mantener consistencia</p>
                <p>• No temas usar ayudas cuando sea necesario</p>
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-xs">Información no disponible</p>;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={`inline-flex items-center hover:text-blue-600 transition-colors ${className}`}>
            <HelpCircle className="h-3 w-3 ml-1 opacity-60 hover:opacity-100" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3 max-w-xs">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AdvancedMetricsTooltip;