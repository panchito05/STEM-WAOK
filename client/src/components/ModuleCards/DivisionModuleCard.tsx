import { Link } from "wouter";
import { useModuleFavorites, useModuleStore } from "@/store/moduleStore";
import { Button } from "@/components/ui/button";
import { Star, Eye, EyeOff } from "lucide-react";
import { Module } from "@/utils/operationComponents";

interface DivisionModuleCardProps {
  module: Module;
  index: number;
}

export default function DivisionModuleCard({ module, index }: DivisionModuleCardProps) {
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
    <div className="division-module-unique-card division-specific-container h-full bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:border-purple-300 group">
      {/* Header específico de Division con clases únicas */}
      <div className="division-header-unique bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white p-2 sm:p-3 lg:p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="division-title-section relative flex items-center justify-between">
          <div className="division-content-wrapper flex items-center min-w-0 flex-1">
            <div className="division-icon-wrapper mr-2 sm:mr-3 bg-white/25 p-1 sm:p-2 rounded-lg shadow-inner flex-shrink-0">
              <span className="text-white font-bold text-lg">÷</span>
            </div>
            <h3 className="division-title-text text-xs min-[350px]:text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white line-clamp-2 leading-tight">
              División
            </h3>
          </div>
          
          {/* Iconos en la esquina superior derecha */}
          <div className="division-top-actions flex items-center gap-1 min-[400px]:gap-2 flex-shrink-0">
            <button 
              className={`division-favorite-button focus:outline-none p-1 min-[400px]:p-1.5 sm:p-1.5 rounded-full transition-all ${
                isModuleFavorite 
                  ? "text-yellow-400 hover:text-white bg-white/20 hover:bg-white/10" 
                  : "text-white hover:text-yellow-400 hover:bg-white/20"
              }`}
              onClick={handleToggleFavorite}
            >
              <Star className={`h-3.5 w-3.5 min-[400px]:h-4 min-[400px]:w-4 sm:h-5 sm:w-5 ${isModuleFavorite ? "fill-current" : ""}`} />
            </button>
            
            <button 
              className="division-visibility-button focus:outline-none p-1 min-[400px]:p-1.5 sm:p-1.5 rounded-full transition-all text-white hover:text-gray-200 hover:bg-white/20"
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
      </div>

      {/* Contenido específico de Division con estructura DOM única */}
      <div className="division-body-unique division-main-content p-2 sm:p-4 bg-gradient-to-b from-white to-purple-50 pt-[13px] pb-[13px] pl-[12px] pr-[12px] mt-[0px] mb-[0px] ml-[0px] mr-[0px]">
        <p className="division-description-text text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 text-gray-600">
          Practica división con varios niveles de dificultad
        </p>
        <div className="division-footer-unique division-bottom-section flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="division-difficulty-wrapper flex items-center w-full sm:w-auto">
            <span className={`division-difficulty-label px-1.5 min-[400px]:px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] min-[400px]:text-xs sm:text-sm font-medium border ${difficultyColors[module.difficulty as keyof typeof difficultyColors] || difficultyColors.beginner} flex-shrink-0`}>
              {difficultyLabels[module.difficulty as keyof typeof difficultyLabels] || 'Principiante'}
            </span>
          </div>
          <Link href={`/operation/${module.id}`}>
            <Button 
              variant="default" 
              className="division-start-btn division-cta-button text-white bg-purple-600 hover:bg-purple-700 rounded-full px-2 min-[400px]:px-3 sm:px-4 text-[10px] min-[400px]:text-xs sm:text-sm h-7 min-[400px]:h-8 sm:h-9 w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
            >
              Comenzar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}