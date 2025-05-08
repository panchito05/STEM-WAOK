import React, { useState, useEffect } from 'react';
import { Reward, RewardCollection, useRewardsStore } from '@/lib/rewards-system';
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
  X,
  Filter,
  Calendar,
  BookOpen,
  Layers
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import RewardAnimation from './RewardAnimation';

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

// Componente que muestra una recompensa individual en el álbum
const RewardCard = ({ reward, onClick }: { reward: Reward, onClick: () => void }) => {
  return (
    <div 
      className={cn(
        "relative p-4 rounded-lg border transition-all duration-200 cursor-pointer",
        "hover:shadow-lg transform hover:-translate-y-1",
        {
          'common': 'bg-gray-50 border-gray-200',
          'rare': 'bg-blue-50 border-blue-200',
          'epic': 'bg-purple-50 border-purple-200',
          'legendary': 'bg-amber-50 border-amber-200',
        }[reward.tier]
      )}
      onClick={onClick}
    >
      {reward.isNew && (
        <Badge variant="outline" className="absolute -top-2 -right-2 bg-red-500 text-white border-none">
          Nuevo
        </Badge>
      )}
      
      <div className="flex flex-col items-center">
        <div 
          className="mb-2"
          style={{ color: reward.color || '#333' }}
        >
          {iconMap[reward.icon] 
            ? React.cloneElement(iconMap[reward.icon] as React.ReactElement, { 
                className: "h-12 w-12", 
                strokeWidth: 1.5 
              }) 
            : <Award className="h-12 w-12" strokeWidth={1.5} />
          }
        </div>
        
        <h4 className="text-sm font-bold text-center line-clamp-1 mb-1">{reward.name}</h4>
        <p className="text-xs text-gray-500 text-center line-clamp-2">{reward.description}</p>
        
        <div className="mt-2 text-xs">
          <Badge variant="outline" className="text-[10px] py-0 px-1">
            {reward.tier.charAt(0).toUpperCase() + reward.tier.slice(1)}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Componente que muestra una colección de recompensas
const CollectionCard = ({ collection }: { collection: RewardCollection }) => {
  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold">{collection.name}</h4>
        <Badge variant={collection.isComplete ? "default" : "outline"} className={collection.isComplete ? "bg-green-500" : ""}>
          {collection.isComplete ? 'Completa' : `${collection.progress}%`}
        </Badge>
      </div>
      
      <p className="text-xs text-gray-600 mb-3">{collection.description}</p>
      
      <Progress value={collection.progress} className="h-2 mb-3" />
      
      <div className="flex flex-wrap gap-1">
        {collection.rewards.map(rewardId => (
          <div key={rewardId} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        ))}
        {collection.isComplete ? null : 
          Array(Math.max(0, 5 - collection.rewards.length)).fill(0).map((_, i) => (
            <div key={`empty-${i}`} className="w-6 h-6 rounded-full bg-gray-200 opacity-30" />
          ))
        }
      </div>
    </div>
  );
};

// Componente para el placeholder de recompensas bloqueadas
const LockedReward = () => {
  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-gray-100 opacity-60">
      <div className="flex flex-col items-center">
        <div className="mb-2 bg-gray-300 w-12 h-12 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-8 w-8 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        
        <div className="w-24 h-3 bg-gray-300 rounded mb-2"></div>
        <div className="w-20 h-2 bg-gray-300 rounded"></div>
        <div className="w-16 h-2 bg-gray-300 rounded mt-1"></div>
      </div>
    </div>
  );
};

// Componente principal del álbum de recompensas
export default function RewardsAlbum() {
  const { 
    earnedRewards, 
    collections, 
    newRewardsCount, 
    resetNewRewardsCount,
    markRewardAsSeen
  } = useRewardsStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showRewardDetails, setShowRewardDetails] = useState(false);
  
  // Definir algunos recompensas fijas que el usuario no ha desbloqueado aún
  const lockedRewardCount = 6;
  
  // Filtrar recompensas según categoría
  const filteredRewards = earnedRewards.filter(reward => {
    if (filter === 'all') return true;
    if (filter === 'recent') {
      // Muestra recompensas de los últimos 7 días
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(reward.dateEarned) >= sevenDaysAgo;
    }
    if (filter === reward.category || filter === reward.theme) return true;
    if (filter === reward.tier) return true;
    return false;
  });
  
  // Ordenar recompensas por fecha (más recientes primero) y luego por rareza
  const sortedRewards = [...filteredRewards].sort((a, b) => {
    const tierValue = { 'legendary': 4, 'epic': 3, 'rare': 2, 'common': 1 };
    
    // Primero muestra las nuevas
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    
    // Si ambas son nuevas o ambas no son nuevas, ordena por fecha
    return new Date(b.dateEarned).getTime() - new Date(a.dateEarned).getTime() ||
           (tierValue[b.tier] || 0) - (tierValue[a.tier] || 0);
  });
  
  const handleRewardClick = (reward: Reward) => {
    setSelectedReward(reward);
    setShowRewardDetails(true);
    
    // Si es una recompensa nueva, marcarla como vista
    if (reward.isNew) {
      markRewardAsSeen(reward.id);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      // Al abrir el álbum, resetear contador de nuevas recompensas
      resetNewRewardsCount();
    }
  }, [isOpen, resetNewRewardsCount]);
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative flex items-center gap-2"
            onClick={() => setIsOpen(true)}
          >
            <BookOpen className="h-5 w-5" />
            <span>Mi colección</span>
            
            {newRewardsCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 h-5 min-w-5 flex items-center justify-center p-0 text-[11px]">
                {newRewardsCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Álbum de Recompensas</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="rewards" className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-2">
              <TabsList>
                <TabsTrigger value="rewards" className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  <span>Recompensas</span>
                  <Badge variant="outline" className="ml-1">{earnedRewards.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="collections" className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  <span>Colecciones</span>
                  <Badge variant="outline" className="ml-1">{collections.length}</Badge>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <select 
                  className="text-xs p-1 border rounded"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="recent">Recientes</option>
                  <option value="legendary">Legendarias</option>
                  <option value="epic">Épicas</option>
                  <option value="rare">Raras</option>
                  <option value="common">Comunes</option>
                  <option value="achievement">Logros</option>
                  <option value="milestone">Hitos</option>
                  <option value="streak">Rachas</option>
                  <option value="level-up">Niveles</option>
                  <option value="addition">Suma</option>
                  <option value="subtraction">Resta</option>
                  <option value="multiplication">Multiplicación</option>
                  <option value="division">División</option>
                </select>
                
                <Button variant="ghost" size="icon" title="Filtrar">
                  <Filter className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="icon" title="Ordenar por fecha">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto mt-4 pr-2">
              <TabsContent value="rewards" className="m-0">
                {sortedRewards.length === 0 ? (
                  <div className="text-center py-10">
                    <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">¡Completa ejercicios para ganar tus primeras recompensas!</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {sortedRewards.map(reward => (
                        <RewardCard 
                          key={reward.id} 
                          reward={reward} 
                          onClick={() => handleRewardClick(reward)}
                        />
                      ))}
                      
                      {/* Recompensas bloqueadas como placeholder */}
                      {lockedRewardCount > 0 && (
                        Array(lockedRewardCount).fill(0).map((_, i) => (
                          <LockedReward key={`locked-${i}`} />
                        ))
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="collections" className="m-0">
                {collections.length === 0 ? (
                  <div className="text-center py-10">
                    <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">¡Completa más ejercicios para desbloquear colecciones!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {collections.map(collection => (
                      <CollectionCard key={collection.id} collection={collection} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Detalles completos de una recompensa */}
      {showRewardDetails && selectedReward && (
        <Dialog 
          open={showRewardDetails} 
          onOpenChange={(open) => setShowRewardDetails(open)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Detalles de Recompensa</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col items-center">
              <div 
                className="mb-4"
                style={{ color: selectedReward.color || '#333' }}
              >
                {iconMap[selectedReward.icon] 
                  ? React.cloneElement(iconMap[selectedReward.icon] as React.ReactElement, { 
                      className: "h-20 w-20", 
                      strokeWidth: 1.5 
                    }) 
                  : <Award className="h-20 w-20" strokeWidth={1.5} />
                }
              </div>
              
              <h2 className="text-xl font-bold mb-2">{selectedReward.name}</h2>
              <p className="text-gray-600 text-center mb-4">{selectedReward.description}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className={
                  {
                    'common': 'bg-gray-100 text-gray-700',
                    'rare': 'bg-blue-100 text-blue-700',
                    'epic': 'bg-purple-100 text-purple-700',
                    'legendary': 'bg-yellow-100 text-amber-700',
                  }[selectedReward.tier]
                }>
                  {selectedReward.tier.charAt(0).toUpperCase() + selectedReward.tier.slice(1)}
                </Badge>
                
                <span className="text-sm text-gray-500">
                  Obtenida el {format(new Date(selectedReward.dateEarned), 'dd/MM/yyyy')}
                </span>
              </div>
              
              <Button variant="outline" onClick={() => setShowRewardDetails(false)}>
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}