import React, { createContext, useState, useContext, useEffect } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

// Crear el contexto con valores por defecto
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

// Hook personalizado para facilitar el uso del contexto
export const useTheme = () => useContext(ThemeContext);

// Proveedor del contexto de tema
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  // Efectos para sincronizar las clases CSS con el tema actual
  useEffect(() => {
    // Función para aplicar el tema en toda la aplicación
    const applyTheme = (newTheme: Theme) => {
      const root = document.documentElement;
      
      // Actualizar clases para Tailwind
      if (newTheme === 'dark') {
        root.classList.add('dark');
        root.classList.add('canvas-dark-mode');
      } else {
        root.classList.remove('dark');
        root.classList.remove('canvas-dark-mode');
      }
    };

    // Aplicar el tema actual
    applyTheme(theme);

    // Opcional: Almacenar preferencia en localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Efecto para cargar la preferencia de tema guardada al iniciar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Opcional: detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Función para alternar entre temas
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    
    // Emitir un evento personalizado para componentes que no usan React
    const event = new CustomEvent('themeChanged', { 
      detail: { theme: theme === 'light' ? 'dark' : 'light' } 
    });
    document.dispatchEvent(event);
    
    console.log("Modo oscuro cambiado:", theme === 'light' ? "ACTIVADO" : "DESACTIVADO");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;