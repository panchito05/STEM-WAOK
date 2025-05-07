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

// Wrap pages that need settings
const SettingsWrappedOperation = (props: any) => (
  <SettingsProvider>
    <ProgressProvider>
      <OperationPage {...props} />
    </ProgressProvider>
  </SettingsProvider>
);

const SettingsWrappedSettingsPage = (props: any) => (
  <SettingsProvider>
    <ProgressProvider>
      <SettingsPage {...props} />
    </ProgressProvider>
  </SettingsProvider>
);

const SettingsWrappedProgressPage = (props: any) => (
  <SettingsProvider>
    <ProgressProvider>
      <ProgressPage {...props} />
    </ProgressProvider>
  </SettingsProvider>
);

const SettingsWrappedProfilePage = (props: any) => (
  <SettingsProvider>
    <ProgressProvider>
      <ProfilePage {...props} />
    </ProgressProvider>
  </SettingsProvider>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/operation/:operation" component={SettingsWrappedOperation} />
      <Route path="/progress" component={ProtectedRoute(SettingsWrappedProgressPage)} />
      <Route path="/settings" component={ProtectedRoute(SettingsWrappedSettingsPage)} />
      <Route path="/profile" component={ProtectedRoute(SettingsWrappedProfilePage)} />
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
          <Layout>
            <Router />
          </Layout>
          <Toaster />
          <LevelUpHandler />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
