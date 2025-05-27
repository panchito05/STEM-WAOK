import { Link } from "wouter";
import { useModuleFavorites, useModuleStore } from "@/store/moduleStore";
import { Button } from "@/components/ui/button";
import { Star, Minus, Eye, EyeOff } from "lucide-react";
import { Module } from "@/utils/operationComponents";

interface SubtractionModuleCardProps {
  module: Module;
  index: number;
}

export default function SubtractionModuleCard({ module, index }: SubtractionModuleCardProps) {
  const { toggleFavorite, favoriteModules } = useModuleFavorites();
  const { hiddenModules, toggleHidden } = useModuleStore();
  const isModuleFavorite = favoriteModules.includes(module.id);
  const isModuleVisible = !hiddenModules.includes(module.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(module.id);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleHidden(module.id);
  };

  const difficultyLabels = {
    'beginner': 'Principiante',
    'elementary': 'Elemental',
    'advanced': 'Avanzado',
    'expert': 'Experto'
  };

  const difficultyColors = {
    'beginner': 'bg-green-100 text-green-800 border-green-200',
    'elementary': 'bg-blue-100 text-blue-800 border-blue-200',
    'advanced': 'bg-orange-100 text-orange-800 border-orange-200',
    'expert': 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="subtraction-module-unique-card subtraction-specific-container h-full bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:border-red-300 group">
      {/* Header específico de Subtraction con clases únicas */}
      <div className="subtraction-header-unique bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white p-2 sm:p-3 lg:p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="subtraction-title-section relative flex items-center justify-between">
          <div className="subtraction-content-wrapper flex items-center min-w-0 flex-1">
            <div className="subtraction-icon-wrapper mr-2 sm:mr-3 bg-white/25 p-1 sm:p-2 rounded-lg shadow-inner flex-shrink-0">
              <Minus className="h-4 w-4 min-[400px]:h-5 min-[400px]:w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="subtraction-title-text text-xs min-[350px]:text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white line-clamp-2 leading-tight">
              Resta
            </h3>
          </div>
        </div>
        <div className="subtraction-actions-bar flex space-x-1 min-[400px]:space-x-1.5 sm:space-x-2 relative z-10 mt-2">
          <button 
            className={`subtraction-favorite-button focus:outline-none p-1 min-[400px]:p-1.5 sm:p-1.5 rounded-full transition-all ${
              isModuleFavorite 
                ? "text-yellow-400 hover:text-white bg-white/20 hover:bg-white/10" 
                : "text-white hover:text-yellow-400 hover:bg-white/20"
            }`}
            onClick={handleToggleFavorite}
          >
            <Star className={`h-3.5 w-3.5 min-[400px]:h-4 min-[400px]:w-4 sm:h-5 sm:w-5 ${isModuleFavorite ? "fill-current" : ""}`} />
          </button>
          
          <button 
            className="subtraction-visibility-button focus:outline-none p-1 min-[400px]:p-1.5 sm:p-1.5 rounded-full transition-all text-white hover:text-gray-200 hover:bg-white/20"
            onClick={handleToggleVisibility}
            title={isModuleVisible ? "Ocultar módulo" : "Mostrar módulo"}
          >
            {isModuleVisible ? (
              <Eye className="h-3.5 w-3.5 min-[400px]:h-4 min-[400px]:w-4 sm:h-5 sm:w-5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 min-[400px]:h-4 min-[400px]:w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Contenido específico de Subtraction con estructura DOM única */}
      <div className="subtraction-body-unique subtraction-main-content p-2 sm:p-3 bg-gradient-to-b from-white to-red-50">
        <p className="subtraction-description-text text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 text-gray-600">
          Practica restas con varios niveles de dificultad
        </p>
        <div className="subtraction-footer-unique subtraction-bottom-section flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="subtraction-difficulty-wrapper flex items-center w-full sm:w-auto">
            <span className={`subtraction-difficulty-label px-1.5 min-[400px]:px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] min-[400px]:text-xs sm:text-sm font-medium border ${difficultyColors[module.difficulty as keyof typeof difficultyColors] || difficultyColors.beginner} flex-shrink-0`}>
              {difficultyLabels[module.difficulty as keyof typeof difficultyLabels] || 'Principiante'}
            </span>
          </div>
          <Link href={`/operation/${module.id}`}>
            <Button 
              variant="default" 
              className="subtraction-start-btn subtraction-cta-button text-white bg-red-600 hover:bg-red-700 rounded-full px-2 min-[400px]:px-3 sm:px-4 text-[10px] min-[400px]:text-xs sm:text-sm h-7 min-[400px]:h-8 sm:h-9 w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
            >
              Comenzar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}