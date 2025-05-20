// useAudio.ts - Hook simple para manejar efectos de sonido
import { useRef, useEffect } from 'react';

export function useAudio(url: string) {
  const audio = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    audio.current = new Audio(url);
    
    return () => {
      if (audio.current) {
        audio.current.pause();
        audio.current = null;
      }
    };
  }, [url]);
  
  const play = () => {
    if (audio.current) {
      // Reiniciar el audio para permitir reproducción repetida
      audio.current.currentTime = 0;
      
      // Intentar reproducir (puede fallar en algunos navegadores si no hay interacción previa del usuario)
      const playPromise = audio.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error al reproducir audio:', error);
        });
      }
    }
  };
  
  const pause = () => {
    if (audio.current) {
      audio.current.pause();
    }
  };
  
  return { play, pause };
}