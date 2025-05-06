import { ReactNode, createContext, useContext } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { useMobile } from "@/hooks/use-mobile";

interface AccessibleDndContextValue {
  useDragItem: typeof useDrag;
  useDropTarget: typeof useDrop;
}

const AccessibleDndContext = createContext<AccessibleDndContextValue | null>(null);

export function AccessibleDndContextProvider({ children }: { children: ReactNode }) {
  const isMobile = useMobile();
  const backend = isMobile ? TouchBackend : HTML5Backend;
  
  const value = {
    useDragItem: useDrag,
    useDropTarget: useDrop,
  };

  return (
    <AccessibleDndContext.Provider value={value}>
      <DndProvider backend={backend}>
        {children}
      </DndProvider>
    </AccessibleDndContext.Provider>
  );
}

export function useAccessibleDnd() {
  const context = useContext(AccessibleDndContext);
  if (!context) {
    throw new Error("useAccessibleDnd must be used within an AccessibleDndContextProvider");
  }
  return context;
}
