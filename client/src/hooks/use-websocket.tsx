import { useState, useEffect, useCallback, useRef } from 'react';

// Tipos para los mensajes WebSocket
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// Estados posibles del WebSocket
type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

interface UseWebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (data: any) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

/**
 * Hook personalizado para manejar conexiones WebSocket en la aplicación
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = options.reconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;

  // Crear una nueva conexión WebSocket
  const connect = useCallback(() => {
    // Cerrar cualquier conexión existente
    if (socketRef.current) {
      socketRef.current.close();
    }

    setStatus('connecting');
    
    // Usar el protocolo adecuado según el protocolo actual de la página
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Conectando a WebSocket:', wsUrl);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = (event) => {
      console.log('Conexión WebSocket establecida');
      setStatus('open');
      reconnectAttemptsRef.current = 0;
      
      if (options.onOpen) {
        options.onOpen(event);
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Mensaje WebSocket recibido:', data);
        
        // Añadir mensaje a la lista
        setMessages(prev => [...prev, data]);
        
        if (options.onMessage) {
          options.onMessage(data);
        }
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
      }
    };

    socket.onclose = (event) => {
      console.log('Conexión WebSocket cerrada:', event.code, event.reason);
      setStatus('closed');
      
      if (options.onClose) {
        options.onClose(event);
      }
      
      // Intentar reconectarse si la conexión se cerró inesperadamente 
      // y no hemos superado el número máximo de intentos
      if (!event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
        console.log(`Reconectando... Intento ${reconnectAttemptsRef.current + 1} de ${maxReconnectAttempts}`);
        reconnectAttemptsRef.current += 1;
        setTimeout(connect, reconnectInterval);
      }
    };

    socket.onerror = (event) => {
      console.error('Error en conexión WebSocket:', event);
      setStatus('error');
      
      if (options.onError) {
        options.onError(event);
      }
    };
  }, [options, maxReconnectAttempts, reconnectInterval]);

  // Desconectar WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setStatus('closing');
      socketRef.current.close();
    }
  }, []);

  // Enviar mensaje al servidor
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('No se pudo enviar mensaje: WebSocket no está conectado');
      return false;
    }
  }, []);

  // Limpiar mensajes
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Conectar automáticamente cuando el componente se monta
  useEffect(() => {
    connect();
    
    // Limpiar cuando el componente se desmonta
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return {
    status,
    messages,
    connect,
    disconnect,
    sendMessage,
    clearMessages
  };
}