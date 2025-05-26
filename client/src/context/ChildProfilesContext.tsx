import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "@/lib/queryClient"; 
import { useToast } from "@/hooks/use-toast";
import { ChildProfile } from "@shared/schema";

interface ChildProfilesContextType {
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  isLoading: boolean;
  error: Error | null;
  fetchProfiles: () => Promise<void>;
  createProfile: (name: string, age?: number, avatar?: string) => Promise<ChildProfile | null>;
  updateProfile: (id: number, data: Partial<ChildProfile>) => Promise<ChildProfile | null>;
  deleteProfile: (id: number) => Promise<boolean>;
  setActiveProfile: (id: number) => Promise<ChildProfile | null>;
}

const ChildProfilesContext = createContext<ChildProfilesContextType | null>(null);

export function ChildProfilesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<ChildProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Función para activar un perfil
  const activateProfile = async (id: number): Promise<ChildProfile | null> => {
    if (!isAuthenticated) return null;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", `/api/child-profiles/${id}/activate`);
      
      if (!response.ok) {
        throw new Error("Failed to set active profile");
      }
      
      const updatedProfile = await response.json();
      
      // Actualizar el perfil activo en el estado
      setActiveProfileState(updatedProfile);
      
      // Actualizar la lista de perfiles para reflejar el cambio en isActive
      setProfiles(prev => prev.map(profile => 
        profile.id === id 
          ? { ...profile, isActive: true } 
          : { ...profile, isActive: false }
      ));
      
      return updatedProfile;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to set active profile"));
      toast({
        title: "Error al cambiar perfil",
        description: "No se pudo establecer el perfil activo",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    console.log("🔍 [PROFILES] Iniciando fetchProfiles...");
    console.log("🔍 [PROFILES] isAuthenticated:", isAuthenticated);
    
    if (!isAuthenticated) {
      console.log("❌ [PROFILES] Usuario no autenticado, abortando fetchProfiles");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("📡 [PROFILES] Consultando /api/child-profiles...");
      const response = await apiRequest("GET", "/api/child-profiles");
      
      console.log("📦 [PROFILES] Respuesta recibida:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });
      
      // DIAGNÓSTICO: Verificar si la respuesta es exitosa
      if (!response.ok) {
        console.error("❌ [PROFILES] Error del servidor:", response.status, response.statusText);
        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("✅ [PROFILES] Perfiles obtenidos:", data);
      
      setProfiles(data);
      
      // Buscar el perfil activo
      console.log("📡 [PROFILES] Consultando perfil activo...");
      const activeProfileResponse = await apiRequest("GET", "/api/child-profiles/active");
      
      console.log("📦 [PROFILES] Respuesta perfil activo:", {
        ok: activeProfileResponse.ok,
        status: activeProfileResponse.status
      });
      
      if (activeProfileResponse.ok) {
        const activeProfileData = await activeProfileResponse.json();
        console.log("✅ [PROFILES] Perfil activo obtenido:", activeProfileData);
        
        if (activeProfileData) {
          setActiveProfileState(activeProfileData);
        } else if (data.length > 0) {
          console.log("🔄 [PROFILES] No hay perfil activo, activando el primero...");
          await activateProfile(data[0].id);
        } else {
          console.log("⚠️ [PROFILES] No hay perfiles disponibles");
          setActiveProfileState(null);
        }
      } else {
        console.warn("⚠️ [PROFILES] No se pudo obtener perfil activo, usando el primero disponible");
        if (data.length > 0) {
          await activateProfile(data[0].id);
        }
      }
      
      console.log("✅ [PROFILES] fetchProfiles completado exitosamente");
    } catch (err) {
      console.error("💥 [PROFILES] Error crítico en fetchProfiles:", err);
      console.error("💥 [PROFILES] Stack trace:", err instanceof Error ? err.stack : 'No stack trace');
      
      setError(err instanceof Error ? err : new Error("Failed to fetch profiles"));
      
      // SOLUCIÓN: Solo mostrar toast de error si es un error real del servidor, no de sesión
      const isServerError = err instanceof Error && !err.message.includes("401") && !err.message.includes("Unauthorized");
      
      if (isServerError) {
        console.log("⚠️ [PROFILES] Mostrando toast de error por error real del servidor");
        toast({
          title: "Error al cargar perfiles",
          description: "No se pudieron cargar los perfiles de niños",
          variant: "destructive",
        });
      } else {
        console.log("ℹ️ [PROFILES] Error de sesión detectado, no mostrando toast (los datos se cargarán después)");
      }
    } finally {
      setIsLoading(false);
      console.log("🏁 [PROFILES] fetchProfiles terminado (finally)");
    }
  };

  const createProfile = async (name: string, age?: number, avatar?: string): Promise<ChildProfile | null> => {
    if (!isAuthenticated) return null;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/child-profiles", {
        name,
        age: age || null,
        avatar: avatar || null
      });
      
      if (!response.ok) {
        throw new Error("Failed to create profile");
      }
      
      const newProfile = await response.json();
      
      // Actualizar la lista de perfiles y establecer el nuevo como activo
      setProfiles(prev => [...prev, newProfile]);
      await activateProfile(newProfile.id);
      
      toast({
        title: "Perfil creado",
        description: `Se ha creado el perfil de ${name} correctamente`,
      });
      
      return newProfile;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create profile"));
      toast({
        title: "Error al crear perfil",
        description: "No se pudo crear el perfil",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (id: number, data: Partial<ChildProfile>): Promise<ChildProfile | null> => {
    if (!isAuthenticated) return null;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest("PUT", `/api/child-profiles/${id}`, data);
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      const updatedProfile = await response.json();
      
      // Actualizar la lista de perfiles
      setProfiles(prev => prev.map(profile => 
        profile.id === id ? updatedProfile : profile
      ));
      
      // Actualizar el perfil activo si es necesario
      if (activeProfile?.id === id) {
        setActiveProfileState(updatedProfile);
      }
      
      toast({
        title: "Perfil actualizado",
        description: `Se ha actualizado el perfil de ${updatedProfile.name} correctamente`,
      });
      
      return updatedProfile;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update profile"));
      toast({
        title: "Error al actualizar perfil",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProfile = async (id: number): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    setIsLoading(true);
    
    try {
      const profileToDelete = profiles.find(p => p.id === id);
      
      if (!profileToDelete) {
        throw new Error("Profile not found");
      }
      
      const response = await apiRequest("DELETE", `/api/child-profiles/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to delete profile");
      }
      
      // Actualizar la lista de perfiles
      const updatedProfiles = profiles.filter(profile => profile.id !== id);
      setProfiles(updatedProfiles);
      
      // Si se elimina el perfil activo, seleccionar otro
      if (activeProfile?.id === id) {
        if (updatedProfiles.length > 0) {
          await activateProfile(updatedProfiles[0].id);
        } else {
          setActiveProfileState(null);
        }
      }
      
      toast({
        title: "Perfil eliminado",
        description: `Se ha eliminado el perfil de ${profileToDelete.name}`,
      });
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete profile"));
      toast({
        title: "Error al eliminar perfil",
        description: "No se pudo eliminar el perfil",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar perfiles cuando el usuario inicia sesión
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfiles();
    } else {
      // Limpiar los perfiles cuando el usuario cierra sesión
      setProfiles([]);
      setActiveProfileState(null);
    }
  }, [isAuthenticated, user]);
  
  // Escuchar eventos de cierre de sesión desde AuthContext
  useEffect(() => {
    const handleUserLogout = () => {
      console.log("🔄 Evento de cierre de sesión recibido en ChildProfilesContext");
      
      // Limpiar los perfiles cuando el usuario cierra sesión
      setProfiles([]);
      setActiveProfileState(null);
    };
    
    window.addEventListener("user-logout", handleUserLogout);
    
    // Limpieza al desmontar
    return () => {
      window.removeEventListener("user-logout", handleUserLogout);
    };
  }, []);

  return (
    <ChildProfilesContext.Provider
      value={{
        profiles,
        activeProfile,
        isLoading,
        error,
        fetchProfiles,
        createProfile,
        updateProfile,
        deleteProfile,
        setActiveProfile: activateProfile,
      }}
    >
      {children}
    </ChildProfilesContext.Provider>
  );
}

export function useChildProfiles() {
  const context = useContext(ChildProfilesContext);
  if (!context) {
    throw new Error("useChildProfiles must be used within a ChildProfilesProvider");
  }
  return context;
}