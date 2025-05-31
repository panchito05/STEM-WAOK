// Factory para crear instancias de dibujo según el nivel de dificultad
import { LevelDrawing } from './types';
import { BeginnerDrawing } from './BeginnerDrawing';
import { ElementaryDrawing } from './ElementaryDrawing';
import { IntermediateDrawing } from './IntermediateDrawing';
import { AdvancedDrawing } from './AdvancedDrawing';

export class DrawingFactory {
  private static instances: Map<string, LevelDrawing> = new Map();
  
  /**
   * Crea una instancia de la clase de dibujo apropiada según el nivel de dificultad
   * Utiliza el patrón singleton para reutilizar instancias
   */
  static create(difficulty: string): LevelDrawing {
    // Verificar si ya existe una instancia para este nivel
    if (this.instances.has(difficulty)) {
      return this.instances.get(difficulty)!;
    }
    
    // Crear nueva instancia según el nivel
    let drawer: LevelDrawing;
    
    switch(difficulty) {
      case 'beginner':
        drawer = new BeginnerDrawing();
        break;
      case 'elementary':
        drawer = new ElementaryDrawing();
        break;
      case 'intermediate':
        drawer = new IntermediateDrawing();
        break;
      case 'advanced':
        drawer = new AdvancedDrawing();
        break;
      default:
        // Fallback al nivel principiante
        drawer = new BeginnerDrawing();
        break;
    }
    
    // Guardar la instancia para reutilización
    this.instances.set(difficulty, drawer);
    
    return drawer;
  }
  
  /**
   * Limpia todas las instancias en caché (útil para testing o reinicios)
   */
  static clearCache(): void {
    this.instances.clear();
  }
}