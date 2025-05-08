import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AccessibleDndContextProvider } from "./components/AccessibleDndContext";
import { AuthProvider } from "./context/AuthContext";
import { ProgressProvider } from "./context/ProgressContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ChildProfilesProvider } from "./context/ChildProfilesContext";

createRoot(document.getElementById("root")!).render(
  <App />
);
