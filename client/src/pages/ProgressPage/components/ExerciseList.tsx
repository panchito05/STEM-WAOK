import { useState, useMemo } from "react";
import { ExerciseResult } from "@/context/ProgressContext";
import { operationModules } from "@/utils/operationComponents";
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, ChevronUp, Search, Timer } from "lucide-react";

interface ExerciseListProps {
  exercises: ExerciseResult[];
}

type SortField = "date" | "score" | "time" | "difficulty";
type SortDirection = "asc" | "desc";

export function ExerciseList({ exercises }: ExerciseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const filteredAndSortedExercises = useMemo(() => {
    // Primero filtramos
    let filtered = [...exercises];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ex => {
        const moduleName = getModuleName(ex.operationId).toLowerCase();
        return moduleName.includes(term) || ex.difficulty.toLowerCase().includes(term);
      });
    }
    
    if (moduleFilter !== "all") {
      filtered = filtered.filter(ex => ex.operationId === moduleFilter);
    }
    
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(ex => ex.difficulty === difficultyFilter);
    }
    
    // Luego ordenamos
    return filtered.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      
      switch (sortField) {
        case "date":
          return direction * (new Date(b.date).getTime() - new Date(a.date).getTime());
        case "score":
          return direction * ((b.score / b.totalProblems) - (a.score / a.totalProblems));
        case "time":
          return direction * (a.timeSpent - b.timeSpent);
        case "difficulty": {
          const difficultyOrder: Record<string, number> = {
            beginner: 1,
            elementary: 2,
            intermediate: 3,
            advanced: 4,
            expert: 5
          };
          return direction * (difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
        }
        default:
          return 0;
      }
    });
  }, [exercises, searchTerm, moduleFilter, difficultyFilter, sortField, sortDirection]);

  const getModuleName = (id: string) => {
    const module = operationModules.find(m => m.id === id);
    return module?.displayName || id;
  };

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-blue-100 text-blue-800";
      case "elementary": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-orange-100 text-orange-800";
      case "advanced": return "bg-purple-100 text-purple-800";
      case "expert": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Obtenemos todas las dificultades únicas de los ejercicios
  const uniqueDifficulties = useMemo(() => {
    const difficulties = new Set(exercises.map(ex => ex.difficulty));
    return Array.from(difficulties);
  }, [exercises]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por módulo o dificultad..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los módulos</SelectItem>
              {operationModules
                .filter(module => !module.comingSoon)
                .map(module => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.displayName}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por dificultad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las dificultades</SelectItem>
              {uniqueDifficulties.map(diff => (
                <SelectItem key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSortedExercises.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay ejercicios que coincidan con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-1 px-2 h-8 font-medium"
                    onClick={() => toggleSort("date")}
                  >
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Fecha
                    {getSortIcon("date")}
                  </Button>
                </TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-1 px-2 h-8 font-medium"
                    onClick={() => toggleSort("difficulty")}
                  >
                    Dificultad
                    {getSortIcon("difficulty")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-1 px-2 h-8 font-medium"
                    onClick={() => toggleSort("score")}
                  >
                    Puntuación
                    {getSortIcon("score")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-1 px-2 h-8 font-medium"
                    onClick={() => toggleSort("time")}
                  >
                    <Timer className="h-4 w-4 text-gray-500" />
                    Tiempo
                    {getSortIcon("time")}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedExercises.map((exercise, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {format(parseISO(exercise.date), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>{getModuleName(exercise.operationId)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyBadgeClass(exercise.difficulty)}`}>
                      {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {exercise.score}/{exercise.totalProblems} ({Math.round((exercise.score / exercise.totalProblems) * 100)}%)
                  </TableCell>
                  <TableCell>{exercise.timeSpent}s</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}