import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface ContextualTooltipProps {
  type: 'accuracy' | 'challengingProblems' | 'avgAttempts' | 'revealed' | 'streaks' | 'progressRate';
  value?: string | number;
  additionalData?: {
    correct?: number;
    total?: number;
    revealed?: number;
    attempts?: number;
  };
  className?: string;
}

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  type,
  value,
  additionalData,
  className = ""
}) => {
  const getTooltipContent = () => {
    switch (type) {
      case 'accuracy':
        return (
          <div className="max-w-sm space-y-2">
            <h4 className="font-semibold text-sm">Precisión</h4>
            <p className="text-xs">
              Porcentaje de problemas resueltos correctamente sin ayuda.
            </p>
            {additionalData && (
              <div className="text-xs border-t pt-2 space-y-1">
                <p>• Respuestas correctas: <span className="font-medium">{additionalData.correct || 0}</span></p>
                <p>• Total intentados: <span className="font-medium">{(additionalData.total || 0) - (additionalData.revealed || 0)}</span></p>
                <p className="text-gray-500">• Excluye respuestas reveladas</p>
              </div>
            )}
          </div>
        );

      case 'challengingProblems':
        return (
          <div className="max-w-sm space-y-2">
            <h4 className="font-semibold text-sm">Problemas Desafiantes</h4>
            <p className="text-xs">
              Problemas que causaron dificultad: incorrectos + revelados.
            </p>
            {additionalData && (
              <div className="text-xs border-t pt-2 space-y-1">
                <p>• Incorrectos: <span className="font-medium">{(additionalData.total || 0) - (additionalData.correct || 0)}</span></p>
                <p>• Revelados: <span className="font-medium">{additionalData.revealed || 0}</span></p>
                <p className="text-gray-500">• Indica áreas que necesitan práctica</p>
              </div>
            )}
          </div>
        );

      case 'avgAttempts':
        return (
          <div className="max-w-sm space-y-2">
            <h4 className="font-semibold text-sm">Intentos Promedio</h4>
            <p className="text-xs">
              Número promedio de intentos por problema antes de resolverlo.
            </p>
            <div className="text-xs border-t pt-2 space-y-1">
              <p>• <span className="font-medium">1.0</span>: Resolvió todo al primer intento</p>
              <p>• <span className="font-medium">2.0+</span>: Necesitó múltiples intentos</p>
              <p className="text-gray-500">• Menor es mejor</p>
            </div>
          </div>
        );

      case 'revealed':
        return (
          <div className="max-w-sm space-y-2">
            <h4 className="font-semibold text-sm">Respuestas Reveladas</h4>
            <p className="text-xs">
              Problemas donde se solicitó ver la respuesta correcta.
            </p>
            <div className="text-xs border-t pt-2 space-y-1">
              <p>• No cuenta como respuesta correcta</p>
              <p>• Indica conceptos que necesitan refuerzo</p>
              <p className="text-gray-500">• Herramienta de aprendizaje, no penalización</p>
            </div>
          </div>
        );

      case 'streaks':
        return (
          <div className="max-w-sm space-y-2">
            <h4 className="font-semibold text-sm">Rachas</h4>
            <p className="text-xs">
              Secuencias consecutivas de respuestas correctas.
            </p>
            <div className="text-xs border-t pt-2 space-y-1">
              <p>• <span className="font-medium">Actual</span>: Racha en progreso</p>
              <p>• <span className="font-medium">Mejor</span>: Racha más larga alcanzada</p>
              <p className="text-gray-500">• Se reinicia con cada error</p>
            </div>
          </div>
        );

      case 'progressRate':
        return (
          <div className="max-w-sm space-y-2">
            <h4 className="font-semibold text-sm">Tasa de Progreso</h4>
            <p className="text-xs">
              Velocidad de mejora basada en ejercicios recientes.
            </p>
            <div className="text-xs border-t pt-2 space-y-1">
              <p>• <span className="text-green-600 font-medium">↗️ Mejorando</span>: Precisión aumentando</p>
              <p>• <span className="text-blue-600 font-medium">→ Estable</span>: Rendimiento consistente</p>
              <p>• <span className="text-orange-600 font-medium">↘️ Necesita práctica</span>: Precisión bajando</p>
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

export default ContextualTooltip;