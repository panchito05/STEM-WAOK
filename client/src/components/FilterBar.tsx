import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModuleStore } from "@/store/moduleStore";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function FilterBar({ searchQuery, setSearchQuery }: FilterBarProps) {
  const { 
    showOnlyFavorites, 
    toggleShowOnlyFavorites,
    showHidden,
    toggleShowHidden 
  } = useModuleStore();

  return (
    <div className="bg-white p-3 sm:p-5 rounded-xl shadow-md mb-6 border border-blue-100">
      <div className="flex flex-col space-y-4">
        {/* Barra de búsqueda - Siempre en la parte superior */}
        <div className="w-full">
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-blue-400" />
            </div>
            <Input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-lg w-full"
            />
          </div>
        </div>
        
        {/* Botones de filtro - Stack vertical en móvil, horizontal en desktop */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 w-full sm:w-auto sm:justify-end">
          <Button
            variant={showOnlyFavorites ? "default" : "outline"}
            className={`text-xs sm:text-sm rounded-full px-3 sm:px-4 py-2 transition-all w-full sm:w-auto ${showOnlyFavorites 
              ? "text-white bg-amber-500 hover:bg-amber-600 border-amber-500 shadow-md" 
              : "text-amber-600 hover:text-amber-700 hover:border-amber-500 border-amber-200"}`}
            onClick={toggleShowOnlyFavorites}
            size="sm"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" 
              fill={showOnlyFavorites ? "currentColor" : "none"} 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="truncate">
              {showOnlyFavorites ? 'View All' : 'Favorites'}
            </span>
          </Button>
          <Button
            variant={showHidden ? "default" : "outline"}
            className={`text-xs sm:text-sm rounded-full px-3 sm:px-4 py-2 transition-all w-full sm:w-auto ${
              showHidden 
                ? "bg-purple-500 hover:bg-purple-600 text-white shadow-md animate-flash" 
                : "border-purple-200 text-purple-600 hover:border-purple-400"
            }`}
            onClick={toggleShowHidden}
            size="sm"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="truncate">
              {showHidden ? "View Active" : "View Inactive"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
