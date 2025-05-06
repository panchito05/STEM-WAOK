import { useRef } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { useAccessibleDnd } from "./AccessibleDndContext";
import { useModuleStore } from "@/store/moduleStore";
import { Module } from "@/utils/operationComponents";
import { GripVertical, MoreVertical, Star } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DraggableModuleCardProps {
  module: Module;
  index: number;
}

export default function DraggableModuleCard({ module, index }: DraggableModuleCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { useDragItem, useDropTarget } = useAccessibleDnd();
  const { 
    toggleFavorite, 
    toggleHidden, 
    moveModule,
    favoriteModules
  } = useModuleStore();

  const isFavorite = favoriteModules.includes(module.id);

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
  
  drag(drop(ref));
  
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Beginner</Badge>;
      case "intermediate":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Intermediate</Badge>;
      case "advanced":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Advanced</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-500 hover:bg-gray-100">Coming Soon</Badge>;
    }
  };

  const cardContent = (
    <>
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="mr-2 cursor-move text-gray-400" aria-hidden="true">
            <GripVertical className="h-5 w-5" />
          </div>
          <h3 className={`text-lg font-semibold ${module.comingSoon ? "text-gray-400" : "text-gray-900"}`}>
            {module.displayName}
          </h3>
        </div>
        <div className="flex space-x-2">
          <button 
            className={`focus:outline-none ${
              module.comingSoon 
                ? "text-gray-300 cursor-not-allowed" 
                : isFavorite 
                  ? "text-yellow-400 hover:text-gray-400" 
                  : "text-gray-400 hover:text-yellow-400"
            }`}
            onClick={() => !module.comingSoon && toggleFavorite(module.id)}
            disabled={module.comingSoon}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
          </button>
          {!module.comingSoon && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500 h-8 w-8">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleHidden(module.id)}>
                  Hide module
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className={`text-sm mb-4 ${module.comingSoon ? "text-gray-400" : "text-gray-600"}`}>
          {module.description}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {getDifficultyBadge(module.difficulty)}
          </div>
          {module.comingSoon ? (
            <Button disabled variant="primary" className="text-white bg-gray-300 cursor-not-allowed">
              Start
            </Button>
          ) : (
            <Link href={`/operations/${module.id}`}>
              <Button variant="default" className="text-white">
                Start
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
        ${module.comingSoon ? "border-2 border-dashed border-gray-300" : ""}
        overflow-hidden
      `}
      data-handler-id={handlerId}
    >
      {cardContent}
    </Card>
  );
}
