// RewardModal: Componente para mostrar recompensas desbloqueadas
// Interfaz visual atractiva para celebrar logros del usuario

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ValidatedReward, REWARD_RARITIES, REWARD_CATEGORIES } from '../core/RewardTypes';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface RewardModalProps {
  reward: ValidatedReward | null;
  isOpen: boolean;
  onClose: () => void;
  onViewReward?: (rewardId: string) => void;
}

export function RewardModal({ reward, isOpen, onClose, onViewReward }: RewardModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && reward) {
      // Trigger confetti for epic and legendary rewards
      if (reward.rarity === 'epic' || reward.rarity === 'legendary') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      // Mark reward as viewed when modal opens
      if (onViewReward) {
        onViewReward(reward.id);
      }
    }
  }, [isOpen, reward, onViewReward]);

  if (!reward) return null;

  const rarityConfig = REWARD_RARITIES[reward.rarity];
  const categoryConfig = REWARD_CATEGORIES[reward.category];

  return (
    <>
      {/* Confetti Effect for Special Rewards */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981'][Math.floor(Math.random() * 4)]
                  }}
                  initial={{ y: -20, rotate: 0 }}
                  animate={{ 
                    y: window.innerHeight + 20, 
                    rotate: 360,
                    x: Math.random() * 200 - 100
                  }}
                  transition={{ 
                    duration: 3,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-green-600">
              ¡Nueva Recompensa Desbloqueada! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              ¡Felicitaciones por tu logro!
            </DialogDescription>
          </DialogHeader>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20 
            }}
          >
            <Card 
              className="border-2 shadow-lg"
              style={{ 
                borderColor: rarityConfig.color,
                backgroundColor: `${rarityConfig.color}10`
              }}
            >
              <CardContent className="p-6">
                {/* Reward Icon and Info */}
                <div className="text-center space-y-4">
                  {/* Main Icon */}
                  <motion.div
                    animate={{
                      scale: reward.animationType === 'pulse' ? [1, 1.1, 1] : 1,
                      rotate: reward.animationType === 'bounce' ? [0, -5, 5, 0] : 0
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-6xl mb-2"
                  >
                    {reward.icon || categoryConfig.icon}
                  </motion.div>

                  {/* Reward Name */}
                  <h3 
                    className="text-xl font-bold mb-2"
                    style={{ color: rarityConfig.color }}
                  >
                    {reward.name}
                  </h3>

                  {/* Reward Description */}
                  <p className="text-gray-700 text-center mb-4">
                    {reward.description}
                  </p>

                  {/* Badges Row */}
                  <div className="flex justify-center space-x-2 mb-4">
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: rarityConfig.color,
                        color: rarityConfig.color
                      }}
                    >
                      {reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)}
                    </Badge>
                    <Badge variant="secondary">
                      {categoryConfig.description}
                    </Badge>
                  </div>

                  {/* Points Earned */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="bg-green-100 rounded-lg p-3 mb-4"
                  >
                    <div className="text-green-800 font-semibold">
                      +{reward.points} Puntos Ganados 🌟
                    </div>
                  </motion.div>

                  {/* Rarity Indicator */}
                  <div className="flex justify-center mb-4">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: i < rarityConfig.pointsMultiplier ? 1 : 0.3 }}
                          transition={{ delay: 0.1 * i }}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: rarityConfig.color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3 mt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6"
            >
              Continuar
            </Button>
          </div>

          {/* Validation Info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
              <div>Validación: {(reward.validationScore * 100).toFixed(1)}%</div>
              <div>Desbloqueada: {reward.validatedAt.toLocaleTimeString()}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook para manejar la cola de recompensas
export function useRewardQueue() {
  const [queue, setQueue] = useState<ValidatedReward[]>([]);
  const [currentReward, setCurrentReward] = useState<ValidatedReward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addToQueue = (rewards: ValidatedReward | ValidatedReward[]) => {
    const rewardArray = Array.isArray(rewards) ? rewards : [rewards];
    setQueue(prev => [...prev, ...rewardArray]);
  };

  const processQueue = () => {
    if (queue.length > 0 && !isModalOpen) {
      const nextReward = queue[0];
      setCurrentReward(nextReward);
      setIsModalOpen(true);
      setQueue(prev => prev.slice(1));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentReward(null);
    // Process next reward in queue after a short delay
    setTimeout(processQueue, 500);
  };

  // Auto-process queue when rewards are added
  useEffect(() => {
    processQueue();
  }, [queue.length]);

  return {
    addToQueue,
    closeModal,
    currentReward,
    isModalOpen,
    queueLength: queue.length
  };
}