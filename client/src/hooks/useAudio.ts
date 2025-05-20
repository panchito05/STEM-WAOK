// useAudio.ts - Hook para manejar reproducción de audio
import { useRef, useEffect, useCallback } from 'react';

interface UseAudioReturn {
  play: () => void;
  stop: () => void;
  isPlaying: boolean;
}

/**
 * Hook para manejar la reproducción de archivos de audio
 * @param src - Ruta al archivo de audio
 * @param options - Opciones adicionales
 * @returns Objeto con métodos para controlar la reproducción
 */
export function useAudio(
  src: string,
  options: {
    volume?: number;
    loop?: boolean;
    autoplay?: boolean;
  } = {}
): UseAudioReturn {
  // Crear una referencia para el elemento de audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  
  // Inicializar el elemento de audio
  useEffect(() => {
    // Crear elemento de audio si no existe
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      
      // Configurar opciones
      if (options.volume !== undefined) {
        audioRef.current.volume = Math.min(1, Math.max(0, options.volume));
      }
      
      if (options.loop) {
        audioRef.current.loop = options.loop;
      }
      
      // Reproducir automáticamente si se solicita
      if (options.autoplay) {
        // Es posible que esto requiera interacción del usuario primero
        audioRef.current.play().catch(() => {
          // La mayoría de navegadores no permiten autoplay sin interacción
          console.log('Autoplay prevented by browser');
        });
      }
      
      // Manejar evento de finalización
      audioRef.current.addEventListener('ended', () => {
        isPlayingRef.current = false;
      });
    }
    
    // Limpiar al desmontar
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [src, options.volume, options.loop, options.autoplay]);
  
  // Función para reproducir el audio
  const play = useCallback(() => {
    if (audioRef.current) {
      // Reiniciar si ya está reproduciendo
      if (isPlayingRef.current) {
        audioRef.current.currentTime = 0;
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
        });
        isPlayingRef.current = true;
      }
    }
  }, []);
  
  // Función para detener el audio
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
    }
  }, []);
  
  return {
    play,
    stop,
    isPlaying: isPlayingRef.current
  };
}