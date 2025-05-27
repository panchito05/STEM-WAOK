import { useState, useMemo } from "react";
import { useModuleStore, useModuleFavorites } from "@/store/moduleStore";
import AdditionModuleCard from "./ModuleCards/AdditionModuleCard";
import SubtractionModuleCard from "./ModuleCards/SubtractionModuleCard";
import MultiplicationModuleCard from "./ModuleCards/MultiplicationModuleCard";
import DivisionModuleCard from "./ModuleCards/DivisionModuleCard";
import DraggableModuleCard from "./DraggableModuleCard";
import FilterBar from "./FilterBar";
import { operationModules } from "@/utils/operationComponents";
import { Module } from "../types/module";

export default function ModuleList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { 
    customModuleOrder, 
    hiddenModules, 
    showOnlyFavorites,
    showHidden,
    resetHiddenModules
  } = useModuleStore();
  
  // Obtenemos los favoritos del perfil activo
  const { favoriteModules } = useModuleFavorites();

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
      modules = modules.filter(module => {
        const searchLower = searchQuery.toLowerCase();
        
        // Spanish to English mapping for module names
        const spanishToEnglish: Record<string, string> = {
          'suma': 'addition',
          'adición': 'addition',
          'sumas': 'addition',
          'fracciones': 'fractions',
          'fracción': 'fractions',
          'conteo': 'counting',
          'contar': 'counting',
          'números': 'numbers',
          'numero': 'numbers',
          'resta': 'subtraction',
          'restar': 'subtraction',
          'restas': 'subtraction',
          'multiplicacion': 'multiplication',
          'multiplicar': 'multiplication',
          'division': 'division',
          'dividir': 'division'
        };
        
        // Check direct match first
        const directMatch = module.displayName.toLowerCase().includes(searchLower) ||
                           module.description.toLowerCase().includes(searchLower);
        
        // Check Spanish term match
        const spanishMatch = Object.entries(spanishToEnglish).some(([spanish, english]) => {
          if (spanish.includes(searchLower)) {  // Corregido: buscar si la palabra española contiene la búsqueda
            return module.id.toLowerCase().includes(english) ||
                   module.displayName.toLowerCase().includes(english);
          }
          return false;
        });
        
        return directMatch || spanishMatch;
      });
    }

    // Filter by favorites if necessary
    if (showOnlyFavorites) {
      modules = modules.filter(module => favoriteModules.includes(module.id));
    }

    // If "Show Hidden" is active, only display hidden modules
    if (showHidden) {
      modules = modules.filter(module => hiddenModules.includes(module.id));
    } else {
      // Otherwise, filter out hidden modules
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
      
      {showHidden && hiddenModules.length > 0 && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={resetHiddenModules}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Activate All Modules
          </button>
        </div>
      )}
      
      <div className="grid gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 
                     grid-cols-2 
                     min-[480px]:grid-cols-2 
                     sm:grid-cols-3 
                     md:grid-cols-3 
                     lg:grid-cols-4 
                     xl:grid-cols-3 
                     2xl:grid-cols-4 
                     w-full">
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
              : showHidden
                ? "No hidden modules. You can hide modules using the 'Hide' button on each card."
                : "Try adjusting your filters or search query."
            }
          </p>
        </div>
      )}
    </>
  );
}
