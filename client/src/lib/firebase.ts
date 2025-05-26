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
  // Usar el dominio actual para autenticación si estamos en Replit
  authDomain: window.location.hostname.includes('replit.dev') 
    ? window.location.hostname 
    : `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo"}.firebaseapp.com`,
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
    
    // Establecer directamente el authProvider con configuraciones simplificadas
    // para mayor compatibilidad con diversos navegadores
    const authProvider = new GoogleAuthProvider();
    authProvider.addScope('email');
    authProvider.addScope('profile');
    
    // Usar preferentemente popup para mejor experiencia de usuario
    console.log("Iniciando autenticación con popup de Google...");
    return await signInWithPopup(auth, authProvider);
    
  } catch (error: any) {
    console.error("Error al iniciar sesión con Google:", error);
    
    // Manejar errores específicos de manera adecuada
    if (error.code === 'auth/popup-blocked') {
      console.warn("Popup bloqueado por el navegador, intentando redirección...");
      
      // Reintento con redirección
      try {
        await signInWithRedirect(auth, googleProvider);
        return null; // La redirección recargará la página, así que este return nunca se ejecuta realmente
      } catch (redirectError) {
        console.error("Error en redirección:", redirectError);
        throw redirectError;
      }
    } 
    else if (error.code === 'auth/popup-closed-by-user' || 
             error.code === 'auth/cancelled-popup-request') {
      // Estos no son errores reales, solo el usuario cerró la ventana o canceló el proceso
      console.log("Autenticación cancelada por el usuario");
      return null;
    }
    else if (error.code === 'auth/unauthorized-domain') {
      console.error("DOMINIO NO AUTORIZADO EN FIREBASE. Accede a la consola de Firebase y añade este dominio a la lista de dominios autorizados:");
      console.error("Dominio actual:", window.location.hostname);
      console.error("URL para configurar:", `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`);
      
      throw new Error("Este sitio web no está autorizado para autenticación con Google. Contacta al administrador.");
    }
    
    // Para cualquier otro tipo de error, mostrarlo y lanzarlo
    console.error("Detalles del error:", {
      code: error.code,
      message: error.message,
      email: error.email,
      credential: error.credential
    });
    
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
    
    if (result && result.user) {
      // Éxito en la autenticación por redirección
      console.log("Autenticación por redirección exitosa:", {
        providerId: result.providerId,
        userId: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      });
      
      return result;
    } else {
      // No hay resultado de redirección, puede ser:
      // 1. Primera carga de la página
      // 2. La redirección no se ha completado aún
      // 3. El usuario nunca usó la redirección para autenticarse
      console.log("No hay resultado de redirección disponible");
      
      // Podemos verificar el estado actual de autenticación
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log("Ya hay un usuario autenticado:", currentUser.email);
      }
      
      return null;
    }
  } catch (error: any) {
    console.error("Error al obtener resultado de redirección:", error);
    
    // Manejar errores específicos con mensajes claros
    if (error.code === 'auth/unauthorized-domain') {
      console.error("========= ERROR DE DOMINIO =========");
      console.error("El dominio actual no está autorizado en Firebase.");
      console.error("Dominio actual:", window.location.hostname);
      console.error("Dominio configurado:", firebaseConfig.authDomain);
      console.error("Debes añadir tu dominio a la lista de dominios autorizados en la consola de Firebase:");
      console.error(`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`);
      console.error("====================================");
    } 
    else if (error.code === 'auth/operation-not-allowed') {
      console.error("El método de inicio de sesión no está habilitado en Firebase.");
      console.error("Debes habilitar el proveedor de Google en la sección 'Sign-in method' en la consola de Firebase.");
    }
    else if (error.code === 'auth/web-storage-unsupported') {
      console.error("Tu navegador no soporta almacenamiento web o está bloqueado.");
      console.error("Intenta habilitar las cookies y el almacenamiento local en tu navegador.");
    }
    
    // Registrar todos los detalles del error
    console.error("Detalles completos del error:", {
      code: error.code,
      message: error.message,
      name: error.name
    });
    
    // Errores específicos que podemos considerar no críticos
    if (error.code === 'auth/popup-closed-by-user' || 
        error.code === 'auth/cancelled-popup-request') {
      console.log("El usuario cerró la ventana de autenticación - no es un error crítico");
      return null;
    }
    
    // Para otros errores, lanzar para que sea manejado por el componente
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