import { useState, useMemo } from "react";
import { useModuleStore } from "@/store/moduleStore";
import DraggableModuleCard from "./DraggableModuleCard";
import FilterBar from "./FilterBar";
import { operationModules } from "@/utils/operationComponents";

export default function ModuleList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { 
    customModuleOrder, 
    favoriteModules, 
    hiddenModules, 
    showOnlyFavorites,
    showHidden 
  } = useModuleStore();

  const filteredModules = useMemo(() => {
    // Start with all modules
    let modules = [...operationModules];
    
    // Apply custom order from the store
    if (customModuleOrder.length > 0) {
      const orderedModules = [];
      // First add all modules from the custom order
      for (const id of customModuleOrder) {
        const module = modules.find(m => m.id === id);
        if (module) orderedModules.push(module);
      }
      // Then add any modules that might not be in the custom order
      for (const module of modules) {
        if (!customModuleOrder.includes(module.id)) {
          orderedModules.push(module);
        }
      }
      modules = orderedModules;
    }
    
    // Move favorite modules to the beginning of the list
    if (favoriteModules.length > 0) {
      // Separate favorites and non-favorites
      const favorites = modules.filter(module => favoriteModules.includes(module.id));
      const nonFavorites = modules.filter(module => !favoriteModules.includes(module.id));
      
      // Combine with favorites first
      modules = [...favorites, ...nonFavorites];
    }

    // Filter by search query
    if (searchQuery) {
      modules = modules.filter(module =>
        module.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by favorites if necessary
    if (showOnlyFavorites) {
      modules = modules.filter(module => favoriteModules.includes(module.id));
    }

    // Filter out hidden modules unless we're showing them
    if (!showHidden) {
      modules = modules.filter(module => !hiddenModules.includes(module.id));
    }

    return modules;
  }, [searchQuery, customModuleOrder, favoriteModules, hiddenModules, showOnlyFavorites, showHidden]);

  return (
    <>
      <FilterBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredModules.map((module, index) => (
          <DraggableModuleCard
            key={module.id}
            module={module}
            index={index}
          />
        ))}
      </div>
      
      {filteredModules.length === 0 && (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-900">No modules found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {showOnlyFavorites 
              ? "You don't have any favorites yet. Add some by clicking the star icon."
              : "Try adjusting your filters or search query."}
          </p>
        </div>
      )}
    </>
  );
}
