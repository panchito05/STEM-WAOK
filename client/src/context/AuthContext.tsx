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
        
        // Verificar dominio actual vs. dominio autorizado en Firebase
        const currentDomain = window.location.hostname;
        console.log("Dominio actual:", currentDomain);
        console.log("Verificando redirección desde la URL:", window.location.href);
        
        // Intentar obtener el resultado de la redirección
        const result = await getGoogleRedirectResult();
        
        if (result && result.user) {
          console.log("Usuario autenticado con Google:", result.user.email);
          const { uid, email, displayName, photoURL } = result.user;
          
          // Enviar la información del usuario al backend para crear/sincronizar la cuenta
          await handleGoogleAuthSuccess(uid, email || '', displayName || '', photoURL || '');
          
          toast({
            title: "Autenticación exitosa",
            description: `Bienvenido, ${displayName || email}`,
          });
        } else {
          console.log("No hay usuario en el resultado de redirección");
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
        
        // Mostrar mensaje de error específico
        if (error instanceof Error) {
          let errorMessage = "There was a problem authenticating with Google";
          
          // Si es un error de Firebase, mostrar mensaje específico
          if ('code' in error) {
            const errorCode = (error as any).code;
            
            if (errorCode === 'auth/unauthorized-domain') {
              errorMessage = "El dominio no está autorizado para autenticación. Contacta al administrador.";
              console.error("ERROR DE DOMINIO NO AUTORIZADO. Verifica la configuración en Firebase Console.");
            } else {
              errorMessage = `Error: ${errorCode}`;
            }
          }
          
          toast({
            title: "Authentication Error",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Authentication Error",
            description: "Unknown authentication error",
            variant: "destructive",
          });
        }
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
      console.log("Iniciando login con Google...");
      console.log("URL actual:", window.location.href);
      console.log("Dominio:", window.location.hostname);
      
      // Intenta autenticar con Google
      const result = await signInWithGoogle();
      
      // Si es null, significa que hubo un intento de redirección o el usuario cerró el popup
      // No es un error, simplemente no seguimos procesando
      if (!result) {
        console.log("Proceso de login con Google interrumpido o redirigido");
        return;
      }
      
      // Si tenemos un resultado de autenticación, procesar el usuario
      if (result.user) {
        console.log("Login con Google exitoso mediante popup");
        const { uid, email, displayName, photoURL } = result.user;
        
        // Enviar la información del usuario al backend
        await handleGoogleAuthSuccess(uid, email || '', displayName || '', photoURL || '');
      }
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      
      // Manejar tipos específicos de errores con mensajes apropiados
      if (error.code) {
        console.error("Código de error Firebase:", error.code);
        
        switch (error.code) {
          case 'auth/unauthorized-domain':
            toast({
              title: "Error de dominio",
              description: "Este dominio no está autorizado para autenticación con Google. Contacta al administrador.",
              variant: "destructive",
            });
            break;
            
          case 'auth/popup-blocked':
            toast({
              title: "Popup bloqueado",
              description: "Tu navegador ha bloqueado la ventana de autenticación. Permite popups para este sitio.",
              variant: "destructive",
            });
            break;
            
          case 'auth/cancelled-popup-request':
          case 'auth/popup-closed-by-user':
            // Estos no son errores críticos, solo informar al usuario
            toast({
              title: "Autenticación cancelada",
              description: "Has cerrado la ventana de autenticación antes de completar el proceso.",
              variant: "default",
            });
            return; // No lanzar error en este caso
            
          default:
            toast({
              title: "Error de autenticación",
              description: `Error: ${error.message || error.code || "Desconocido"}`,
              variant: "destructive",
            });
        }
      } else {
        // Error genérico
        toast({
          title: "Error de autenticación",
          description: error.message || "No se pudo iniciar sesión con Google",
          variant: "destructive",
        });
      }
      
      // No lanzar el error para casos específicos que ya hemos manejado
      if (error.code === 'auth/cancelled-popup-request' || 
          error.code === 'auth/popup-closed-by-user') {
        return;
      }
      
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
      console.log("🔄 Iniciando proceso de cierre de sesión...");
      
      // Publicar un evento personalizado para notificar a otros contextos
      // Este evento será escuchado por el SettingsContext para actualizar su estado
      const logoutEvent = new CustomEvent("user-logout");
      window.dispatchEvent(logoutEvent);
      console.log("📣 Evento de cierre de sesión emitido");
      
      // Cerrar sesión en nuestro backend
      await apiRequest("POST", "/api/auth/logout", {});
      console.log("✅ Sesión cerrada en el backend");
      
      // Cerrar sesión en Firebase si está inicializado
      try {
        await firebaseSignOut();
        console.log("✅ Sesión cerrada en Firebase");
      } catch (firebaseError) {
        console.warn("⚠️ Firebase logout error:", firebaseError);
      }
      
      // Actualizar estado local
      setUser(null);
      console.log("✅ Estado de usuario restablecido localmente");
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      
      // Redirigir a la página principal
      setLocation("/");
    } catch (error) {
      console.error("❌ Error durante el cierre de sesión:", error);
      
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
