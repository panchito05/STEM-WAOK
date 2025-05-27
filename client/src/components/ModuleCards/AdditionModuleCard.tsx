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
    <div className="addition-module-card bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-2 border-red-500" style={{height: 'auto', maxHeight: '180px'}}>
      {/* Header compacto - DIAGNÓSTICO */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-2 relative border-2 border-yellow-400">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between border-2 border-green-400">
          {/* Lado izquierdo: ícono + título */}
          <div className="flex items-center flex-1 border-2 border-orange-400">
            <div className="mr-2 bg-white/25 p-1.5 rounded-lg shadow-inner border-2 border-purple-400">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-white border-2 border-pink-400">Suma</h3>
          </div>
          {/* Lado derecho: íconos de acción */}
          <div className="flex space-x-1 border-2 border-cyan-400">
            <button 
              className={`p-1 rounded-full transition-all border-2 border-lime-400 ${
                isModuleFavorite 
                  ? "text-yellow-400 bg-white/20" 
                  : "text-white hover:text-yellow-400 hover:bg-white/20"
              }`}
              onClick={handleToggleFavorite}
            >
              <Star className={`h-3.5 w-3.5 ${isModuleFavorite ? "fill-current" : ""}`} />
            </button>
            <button 
              className="text-white hover:text-blue-200 hover:bg-white/20 p-1 rounded-full transition-all border-2 border-indigo-400"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido - DIAGNÓSTICO */}
      <div className="px-2 pt-1 pb-2 bg-gradient-to-b from-white to-blue-50 border-2 border-teal-400">
        <p className="text-xs mb-1 text-gray-600 border-2 border-rose-400">
          Practica sumas con varios niveles de dificultad
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 border-2 border-amber-400">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border-2 border-emerald-400 ${difficultyColors[module.difficulty as keyof typeof difficultyColors] || difficultyColors.beginner}`}>
            {difficultyLabels[module.difficulty as keyof typeof difficultyLabels] || 'Principiante'}
          </span>
          <Link href={`/operation/${module.id}`}>
            <Button 
              variant="default" 
              className="text-white bg-blue-600 hover:bg-blue-700 rounded-full px-3 text-xs h-6 w-full sm:w-auto shadow-md hover:shadow-lg transition-all border-2 border-violet-400"
            >
              Comenzar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}