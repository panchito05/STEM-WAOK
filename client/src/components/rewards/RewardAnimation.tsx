import React, { useEffect, useState } from 'react';
import { useRewardsStore, Reward, RewardTier } from '@/lib/rewards-system';
import confetti from 'canvas-confetti';
import { 
  Star, 
  Award, 
  Trophy, 
  Crown, 
  Gift, 
  Zap, 
  FlameKindling,
  Heart,
  CheckCircle,
  Plus,
  Calculator,
  ArrowUp,
  ArrowUpCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RewardAnimationProps {
  onClose?: () => void;
  reward?: Reward;
  size?: 'small' | 'medium' | 'large'; 
}

const iconMap: Record<string, React.ReactNode> = {
  'Star': <Star />,
  'Award': <Award />,
  'Trophy': <Trophy />,
  'Crown': <Crown />,
  'Gift': <Gift />,
  'Flame': <FlameKindling />,
  'Zap': <Zap />,
  'Heart': <Heart />,
  'CheckCircle': <CheckCircle />,
  'Plus': <Plus />,
  'Calculator': <Calculator />,
  'ArrowUp': <ArrowUp />,
  'ArrowUpCircle': <ArrowUpCircle />
};

// Colores y estilos según el nivel de la recompensa
const tierStyles: Record<RewardTier, { bg: string, border: string, text: string, shadow: string }> = {
  'common': { 
    bg: 'bg-gradient-to-b from-gray-100 to-gray-200', 
    border: 'border-gray-300', 
    text: 'text-gray-800',
    shadow: 'shadow-md'
  },
  'rare': { 
    bg: 'bg-gradient-to-b from-blue-100 to-blue-200', 
    border: 'border-blue-300', 
    text: 'text-blue-800',
    shadow: 'shadow-lg'
  },
  'epic': { 
    bg: 'bg-gradient-to-b from-purple-100 to-purple-200', 
    border: 'border-purple-300', 
    text: 'text-purple-800',
    shadow: 'shadow-xl'
  },
  'legendary': { 
    bg: 'bg-gradient-to-b from-yellow-100 to-amber-200', 
    border: 'border-yellow-400', 
    text: 'text-amber-800',
    shadow: 'shadow-2xl'
  }
};

// Animaciones según el tipo
const animations: Record<string, string> = {
  'pulse': 'animate-pulse',
  'bounce': 'animate-bounce',
  'spin': 'animate-spin',
  'confetti': '',
  'levelUp': '',
  'heartbeat': 'animate-[heartbeat_1s_ease-in-out_infinite]',
};

export default function RewardAnimation({ onClose, reward, size = 'medium' }: RewardAnimationProps) {
  const { recentReward, showRewardAnimation, setShowRewardAnimation } = useRewardsStore();
  const [showDetails, setShowDetails] = useState(false);
  
  // Usar la recompensa proporcionada o la más reciente del store
  const displayReward = reward || recentReward;
  
  useEffect(() => {
    if (displayReward) {
      // Para recompensas con confeti
      if (displayReward.animation === 'confetti' || displayReward.tier === 'legendary') {
        const colors = displayReward.tier === 'legendary' 
          ? ['#FFD700', '#FFC107', '#FF9800']  // Dorados para legendarias
          : ['#9C27B0', '#673AB7', '#3F51B5']; // Morados para épicas
        
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6, x: 0.5 },
          colors,
          zIndex: 2000
        });
      }
      
      // Para recompensas con levelUp
      if (displayReward.animation === 'levelUp') {
        // Primera explosión central
        confetti({
          particleCount: 50,
          angle: 130,
          spread: 100,
          origin: { y: 0.6, x: 0.5 },
          colors: ['#2196F3', '#03A9F4', '#00BCD4'],
          zIndex: 2000
        });
        
        // Segunda explosión después de un pequeño retraso
        setTimeout(() => {
          confetti({
            particleCount: 70,
            angle: 60,
            spread: 100,
            origin: { y: 0.6, x: 0.5 },
            colors: ['#4CAF50', '#8BC34A', '#CDDC39'],
            zIndex: 2000
          });
        }, 250);
      }
      
      // Mostrar detalles después de la animación inicial
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 1200);
      
      return () => clearTimeout(timer);
    }
  }, [displayReward]);
  
  if (!displayReward || !showRewardAnimation) {
    return null;
  }
  
  const tierStyle = tierStyles[displayReward.tier];
  const iconSize = size === 'small' ? 'h-12 w-12' : size === 'large' ? 'h-32 w-32' : 'h-24 w-24';
  const containerSize = size === 'small' ? 'max-w-xs' : size === 'large' ? 'max-w-md' : 'max-w-sm';
  
  const handleClose = () => {
    setShowRewardAnimation(false);
    if (onClose) onClose();
  };
  
  // Color personalizado o el color predeterminado según el nivel
  const iconColor = displayReward.color || {
    'common': '#757575',
    'rare': '#2196F3',
    'epic': '#9C27B0',
    'legendary': '#FFC107'
  }[displayReward.tier];
  
  const animation = displayReward.animation && animations[displayReward.animation];
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
      <div 
        className={cn(
          containerSize,
          "w-full p-6 rounded-2xl transform transition-all duration-500",
          tierStyle.bg,
          tierStyle.border,
          tierStyle.shadow,
          "border-2",
          showDetails ? "scale-100 opacity-100" : "scale-90 opacity-95"
        )}
      >
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          {/* Título con animación */}
          <h3 
            className={cn(
              "text-2xl font-bold mb-4 transition-all duration-500",
              tierStyle.text,
              showDetails ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            ¡RECOMPENSA DESBLOQUEADA!
          </h3>
          
          {/* Icono con animación */}
          <div 
            className={cn(
              "mb-4 transition-transform duration-700",
              showDetails ? "scale-100" : "scale-0",
              animation
            )}
            style={{ color: iconColor }}
          >
            {iconMap[displayReward.icon] 
              ? React.cloneElement(iconMap[displayReward.icon] as React.ReactElement, { 
                  className: iconSize, 
                  strokeWidth: 1.5 
                }) 
              : <Award className={iconSize} strokeWidth={1.5} />
            }
          </div>
          
          {/* Nombre y descripción con animación */}
          <div 
            className={cn(
              "text-center transition-all duration-500 delay-200",
              showDetails ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            <h4 className="text-xl font-bold mb-2">{displayReward.name}</h4>
            <p className="text-sm">{displayReward.description}</p>
          </div>
          
          {/* Etiqueta de nivel/rareza */}
          <div 
            className={cn(
              "mt-4 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-500 delay-300",
              showDetails ? "opacity-100 scale-100" : "opacity-0 scale-90",
              {
                'common': 'bg-gray-200 text-gray-700',
                'rare': 'bg-blue-200 text-blue-700',
                'epic': 'bg-purple-200 text-purple-700',
                'legendary': 'bg-yellow-200 text-amber-700',
              }[displayReward.tier]
            )}
          >
            {displayReward.tier.charAt(0).toUpperCase() + displayReward.tier.slice(1)}
          </div>
          
          {/* Botón para cerrar */}
          <Button
            onClick={handleClose}
            className={cn(
              "mt-6 transition-all duration-500 delay-400",
              showDetails ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
            variant="outline"
          >
            ¡Genial!
          </Button>
        </div>
      </div>
    </div>
  );
}

// Estilo CSS adicional necesario para la animación de latido
export const RewardAnimationCSS = `
@keyframes heartbeat {
  0% { transform: scale(1); }
  15% { transform: scale(1.2); }
  30% { transform: scale(1); }
  45% { transform: scale(1.15); }
  60% { transform: scale(1); }
}
`;