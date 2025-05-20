/**
 * Formatea un tiempo en segundos a un formato legible (mm:ss)
 * @param seconds Tiempo en segundos
 * @returns Tiempo formateado en formato mm:ss
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  // Asegurar que los segundos siempre tengan dos dígitos
  const formattedSeconds = remainingSeconds < 10 
    ? `0${remainingSeconds}` 
    : `${remainingSeconds}`;
    
  return `${minutes}:${formattedSeconds}`;
}