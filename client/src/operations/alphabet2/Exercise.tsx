import { useState, useEffect } from 'react';
import { ModuleSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ExerciseProps {
  settings: ModuleSettings;
  onOpenSettings: () => void;
}

// Este componente es un puente que carga la aplicación Svelte
export default function Exercise({ settings, onOpenSettings }: ExerciseProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // URL de la aplicación Svelte
  const alphabetAppUrl = '/alphabet2/client/public/index.html';
  
  useEffect(() => {
    // Verificar si el servidor Flask está disponible
    const checkServer = async () => {
      try {
        const response = await fetch('/alphabet2/health-check', { 
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('El servidor no está respondiendo correctamente');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error verificando el servidor:', err);
        setError('No se pudo conectar con el servidor de Alphabet Journey. Por favor, intenta más tarde.');
        setIsLoading(false);
      }
    };
    
    // Iniciar la verificación
    checkServer();
    
    // Cleanup function
    return () => {
      // Cleanup code here if needed
    };
  }, []);
  
  // Función para abrir la aplicación Svelte en una nueva pestaña
  const openInNewTab = () => {
    window.open(alphabetAppUrl, '_blank');
  };
  
  // Función para cargar la aplicación en un iframe
  const renderIframe = () => {
    // Construir URL con parámetros del usuario si están disponibles
    let iframeUrl = alphabetAppUrl;
    if (user) {
      iframeUrl += `?userId=${encodeURIComponent(user.id)}&username=${encodeURIComponent(user.username)}`;
    }
    
    return (
      <iframe 
        src={iframeUrl}
        title="Alphabet Journey"
        className="w-full h-[calc(100vh-150px)] border-none rounded-lg"
        allow="microphone; camera"
      />
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-gray-600">Cargando Alphabet Journey...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <h3 className="text-lg font-bold text-red-800 mb-2">Error de conexión</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex flex-col space-y-2">
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Reintentar
            </Button>
            <Button onClick={onOpenSettings} variant="outline" className="w-full">
              Configuración
            </Button>
            <Button onClick={() => window.history.back()} variant="destructive" className="w-full">
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4 px-4">
        <h2 className="text-2xl font-bold">Alphabet Journey</h2>
        <div className="flex space-x-2">
          <Button onClick={onOpenSettings} variant="outline" size="sm">
            Configuración
          </Button>
          <Button onClick={openInNewTab} variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir en nueva pestaña
          </Button>
        </div>
      </div>
      
      {renderIframe()}
    </div>
  );
}