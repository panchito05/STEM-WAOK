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
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo"}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Inicializar Firebase
let firebaseApp: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let googleProvider: GoogleAuthProvider | undefined;

try {
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  googleProvider = new GoogleAuthProvider();
  
  // Configuraciones adicionales del proveedor de Google
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
} catch (error) {
  console.error("Error al inicializar Firebase:", error);
}

// Funciones de autenticación
export const signInWithGoogle = async () => {
  try {
    if (!auth || !googleProvider) {
      throw new Error("Firebase no está inicializado correctamente");
    }
    
    // En mobile o tablets usamos redirect, en desktop podemos usar popup
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      return signInWithRedirect(auth, googleProvider);
    } else {
      return await signInWithPopup(auth, googleProvider);
    }
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    throw error;
  }
};

// Función para obtener el resultado del redirect (para móviles)
export const getGoogleRedirectResult = async () => {
  try {
    if (!auth) {
      throw new Error("Firebase no está inicializado correctamente");
    }
    
    return await getRedirectResult(auth);
  } catch (error) {
    console.error("Error al obtener resultado de redirección:", error);
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