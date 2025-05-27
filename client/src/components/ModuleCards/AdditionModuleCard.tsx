import { Link } from "wouter";
import { useModuleFavorites } from "@/store/moduleStore";
import { Button } from "@/components/ui/button";
import { Star, Plus, Eye } from "lucide-react";
import { Module } from "@/utils/operationComponents";

interface AdditionModuleCardProps {
  module: Module;
  index: number;
}

export default function AdditionModuleCard({ module, index }: AdditionModuleCardProps) {
  const { toggleFavorite, favoriteModules } = useModuleFavorites();
  const isModuleFavorite = favoriteModules.includes(module.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(module.id);
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
    <div className="addition-module-card h-full bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:border-blue-300">
      {/* Header compacto */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-3 relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          {/* Lado izquierdo: ícono + título */}
          <div className="flex items-center flex-1">
            <div className="mr-3 bg-white/25 p-2 rounded-lg shadow-inner">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-bold text-white">Suma</h3>
          </div>
          {/* Lado derecho: íconos de acción */}
          <div className="flex space-x-2">
            <button 
              className={`p-1.5 rounded-full transition-all ${
                isModuleFavorite 
                  ? "text-yellow-400 bg-white/20" 
                  : "text-white hover:text-yellow-400 hover:bg-white/20"
              }`}
              onClick={handleToggleFavorite}
            >
              <Star className={`h-4 w-4 ${isModuleFavorite ? "fill-current" : ""}`} />
            </button>
            <button 
              className="text-white hover:text-blue-200 hover:bg-white/20 p-1.5 rounded-full transition-all"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3 bg-gradient-to-b from-white to-blue-50">
        <p className="text-sm mb-4 text-gray-600">
          Practica sumas con varios niveles de dificultad
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${difficultyColors[module.difficulty as keyof typeof difficultyColors] || difficultyColors.beginner}`}>
            {difficultyLabels[module.difficulty as keyof typeof difficultyLabels] || 'Principiante'}
          </span>
          <Link href={`/operation/${module.id}`}>
            <Button 
              variant="default" 
              className="text-white bg-blue-600 hover:bg-blue-700 rounded-full px-4 text-sm h-9 w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
            >
              Comenzar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}