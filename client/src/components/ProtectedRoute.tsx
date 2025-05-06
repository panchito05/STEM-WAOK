import { ComponentType } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute<P extends object>(Component: ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const [, setLocation] = useLocation();

    if (isLoading) {
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
      setLocation("/login");
      return null;
    }

    return <Component {...props} />;
  };
}
