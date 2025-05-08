import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AccessibleDndContextProvider } from "./components/AccessibleDndContext";
import { AuthProvider } from "./context/AuthContext";
import { ProgressProvider } from "./context/ProgressContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ChildProfilesProvider } from "./context/ChildProfilesContext";
// Importar nuestros nuevos proveedores de contexto para el sistema ultra seguro
import { FrozenProblemProvider } from "./lib/frozen-problem-system";
import { ActionQueueProvider } from "./lib/action-queue-system";

createRoot(document.getElementById("root")!).render(
  <FrozenProblemProvider>
    <ActionQueueProvider>
      <App />
    </ActionQueueProvider>
  </FrozenProblemProvider>
);
