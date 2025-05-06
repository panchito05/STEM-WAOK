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
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex-grow max-w-md">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={showOnlyFavorites ? "default" : "outline"}
            className={`text-sm ${showOnlyFavorites 
              ? "text-white bg-yellow-500 hover:bg-yellow-600 border-yellow-500" 
              : "text-yellow-600 hover:text-yellow-700 hover:border-yellow-500"}`}
            onClick={toggleShowOnlyFavorites}
            size="sm"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-2" 
              fill={showOnlyFavorites ? "currentColor" : "none"} 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {showOnlyFavorites ? 'Showing Favorites' : 'Show Favorites'}
          </Button>
          <Button
            variant="outline"
            className="text-sm"
            onClick={toggleShowHidden}
            size="sm"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showHidden ? "Show Hidden" : "Filter"}
          </Button>
        </div>
      </div>
    </div>
  );
}
