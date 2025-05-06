import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AccessibleDndContextProvider } from "./components/AccessibleDndContext";
import { AuthProvider } from "./context/AuthContext";
import { ProgressProvider } from "./context/ProgressContext";
import { SettingsProvider } from "./context/SettingsContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ProgressProvider>
      <SettingsProvider>
        <AccessibleDndContextProvider>
          <App />
        </AccessibleDndContextProvider>
      </SettingsProvider>
    </ProgressProvider>
  </AuthProvider>
);
