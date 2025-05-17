import { useRef, useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { useAccessibleDnd } from "./AccessibleDndContext";
import { useModuleStore, useModuleFavorites } from "@/store/moduleStore";
import { Module } from "@/utils/operationComponents";
import { 
  GripVertical, MoreVertical, Star, StarOff, Plus, Minus, X, 
  DivideIcon, PieChart, BookOpen, Hash, Calculator, 
  ArrowLeftRight, Square, Percent, Triangle, LucideIcon,
  Eye, EyeOff, MapIcon
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
import { useGlobalLanguage } from "@/hooks/useGlobalLanguage";

// Traducciones de los módulos
const moduleTranslations = {
  addition: {
    displayName: {
      english: "Addition",
      spanish: "Suma"
    },
    description: {
      english: "Practice addition with various difficulty levels",
      spanish: "Practica sumas con varios niveles de dificultad"
    }
  },
  fractions: {
    displayName: {
      english: "Fractions",
      spanish: "Fracciones"
    },
    description: {
      english: "Learn to add, subtract, and compare fractions",
      spanish: "Aprende a sumar, restar y comparar fracciones"
    }
  },
  counting: {
    displayName: {
      english: "Counting Numbers",
      spanish: "Conteo de Números"
    },
    description: {
      english: "Practice counting with fun visualization",
      spanish: "Practica conteo con visualización divertida"
    }
  }
};

interface DraggableModuleCardProps {
  module: Module;
  index: number;
}

export default function DraggableModuleCard({ module, index }: DraggableModuleCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { useDragItem, useDropTarget } = useAccessibleDnd();
  const { 
    toggleHidden, 
    moveModule,
    hiddenModules
  } = useModuleStore();
  
  // Obtenemos los favoritos del perfil activo desde SettingsContext
  const { toggleFavorite, isFavorite } = useModuleFavorites();
  
  // Obtenemos la configuración personalizada del módulo
  const { moduleSettings } = useSettings();
  
  // Obtenemos el idioma actual
  const { isSpanish } = useGlobalLanguage();

  const isModuleFavorite = isFavorite(module.id);
  const isHidden = hiddenModules.includes(module.id);
  
  // Obtener la configuración específica para este módulo (si existe)
  const moduleConfig = moduleSettings[module.id];

  const [{ isDragging }, drag] = useDragItem(() => ({
    type: "MODULE_CARD",
    item: { id: module.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [{ handlerId }, drop] = useDropTarget(() => ({
    accept: "MODULE_CARD",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { id: string; index: number }, monitor) {
      if (!ref.current) {
        return;
      }
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
  
  drag(drop(ref));
  
  const getDifficultyBadge = (defaultDifficulty: string) => {
    // Si el módulo tiene configuración personalizada, mostrar esa dificultad en lugar de la predeterminada
    const difficulty = moduleConfig?.difficulty || defaultDifficulty;
    
    // Traducciones de dificultad
    const difficultyLabels = {
      beginner: isSpanish ? "Principiante" : "Beginner",
      elementary: isSpanish ? "Elemental" : "Elementary",
      intermediate: isSpanish ? "Intermedio" : "Intermediate",
      advanced: isSpanish ? "Avanzado" : "Advanced",
      expert: isSpanish ? "Experto" : "Expert",
      comingSoon: isSpanish ? "Próximamente" : "Coming Soon"
    };
    
    switch (difficulty) {
      case "beginner":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 font-medium px-3 py-1 rounded-full">{difficultyLabels.beginner}</Badge>;
      case "elementary":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 font-medium px-3 py-1 rounded-full">{difficultyLabels.elementary}</Badge>;
      case "intermediate":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 font-medium px-3 py-1 rounded-full">{difficultyLabels.intermediate}</Badge>;
      case "advanced":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 font-medium px-3 py-1 rounded-full">{difficultyLabels.advanced}</Badge>;
      case "expert":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 font-medium px-3 py-1 rounded-full">{difficultyLabels.expert}</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 font-medium px-3 py-1 rounded-full">{difficultyLabels.comingSoon}</Badge>;
    }
  };

  // Función para obtener el icono correspondiente
  const getModuleIcon = () => {
    if (!module.icon) return <Plus className="h-6 w-6" />;
    
    switch (module.icon) {
      case "Plus": return <Plus className="h-6 w-6" />;
      case "Minus": return <Minus className="h-6 w-6" />;
      case "X": return <X className="h-6 w-6" />;
      case "DivideIcon": return <DivideIcon className="h-6 w-6" />;
      case "PieChart": return <PieChart className="h-6 w-6" />;
      case "BookOpen": return <BookOpen className="h-6 w-6" />;
      case "Hash": return <Hash className="h-6 w-6" />;
      case "Calculator": return <Calculator className="h-6 w-6" />;
      case "ArrowLeftRight": return <ArrowLeftRight className="h-6 w-6" />;
      case "Square": return <Square className="h-6 w-6" />;
      case "Percent": return <Percent className="h-6 w-6" />;
      case "Triangle": return <Triangle className="h-6 w-6" />;
      case "MapIcon": return <MapIcon className="h-6 w-6" />;
      default: return <Plus className="h-6 w-6" />;
    }
  };

  const cardContent = (
    <>
      <div 
        className="flex justify-between items-center p-4 border-b border-gray-200 relative overflow-hidden"
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
        
        <div className="flex items-center relative z-10">
          <div className="mr-2 cursor-move text-white opacity-80 hover:opacity-100 transition-opacity" aria-hidden="true">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex items-center">
            <div className="mr-3 bg-white/25 p-2 rounded-lg shadow-inner">
              {getModuleIcon()}
            </div>
            <h3 className="text-xl font-bold text-white text-shadow">
              {moduleTranslations[module.id as keyof typeof moduleTranslations]
                ? isSpanish 
                  ? moduleTranslations[module.id as keyof typeof moduleTranslations].displayName.spanish
                  : moduleTranslations[module.id as keyof typeof moduleTranslations].displayName.english
                : module.displayName
              }
            </h3>
          </div>
        </div>
        <div className="flex space-x-2 relative z-10">
          <button 
            className={`focus:outline-none p-1.5 rounded-full transition-all ${
              module.comingSoon 
                ? "text-gray-300 cursor-not-allowed" 
                : isModuleFavorite 
                  ? "text-yellow-400 hover:text-white bg-white/20 hover:bg-white/10" 
                  : "text-white hover:text-yellow-400 hover:bg-white/20"
            }`}
            onClick={(e) => !module.comingSoon && handleToggleFavorite(e)}
            disabled={module.comingSoon}
            aria-label={isModuleFavorite 
              ? (isSpanish ? "Quitar de favoritos" : "Remove from favorites") 
              : (isSpanish ? "Añadir a favoritos" : "Add to favorites")
            }
          >
            <Star className={`h-5 w-5 ${isModuleFavorite ? "fill-current" : ""}`} />
          </button>
          {!module.comingSoon && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-blue-100">
                <DropdownMenuItem onClick={handleToggleFavorite} className="cursor-pointer">
                  <div className="flex items-center">
                    {isModuleFavorite ? (
                      <>
                        <StarOff className="h-4 w-4 mr-2 text-amber-500" />
                        Quitar de favoritos
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2 text-amber-500" />
                        Añadir a favoritos
                      </>
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleHidden(module.id)} className="cursor-pointer">
                  <div className="flex items-center">
                    {isHidden ? (
                      <>
                        <Eye className="h-4 w-4 mr-2 text-purple-500" />
                        Restaurar módulo
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 mr-2 text-purple-500" />
                        Ocultar módulo
                      </>
                    )}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="p-5 bg-gradient-to-b from-white to-blue-50">
        <p className={`text-sm mb-5 ${module.comingSoon ? "text-gray-400" : "text-gray-600"}`}>
          {moduleTranslations[module.id as keyof typeof moduleTranslations]
            ? isSpanish 
              ? moduleTranslations[module.id as keyof typeof moduleTranslations].description.spanish
              : moduleTranslations[module.id as keyof typeof moduleTranslations].description.english
            : module.description
          }
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {getDifficultyBadge(module.difficulty)}
          </div>
          {module.comingSoon ? (
            <Button disabled variant="default" className="text-white bg-gray-300 cursor-not-allowed rounded-full px-5">
              {isSpanish ? "Próximamente" : "Coming Soon"}
            </Button>
          ) : (
            <Link href={`/operation/${module.id}`}>
              <Button 
                variant="default" 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md rounded-full px-5"
              >
                {isSpanish ? "Iniciar" : "Start"}
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
      data-handler-id={handlerId}
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
