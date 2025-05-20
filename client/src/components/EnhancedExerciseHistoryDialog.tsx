/**
 * Diálogo de historial de ejercicios mejorado
 * 
 * Este componente muestra un historial detallado de ejercicios realizados
 * utilizando el sistema estandarizado de almacenamiento de problemas.
 */

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Check, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import problemDataManager, { ProblemDetails } from "@/lib/problemDataManager";
import ProblemRenderer from "./ProblemRenderer";
import { useTranslations } from "@/hooks/use-translations";

interface EnhancedExerciseHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  moduleId: string;
  onViewProblem?: (problemId: string) => void;
}

const EnhancedExerciseHistoryDialog: React.FC<EnhancedExerciseHistoryDialogProps> = ({
  open,
  onClose,
  moduleId,
  onViewProblem
}) => {
  const [problems, setProblems] = useState<ProblemDetails[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<ProblemDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  
  const { t } = useTranslations();
  const translations = t('exerciseHistory');
  
  const PAGE_SIZE = 5;

  // Cargar problemas cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadProblems();
    } else {
      setSelectedProblem(null);
      setCurrentPage(0);
    }
  }, [open, moduleId, filter]);

  // Cargar problemas desde el sistema de gestión de datos
  const loadProblems = () => {
    setIsLoading(true);
    try {
      let allProblems = problemDataManager.getAllProblemsForModule(moduleId);
      
      // Aplicar filtro
      if (filter === 'correct') {
        allProblems = allProblems.filter(p => p.isCorrect);
      } else if (filter === 'incorrect') {
        allProblems = allProblems.filter(p => !p.isCorrect);
      }
      
      // Ordenar por fecha (más recientes primero)
      allProblems.sort((a, b) => b.timestamp - a.timestamp);
      
      setProblems(allProblems);
      setTotalPages(Math.ceil(allProblems.length / PAGE_SIZE));
      
      // Resetear página si fuera del rango
      if (currentPage >= Math.ceil(allProblems.length / PAGE_SIZE)) {
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("Error loading exercise history:", error);
      setProblems([]);
      setTotalPages(0);
    }
    setIsLoading(false);
  };

  // Obtener problemas para la página actual
  const getCurrentPageProblems = () => {
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return problems.slice(start, end);
  };

  // Renderizar problema individual en la lista
  const renderProblemItem = (problem: ProblemDetails) => {
    const dateString = format(new Date(problem.timestamp), 'dd/MM/yyyy HH:mm');
    const timeAgo = formatDistanceToNow(new Date(problem.timestamp), { 
      addSuffix: true,
      locale: es
    });
    
    // Convertir el problema al formato estándar para ProblemRenderer
    const standardProblem = problemDataManager.convertToStandardProblem(
      problem.rawProblem, 
      problem.moduleId
    );
    
    return (
      <div 
        key={problem.id}
        className={`border rounded-lg p-3 mb-2 cursor-pointer hover:bg-gray-50 transition-colors ${
          selectedProblem?.id === problem.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onClick={() => setSelectedProblem(problem)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              {problem.isCorrect ? (
                <span className="inline-flex items-center text-green-600 font-medium text-sm">
                  <Check className="w-4 h-4 mr-1" /> {translations.correct}
                </span>
              ) : (
                <span className="inline-flex items-center text-red-600 font-medium text-sm">
                  <X className="w-4 h-4 mr-1" /> {translations.incorrect}
                </span>
              )}
              
              <span className="text-gray-500 text-xs ml-2">
                {problem.status === 'timeout' && `(${translations.timeout})`}
                {problem.status === 'revealed' && `(${translations.revealed})`}
              </span>
            </div>
            
            <div className="mb-2">
              <ProblemRenderer 
                problem={standardProblem} 
                showAnswer={false}
                vertical={false}
                className="text-lg"
              />
            </div>
            
            <div className="flex items-center text-xs text-gray-500 space-x-3">
              <span className="inline-flex items-center">
                <Calendar className="w-3 h-3 mr-1" /> {dateString}
              </span>
              <span className="inline-flex items-center">
                <Clock className="w-3 h-3 mr-1" /> {timeAgo}
              </span>
            </div>
          </div>
          
          <div className="ml-4">
            {onViewProblem && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProblem(problem.id);
                  onClose();
                }}
              >
                {translations.view}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar detalles del problema seleccionado
  const renderProblemDetails = () => {
    if (!selectedProblem) return null;
    
    // Convertir el problema seleccionado al formato estándar
    const standardProblem = problemDataManager.convertToStandardProblem(
      selectedProblem.rawProblem, 
      selectedProblem.moduleId
    );
    
    return (
      <div className="border rounded-lg p-4 mt-4">
        <h3 className="text-lg font-medium mb-3">{translations.problemDetails}</h3>
        
        <div className="bg-gray-50 p-4 rounded-md mb-3 flex justify-center">
          <ProblemRenderer 
            problem={standardProblem} 
            showAnswer={true}
            vertical={true}
            className="text-xl"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">{translations.status}:</span>
            <span className={`ml-2 font-medium ${selectedProblem.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {selectedProblem.isCorrect ? translations.correct : translations.incorrect}
            </span>
          </div>
          
          <div>
            <span className="text-gray-500">{translations.attempts}:</span>
            <span className="ml-2 font-medium">{selectedProblem.attempts}</span>
          </div>
          
          <div>
            <span className="text-gray-500">{translations.timeElapsed}:</span>
            <span className="ml-2 font-medium">
              {selectedProblem.timeElapsed} {translations.seconds}
            </span>
          </div>
          
          <div>
            <span className="text-gray-500">{translations.difficulty}:</span>
            <span className="ml-2 font-medium capitalize">{selectedProblem.difficulty}</span>
          </div>
          
          <div className="col-span-2">
            <span className="text-gray-500">{translations.yourAnswer}:</span>
            <span className="ml-2 font-medium">
              {selectedProblem.userAnswer !== null ? selectedProblem.userAnswer : translations.noAnswer}
            </span>
          </div>
        </div>
        
        {onViewProblem && (
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => {
                onViewProblem(selectedProblem.id);
                onClose();
              }}
            >
              {translations.viewInExercise}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Renderizar controles de paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center mt-4 space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <span className="text-sm">
          {translations.page} {currentPage + 1} {translations.of} {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
          disabled={currentPage === totalPages - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  // Renderizar filtros
  const renderFilters = () => {
    return (
      <div className="flex space-x-2 mb-4">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          {translations.allProblems}
        </Button>
        
        <Button
          variant={filter === 'correct' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('correct')}
        >
          <Check className="w-4 h-4 mr-1" /> {translations.correctOnly}
        </Button>
        
        <Button
          variant={filter === 'incorrect' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('incorrect')}
        >
          <X className="w-4 h-4 mr-1" /> {translations.incorrectOnly}
        </Button>
      </div>
    );
  };

  // Renderizar estadísticas
  const renderStats = () => {
    const stats = problemDataManager.getModuleStats(moduleId);
    
    if (!stats || stats.totalProblems === 0) return null;
    
    return (
      <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg mb-4 text-center">
        <div>
          <div className="text-2xl font-bold">{stats.totalProblems}</div>
          <div className="text-xs text-gray-500">{translations.totalProblems}</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-green-600">{Math.round(stats.accuracy)}%</div>
          <div className="text-xs text-gray-500">{translations.accuracy}</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold">{Math.round(stats.averageTime)}s</div>
          <div className="text-xs text-gray-500">{translations.avgTime}</div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
        </DialogHeader>
        
        {renderStats()}
        {renderFilters()}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : problems.length > 0 ? (
              <>
                <div className="space-y-2">
                  {getCurrentPageProblems().map(renderProblemItem)}
                </div>
                {renderPagination()}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {translations.noHistory}
              </div>
            )}
          </div>
          
          <div>
            {selectedProblem ? 
              renderProblemDetails() : 
              <div className="border border-dashed rounded-lg p-6 text-center text-gray-500 h-full flex items-center justify-center">
                {translations.selectProblem}
              </div>
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedExerciseHistoryDialog;