import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { 
  signInWithGoogle, 
  getGoogleRedirectResult, 
  firebaseSignOut,
  subscribeToAuthChanges
} from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar los resultados de la redirección de Google Auth al cargar la página
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setIsLoading(true);
        console.log("Intentando obtener el resultado de redirección de Google...");
        const result = await getGoogleRedirectResult();
        
        console.log("Resultado de redirección:", result ? "Obtenido" : "No hay resultado");
        
        if (result && result.user) {
          console.log("Usuario autenticado con Google:", result.user.email);
          const { uid, email, displayName, photoURL } = result.user;
          
          // Enviar la información del usuario al backend para crear/sincronizar la cuenta
          await handleGoogleAuthSuccess(uid, email || '', displayName || '', photoURL || '');
        } else {
          console.log("No hay usuario en el resultado de redirección");
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
        toast({
          title: "Authentication Error",
          description: "There was a problem authenticating with Google",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Suscribirse a cambios en el estado de autenticación de Firebase
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        // El usuario está autenticado en Firebase, pero necesitamos sincronizar con nuestro backend
        console.log("Firebase user authenticated:", firebaseUser.email);
      }
    });

    handleRedirectResult();
    fetchUser();
    
    return () => unsubscribe();
  }, [toast]);

  // Función para manejar el éxito de autenticación con Google
  const handleGoogleAuthSuccess = async (
    providerId: string, 
    email: string, 
    name: string, 
    photoUrl: string
  ) => {
    try {
      const res = await apiRequest("POST", "/api/auth/google", {
        providerId,
        email,
        name,
        photoUrl
      });
      
      const userData = await res.json();
      setUser(userData);
      
      toast({
        title: "Login Successful",
        description: `Welcome, ${userData.name || userData.username}!`,
      });
      
      setLocation("/");
    } catch (error) {
      console.error("Error durante la autenticación con Google:", error);
      toast({
        title: "Authentication Error",
        description: "There was a problem with Google authentication",
        variant: "destructive",
      });
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await res.json();
      setUser(userData);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.username}!`,
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
      // No necesitamos hacer nada más aquí, ya que el resultado se manejará
      // a través del efecto handleRedirectResult
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast({
        title: "Google Login Failed",
        description: "Could not sign in with Google",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (username: string, password: string, email?: string, name?: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", { 
        username, 
        password,
        email,
        name
      });
      const userData = await res.json();
      setUser(userData);
      toast({
        title: "Registration Successful",
        description: `Welcome, ${userData.username}!`,
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Cerrar sesión en nuestro backend
      await apiRequest("POST", "/api/auth/logout", {});
      
      // Cerrar sesión en Firebase si está inicializado
      try {
        await firebaseSignOut();
      } catch (firebaseError) {
        console.warn("Firebase logout error:", firebaseError);
      }
      
      setUser(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Could not log out properly",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
