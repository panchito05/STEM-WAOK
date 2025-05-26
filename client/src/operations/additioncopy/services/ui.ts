/**
 * Servicio de interfaz de usuario para el módulo de suma
 * 
 * Este servicio proporciona una abstracción para todas las operaciones
 * relacionadas con la interfaz de usuario, como temporizadores, animaciones,
 * y efectos visuales.
 */

import { AdditionCopyProblem, DifficultyLevel } from '../types';
import { on, off } from '../middleware';

// Definición de interfaces para desacoplar la implementación
export interface TimerProvider {
  startTimer(duration: number, onTick: (remaining: number) => void, onComplete: () => void): string;
  pauseTimer(timerId: string): void;
  resumeTimer(timerId: string): void;
  stopTimer(timerId: string): void;
  getRemainingTime(timerId: string): number;
}

export interface AnimationProvider {
  playCorrectAnimation(elementId: string): void;
  playIncorrectAnimation(elementId: string): void;
  playRewardAnimation(elementId: string, rewardType: string): void;
}

export interface SoundProvider {
  playCorrectSound(): void;
  playIncorrectSound(): void;
  playTimerAlertSound(): void;
  playRewardSound(rewardType: string): void;
}

// Implementación predeterminada del proveedor de temporizadores
class DefaultTimerProvider implements TimerProvider {
  private timers = new Map<string, {
    interval: number;
    startTime: number;
    remaining: number;
    duration: number;
    paused: boolean;
    onTick: (remaining: number) => void;
    onComplete: () => void;
  }>();
  
  startTimer(duration: number, onTick: (remaining: number) => void, onComplete: () => void): string {
    const timerId = `timer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const timer = {
      interval: 0,
      startTime: Date.now(),
      remaining: duration,
      duration,
      paused: false,
      onTick,
      onComplete
    };
    
    // Configurar el intervalo para actualizar el temporizador cada segundo
    timer.interval = window.setInterval(() => {
      if (timer.paused) return;
      
      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
      timer.remaining = Math.max(0, timer.duration - elapsed);
      
      onTick(timer.remaining);
      
      if (timer.remaining <= 0) {
        this.stopTimer(timerId);
        onComplete();
      }
    }, 1000);
    
    this.timers.set(timerId, timer);
    return timerId;
  }
  
  pauseTimer(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (timer) {
      timer.paused = true;
    }
  }
  
  resumeTimer(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (timer) {
      timer.startTime = Date.now() - ((timer.duration - timer.remaining) * 1000);
      timer.paused = false;
    }
  }
  
  stopTimer(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (timer) {
      clearInterval(timer.interval);
      this.timers.delete(timerId);
    }
  }
  
  getRemainingTime(timerId: string): number {
    const timer = this.timers.get(timerId);
    return timer ? timer.remaining : 0;
  }
}

// Implementación predeterminada del proveedor de animaciones
class DefaultAnimationProvider implements AnimationProvider {
  playCorrectAnimation(elementId: string): void {
    try {
      const element = document.getElementById(elementId);
      if (!element) return;
      
      // Añadir clase de animación
      element.classList.add('animate-correct');
      
      // Eliminar la clase después de la animación
      setTimeout(() => {
        element.classList.remove('animate-correct');
      }, 1000);
    } catch (error) {
      console.error('Error al reproducir animación de respuesta correcta:', error);
    }
  }
  
  playIncorrectAnimation(elementId: string): void {
    try {
      const element = document.getElementById(elementId);
      if (!element) return;
      
      // Añadir clase de animación
      element.classList.add('animate-incorrect');
      
      // Eliminar la clase después de la animación
      setTimeout(() => {
        element.classList.remove('animate-incorrect');
      }, 1000);
    } catch (error) {
      console.error('Error al reproducir animación de respuesta incorrecta:', error);
    }
  }
  
  playRewardAnimation(elementId: string, rewardType: string): void {
    try {
      const element = document.getElementById(elementId);
      if (!element) return;
      
      // Añadir clase de animación según el tipo de recompensa
      element.classList.add(`animate-${rewardType}-reward`);
      
      // Eliminar la clase después de la animación
      setTimeout(() => {
        element.classList.remove(`animate-${rewardType}-reward`);
      }, 2000);
    } catch (error) {
      console.error('Error al reproducir animación de recompensa:', error);
    }
  }
}

// Implementación predeterminada del proveedor de sonidos
class DefaultSoundProvider implements SoundProvider {
  private audioCache = new Map<string, HTMLAudioElement>();
  
  private getAudio(src: string): HTMLAudioElement {
    if (this.audioCache.has(src)) {
      return this.audioCache.get(src)!;
    }
    
    const audio = new Audio(src);
    this.audioCache.set(src, audio);
    return audio;
  }
  
  playCorrectSound(): void {
    try {
      const audio = this.getAudio('/assets/sounds/correct.mp3');
      audio.currentTime = 0;
      audio.play().catch(error => console.error('Error al reproducir sonido:', error));
    } catch (error) {
      console.error('Error al reproducir sonido de respuesta correcta:', error);
    }
  }
  
  playIncorrectSound(): void {
    try {
      const audio = this.getAudio('/assets/sounds/incorrect.mp3');
      audio.currentTime = 0;
      audio.play().catch(error => console.error('Error al reproducir sonido:', error));
    } catch (error) {
      console.error('Error al reproducir sonido de respuesta incorrecta:', error);
    }
  }
  
  playTimerAlertSound(): void {
    try {
      const audio = this.getAudio('/assets/sounds/timer-alert.mp3');
      audio.currentTime = 0;
      audio.play().catch(error => console.error('Error al reproducir sonido:', error));
    } catch (error) {
      console.error('Error al reproducir sonido de alerta de temporizador:', error);
    }
  }
  
  playRewardSound(rewardType: string): void {
    try {
      const audio = this.getAudio(`/assets/sounds/${rewardType}-reward.mp3`);
      audio.currentTime = 0;
      audio.play().catch(error => console.error('Error al reproducir sonido:', error));
    } catch (error) {
      console.error('Error al reproducir sonido de recompensa:', error);
    }
  }
}

// Clase Singleton para el servicio de interfaz de usuario
export class UIService {
  private static instance: UIService;
  private timerProvider: TimerProvider;
  private animationProvider: AnimationProvider;
  private soundProvider: SoundProvider;
  
  private constructor(
    timerProvider: TimerProvider,
    animationProvider: AnimationProvider,
    soundProvider: SoundProvider
  ) {
    this.timerProvider = timerProvider;
    this.animationProvider = animationProvider;
    this.soundProvider = soundProvider;
    
    // Registrar con el middleware para manejar eventos automáticamente
    on('user_answer_processed', this.handleUserAnswer.bind(this));
  }
  
  public static getInstance(): UIService {
    if (!UIService.instance) {
      // Usar los proveedores predeterminados
      const timerProvider = new DefaultTimerProvider();
      const animationProvider = new DefaultAnimationProvider();
      const soundProvider = new DefaultSoundProvider();
      
      UIService.instance = new UIService(timerProvider, animationProvider, soundProvider);
    }
    return UIService.instance;
  }
  
  /**
   * Cambia el proveedor de temporizadores
   */
  public setTimerProvider(provider: TimerProvider): void {
    this.timerProvider = provider;
  }
  
  /**
   * Cambia el proveedor de animaciones
   */
  public setAnimationProvider(provider: AnimationProvider): void {
    this.animationProvider = provider;
  }
  
  /**
   * Cambia el proveedor de sonidos
   */
  public setSoundProvider(provider: SoundProvider): void {
    this.soundProvider = provider;
  }
  
  // Métodos para temporizadores
  
  public startTimer(duration: number, onTick: (remaining: number) => void, onComplete: () => void): string {
    return this.timerProvider.startTimer(duration, onTick, onComplete);
  }
  
  public pauseTimer(timerId: string): void {
    this.timerProvider.pauseTimer(timerId);
  }
  
  public resumeTimer(timerId: string): void {
    this.timerProvider.resumeTimer(timerId);
  }
  
  public stopTimer(timerId: string): void {
    this.timerProvider.stopTimer(timerId);
  }
  
  public getRemainingTime(timerId: string): number {
    return this.timerProvider.getRemainingTime(timerId);
  }
  
  // Métodos para animaciones
  
  public playCorrectAnimation(elementId: string): void {
    this.animationProvider.playCorrectAnimation(elementId);
  }
  
  public playIncorrectAnimation(elementId: string): void {
    this.animationProvider.playIncorrectAnimation(elementId);
  }
  
  public playRewardAnimation(elementId: string, rewardType: string): void {
    this.animationProvider.playRewardAnimation(elementId, rewardType);
  }
  
  // Métodos para sonidos
  
  public playCorrectSound(): void {
    this.soundProvider.playCorrectSound();
  }
  
  public playIncorrectSound(): void {
    this.soundProvider.playIncorrectSound();
  }
  
  public playTimerAlertSound(): void {
    this.soundProvider.playTimerAlertSound();
  }
  
  public playRewardSound(rewardType: string): void {
    this.soundProvider.playRewardSound(rewardType);
  }
  
  /**
   * Manejador automático para respuestas de usuario
   */
  private handleUserAnswer(answer: any): void {
    try {
      if (answer.isCorrect) {
        // Reproducir sonido y animación de respuesta correcta
        this.playCorrectSound();
      } else {
        // Reproducir sonido y animación de respuesta incorrecta
        this.playIncorrectSound();
      }
    } catch (error) {
      console.error('Error al manejar respuesta de usuario en UIService:', error);
    }
  }
}

// Funciones de conveniencia para usar en componentes

// Temporizadores

export function startTimer(duration: number, onTick: (remaining: number) => void, onComplete: () => void): string {
  return UIService.getInstance().startTimer(duration, onTick, onComplete);
}

export function pauseTimer(timerId: string): void {
  UIService.getInstance().pauseTimer(timerId);
}

export function resumeTimer(timerId: string): void {
  UIService.getInstance().resumeTimer(timerId);
}

export function stopTimer(timerId: string): void {
  UIService.getInstance().stopTimer(timerId);
}

export function getRemainingTime(timerId: string): number {
  return UIService.getInstance().getRemainingTime(timerId);
}

// Animaciones

export function playCorrectAnimation(elementId: string): void {
  UIService.getInstance().playCorrectAnimation(elementId);
}

export function playIncorrectAnimation(elementId: string): void {
  UIService.getInstance().playIncorrectAnimation(elementId);
}

export function playRewardAnimation(elementId: string, rewardType: string): void {
  UIService.getInstance().playRewardAnimation(elementId, rewardType);
}

// Sonidos

export function playCorrectSound(): void {
  UIService.getInstance().playCorrectSound();
}

export function playIncorrectSound(): void {
  UIService.getInstance().playIncorrectSound();
}

export function playTimerAlertSound(): void {
  UIService.getInstance().playTimerAlertSound();
}

export function playRewardSound(rewardType: string): void {
  UIService.getInstance().playRewardSound(rewardType);
}