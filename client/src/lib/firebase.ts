import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from "firebase/auth";

// Configuración de Firebase
// Obtener directamente del código para depuración
console.log("Firebase Config Environment Variables:");
console.log("VITE_FIREBASE_API_KEY:", import.meta.env.VITE_FIREBASE_API_KEY || "No disponible");
console.log("VITE_FIREBASE_PROJECT_ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID || "No disponible");
console.log("VITE_FIREBASE_APP_ID:", import.meta.env.VITE_FIREBASE_APP_ID || "No disponible");

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  // Usar específicamente el dominio registrado en Firebase
  authDomain: "78d216dd-74cf-4f61-abfa-7cb32982bbb6-00-zpf65darfkfs.riker.replit.dev",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo"}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Inicializar Firebase una sola vez
let firebaseApp: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let googleProvider: GoogleAuthProvider;

// Función para inicializar Firebase solo una vez
const initFirebase = () => {
  try {
    // Verificar que la API key y otros valores necesarios estén presentes
    if (!import.meta.env.VITE_FIREBASE_API_KEY || 
        !import.meta.env.VITE_FIREBASE_PROJECT_ID || 
        !import.meta.env.VITE_FIREBASE_APP_ID) {
      console.error("Faltan variables de entorno para Firebase");
      return false;
    }

    // Mostrar la configuración completa para depuración
    console.log("Configuración de Firebase:", {
      ...firebaseConfig,
      currentDomain: window.location.hostname,
      origin: window.location.origin
    });

    // Inicializar Firebase de manera segura para evitar duplicación
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (initError: any) {
      // Si el error es por duplicación, obtenemos la instancia existente
      if (initError.code === 'app/duplicate-app') {
        console.log("Usando instancia de Firebase existente");
      } else {
        console.error("Error al inicializar Firebase:", initError);
        return false;
      }
    }

    // Obtener auth y configurar el proveedor de Google
    auth = getAuth();
    googleProvider = new GoogleAuthProvider();
    
    // Agregar los ámbitos (scopes) que necesitamos explícitamente
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    // Configuraciones adicionales del proveedor de Google
    googleProvider.setCustomParameters({
      prompt: 'select_account'
      // No es necesario especificar redirect_uri, Firebase lo maneja automáticamente
      // basado en la URI actual
    });

    return true;
  } catch (error) {
    console.error("Error durante la configuración de Firebase:", error);
    return false;
  }
};

// Inicializar Firebase al cargar el módulo
const firebaseInitialized = initFirebase();

// Funciones de autenticación
export const signInWithGoogle = async () => {
  try {
    if (!firebaseInitialized || !auth || !googleProvider) {
      console.error("Firebase no está inicializado correctamente");
      throw new Error("Servicio de autenticación no disponible");
    }
    
    console.log("Iniciando autenticación con Google...");
    console.log("URL actual:", window.location.href);
    console.log("Dominio registrado en Firebase:", firebaseConfig.authDomain);
    
    try {
      // Intentar primero con popup (funciona mejor en muchos casos)
      console.log("Intentando autenticación con popup...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Autenticación con popup exitosa:", result.user.displayName);
      return result;
    } catch (popupError: any) {
      console.warn("Error con popup, intentando redirección:", popupError.code);
      
      // Si el popup falla, intentar con redirección
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request') {
        console.log("Cambiando a autenticación por redirección...");
        return signInWithRedirect(auth, googleProvider);
      }
      
      // Si es otro tipo de error, lanzarlo
      throw popupError;
    }
    
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    
    // Mostrar específicamente el error para facilitar la depuración
    if (error instanceof Error) {
      console.error("Mensaje de error:", error.message);
      console.error("Error completo:", JSON.stringify(error, null, 2));
    }
    
    throw error;
  }
};

// Función para obtener el resultado del redirect después de la autenticación con Google
export const getGoogleRedirectResult = async () => {
  try {
    if (!firebaseInitialized || !auth) {
      console.error("Firebase no está inicializado correctamente para obtener resultado de redirección");
      throw new Error("Servicio de autenticación no disponible");
    }
    
    console.log("Obteniendo resultado de redirección de Google Auth...");
    
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log("Redirección exitosa:", {
        providerId: result.providerId,
        userId: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        metadata: result.user.metadata
      });
      
      return result;
    } else {
      console.log("No hay resultado de redirección disponible");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener resultado de redirección:", error);
    
    // Registrar detalles específicos del error para depuración
    if (error instanceof Error) {
      console.error("Tipo de error:", error.name);
      console.error("Mensaje:", error.message);
      
      // Si es un error de Firebase, tendrá propiedades adicionales
      if ('code' in error) {
        console.error("Código de error Firebase:", (error as any).code);
        
        // Errores comunes de Firebase Auth y sus posibles soluciones
        switch ((error as any).code) {
          case 'auth/unauthorized-domain':
            console.error("Dominio no autorizado en Firebase. Verifica las configuraciones de dominio en la consola de Firebase.");
            break;
          case 'auth/operation-not-allowed':
            console.error("Operación no permitida. Verifica que el método de inicio de sesión esté habilitado en Firebase.");
            break;
          case 'auth/cancelled-popup-request':
          case 'auth/popup-closed-by-user':
            console.error("El usuario cerró la ventana de autenticación antes de completar el proceso.");
            // No es realmente un error, solo el usuario canceló
            return null;
          default:
            console.error("Error de Firebase no reconocido");
        }
      }
    }
    
    throw error;
  }
};

// Función para cerrar sesión
export const firebaseSignOut = async () => {
  try {
    if (!auth) {
      throw new Error("Firebase no está inicializado correctamente");
    }
    
    await signOut(auth);
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    throw error;
  }
};

// Función para observar cambios en el estado de autenticación
export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  if (!auth) {
    console.error("Firebase no está inicializado correctamente");
    return () => {};
  }
  
  return onAuthStateChanged(auth, callback);
};

export { auth, googleProvider };