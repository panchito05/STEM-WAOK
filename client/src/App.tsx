import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout/Layout";
import HomePage from "@/pages/HomePage";
import OperationPage from "@/pages/OperationPage";
import ProgressPage from "@/pages/ProgressPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import SimpleLoginPage from "@/pages/SimpleLoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import SoonPage from "@/pages/SoonPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext"; 
import { SettingsProvider } from "@/context/SettingsContext";
import { ProgressProvider } from "@/context/ProgressContext";
import LevelUpHandler from "@/components/LevelUpHandler";

// Los providers ahora están a nivel global, ya no necesitamos wrappers adicionales

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/operation/:operation" component={OperationPage} />
      <Route path="/progress" component={ProtectedRoute(ProgressPage)} />
      <Route path="/settings" component={ProtectedRoute(SettingsPage)} />
      <Route path="/profile" component={ProtectedRoute(ProfilePage)} />
      <Route path="/login" component={LoginPage} />
      <Route path="/quick-login" component={SimpleLoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/coming-soon" component={SoonPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <ProgressProvider>
            <Layout>
              <Router />
            </Layout>
            <Toaster />
            <LevelUpHandler />
          </ProgressProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
