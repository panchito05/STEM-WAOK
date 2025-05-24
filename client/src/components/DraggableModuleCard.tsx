import { useRef } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { useAccessibleDnd } from "./AccessibleDndContext";
import { useModuleStore, useModuleFavorites } from "@/store/moduleStore";
import { Module } from "@/utils/operationComponents";
import { 
  GripVertical, MoreVertical, Star, StarOff, Plus, Minus, X,
  DivideIcon, PieChart, BookOpen, Hash, Calculator, 
  ArrowLeftRight, Square, Percent, Triangle,
  Eye, EyeOff, MapIcon, History, ListChecks
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/context/SettingsContext";
import { useProgress } from "@/context/ProgressContext";
import { useTranslations, mapConfigLanguageToSupported } from "@/hooks/use-translations";
import { SupportedLanguage } from "@/utils/translations";
import ExerciseHistoryDialog from "./ExerciseHistoryDialog";

interface DraggableModuleCardProps {
  module: Module;
  index: number;
}

export default function DraggableModuleCard({ module, index }: DraggableModuleCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { useDragItem, useDropTarget } = useAccessibleDnd();
  const { 
    toggleHidden, 
    moveModule,
    hiddenModules
  } = useModuleStore();
  
  // Obtenemos los favoritos del perfil activo desde SettingsContext
  const { toggleFavorite, isFavorite } = useModuleFavorites();
  
  // Obtenemos la configuración personalizada del módulo y la configuración global
  const { moduleSettings, globalSettings } = useSettings();
  const moduleConfig = moduleSettings[module.id];
  
  // Obtenemos el progreso y el historial de ejercicios
  const { exerciseHistory, moduleProgress } = useProgress();
  
  // Determinamos el idioma específico a usar para este módulo
  let moduleLanguage: SupportedLanguage = globalSettings.language as SupportedLanguage;
  
  // Si existe configuración para este módulo y tiene idioma definido, convertirlo al formato de traducción
  if (moduleConfig?.language) {
    moduleLanguage = mapConfigLanguageToSupported(moduleConfig.language);
  }
  
  // Obtenemos las traducciones basadas en el idioma específico del módulo
  const { t } = useTranslations(moduleLanguage);
  
  const isModuleFavorite = isFavorite(module.id);
  const isHidden = hiddenModules.includes(module.id);
  
  // Verificar si hay historial para este módulo
  const hasHistory = exerciseHistory && exerciseHistory.some(entry => entry.operationId === module.id);

  const [{ isDragging }, drag] = useDragItem(() => ({
    type: "MODULE_CARD",
    item: { id: module.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // @ts-ignore - Ignoramos los errores de tipo en el hook useDropTarget
  const [drop_props, drop] = useDropTarget(() => ({
    accept: "MODULE_CARD",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    // @ts-ignore - Ignoramos los errores de tipo para usar el objeto item del drag
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      // @ts-ignore - Accedemos al índice del elemento arrastrado
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) {
        return;
      }
      
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      moveModule(dragIndex, hoverIndex);
      // @ts-ignore - Asignamos el nuevo índice al elemento arrastrado
      item.index = hoverIndex;
    },
  }));
  
  // Manejador para toggle favorite que previene la propagación de eventos
  const handleToggleFavorite = (e: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    toggleFavorite(module.id);
  };
  
  // Manejador para mostrar el historial del módulo directamente
  const handleViewHistory = (e: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Este evento no navegará, ahora mostrará un diálogo
  };
  
  drag(drop(ref));
  
  const getDifficultyBadge = (defaultDifficulty: string) => {
    // Si el módulo tiene configuración personalizada, mostrar esa dificultad en lugar de la predeterminada
    const difficulty = moduleConfig?.difficulty || defaultDifficulty;
    const badgeClass = "font-medium px-1.5 min-[400px]:px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] min-[400px]:text-xs sm:text-sm";
    
    switch (difficulty) {
      case "beginner":
        return <Badge variant="outline" className={`bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 ${badgeClass}`}>{t('difficulty.beginner')}</Badge>;
      case "elementary":
        return <Badge variant="outline" className={`bg-green-100 text-green-800 border-green-200 hover:bg-green-100 ${badgeClass}`}>{t('difficulty.elementary')}</Badge>;
      case "intermediate":
        return <Badge variant="outline" className={`bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 ${badgeClass}`}>{t('difficulty.intermediate')}</Badge>;
      case "advanced":
        return <Badge variant="outline" className={`bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 ${badgeClass}`}>{t('difficulty.advanced')}</Badge>;
      case "expert":
        return <Badge variant="outline" className={`bg-red-100 text-red-800 border-red-200 hover:bg-red-100 ${badgeClass}`}>{t('difficulty.expert')}</Badge>;
      default:
        return <Badge variant="outline" className={`bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 ${badgeClass}`}>{t('common.comingSoon')}</Badge>;
    }
  };

  // Función para obtener el icono correspondiente con tamaño responsive
  const getModuleIcon = () => {
    const iconClass = "h-4 w-4 min-[400px]:h-5 min-[400px]:w-5 sm:h-6 sm:w-6";
    
    if (!module.icon) return <Plus className={iconClass} />;
    
    switch (module.icon) {
      case "Plus": return <Plus className={iconClass} />;
      case "Minus": return <Minus className={iconClass} />;
      case "X": return <X className={iconClass} />;
      case "DivideIcon": return <DivideIcon className={iconClass} />;
      case "PieChart": return <PieChart className={iconClass} />;
      case "BookOpen": return <BookOpen className={iconClass} />;
      case "Hash": return <Hash className={iconClass} />;
      case "Calculator": return <Calculator className={iconClass} />;
      case "ArrowLeftRight": return <ArrowLeftRight className={iconClass} />;
      case "Square": return <Square className={iconClass} />;
      case "Percent": return <Percent className={iconClass} />;
      case "Triangle": return <Triangle className={iconClass} />;
      case "MapIcon": return <MapIcon className={iconClass} />;
      default: return <Plus className={iconClass} />;
    }
  };

  const cardContent = (
    <>
      <div 
        className="flex justify-between items-center p-2 sm:p-3 border-b border-gray-200 relative overflow-hidden"
        style={{ 
          backgroundColor: module.color || '#ffffff',
          color: 'white',
          opacity: module.comingSoon ? 0.7 : 1 
        }}
      >
        {/* Background pattern for more visual interest */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`grid-${module.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${module.id})`} />
          </svg>
        </div>
        
        <div className="flex items-center relative z-10 min-w-0 flex-1">
          <div className="mr-1 sm:mr-2 cursor-move text-white opacity-80 hover:opacity-100 transition-opacity hidden sm:block" aria-hidden="true">
            <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex items-center min-w-0 flex-1">
            <div className="mr-2 sm:mr-3 bg-white/25 p-1 sm:p-2 rounded-lg shadow-inner flex-shrink-0">
              {getModuleIcon()}
            </div>
            <h3 className="text-xs min-[350px]:text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white text-shadow truncate">
              {t(`modules.${module.id}.name`)}
            </h3>
          </div>
        </div>
        <div className="flex space-x-1 min-[400px]:space-x-1.5 sm:space-x-2 relative z-10">
          <button 
            className={`focus:outline-none p-1 min-[400px]:p-1.5 sm:p-1.5 rounded-full transition-all ${
              module.comingSoon 
                ? "text-gray-300 cursor-not-allowed" 
                : isModuleFavorite 
                  ? "text-yellow-400 hover:text-white bg-white/20 hover:bg-white/10" 
                  : "text-white hover:text-yellow-400 hover:bg-white/20"
            }`}
            onClick={(e) => !module.comingSoon && handleToggleFavorite(e)}
            disabled={module.comingSoon}
            aria-label={isModuleFavorite ? t('favorites.remove') : t('favorites.add')}
          >
            <Star className={`h-3.5 w-3.5 min-[400px]:h-4 min-[400px]:w-4 sm:h-5 sm:w-5 ${isModuleFavorite ? "fill-current" : ""}`} />
          </button>
          
          {/* History button and dropdown menu removed - only visibility toggle left */}
          
          {!module.comingSoon && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 rounded-full h-6 w-6 min-[400px]:h-7 min-[400px]:w-7 sm:h-8 sm:w-8 p-0"
              onClick={() => toggleHidden(module.id)}
            >
              {isHidden ? (
                <Eye className="h-3 w-3 min-[400px]:h-3.5 min-[400px]:w-3.5 sm:h-5 sm:w-5 text-purple-300" />
              ) : (
                <EyeOff className="h-3 w-3 min-[400px]:h-3.5 min-[400px]:w-3.5 sm:h-5 sm:w-5" />
              )}
            </Button>
          )}
        </div>
      </div>
      <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-b from-white to-blue-50">
        <p className={`text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 ${module.comingSoon ? "text-gray-400" : "text-gray-600"}`}>
          {t(`modules.${module.id}.description`)}
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center w-full sm:w-auto">
            {getDifficultyBadge(module.difficulty)}
          </div>
          {module.comingSoon ? (
            <Button disabled variant="default" className="text-white bg-gray-300 cursor-not-allowed rounded-full px-2 min-[400px]:px-3 sm:px-4 text-[10px] min-[400px]:text-xs sm:text-sm h-7 min-[400px]:h-8 sm:h-9 w-full sm:w-auto">
              {t('common.comingSoon')}
            </Button>
          ) : (
            <Link href={`/operation/${module.id}`} className="w-full sm:w-auto">
              <Button 
                variant="default" 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md rounded-full px-2 min-[400px]:px-3 sm:px-4 text-[10px] min-[400px]:text-xs sm:text-sm h-7 min-[400px]:h-8 sm:h-9 w-full sm:w-auto"
              >
                {t('common.start')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );

  return (
    <Card 
      ref={ref} 
      className={`
        ${isDragging ? "opacity-50" : "opacity-100"}
        ${module.comingSoon ? "border-2 border-dashed border-gray-300" : "rounded-2xl"}
        ${isModuleFavorite ? "ring-2 ring-yellow-400" : ""}
        ${isHidden ? "ring-2 ring-purple-400 border-purple-200" : ""}
        overflow-hidden
        transition-all duration-300
        ${isModuleFavorite ? "transform -translate-y-1 shadow-lg" : "shadow hover:shadow-md"}
        border-blue-100
        hover:border-blue-200
      `}
      data-handler-id={drop_props?.handlerId || ""}
    >
      {isModuleFavorite && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1.5 shadow-md z-20">
          <Star className="h-4 w-4 text-white fill-current" />
        </div>
      )}
      {isHidden && (
        <div className="absolute -top-2 -left-2 bg-purple-500 rounded-full p-1.5 shadow-md z-20">
          <EyeOff className="h-4 w-4 text-white" />
        </div>
      )}
      {cardContent}
    </Card>
  );
}
