import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Send, Wifi, WifiOff } from "lucide-react";
import { useWebSocket, WebSocketMessage } from '@/hooks/use-websocket';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';

export default function WebSocketStatus() {
  const { 
    status, 
    messages, 
    connect, 
    disconnect, 
    sendMessage, 
    clearMessages 
  } = useWebSocket();
  
  const [messageInput, setMessageInput] = useState('');
  const { t } = useTranslations();
  
  // Estado para controlar la visibilidad del componente
  const [isExpanded, setIsExpanded] = useState(false);

  // Enviar un mensaje de ping al servidor
  const handleSendPing = () => {
    sendMessage({
      type: 'ping',
      timestamp: new Date().toISOString()
    });
  };

  // Enviar un mensaje personalizado
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    sendMessage({
      type: 'message',
      content: messageInput,
      timestamp: new Date().toISOString()
    });
    
    setMessageInput('');
  };

  // Renderizar los mensajes WebSocket
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 italic">
          {t('No messages yet')}
        </div>
      );
    }

    return messages.map((msg: WebSocketMessage, index: number) => (
      <div key={index} className="p-2 border-b border-gray-100 last:border-0">
        <div className="flex justify-between items-start">
          <Badge variant={msg.type === 'error' ? 'destructive' : 'outline'}>
            {msg.type}
          </Badge>
          <span className="text-xs text-gray-500">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="mt-1 text-sm">
          {msg.message || msg.content || JSON.stringify(msg.data || {})}
        </div>
      </div>
    ));
  };

  // Renderizar los colores del indicador según el estado de la conexión
  const getStatusColor = () => {
    switch (status) {
      case 'open':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
      case 'closed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isExpanded ? (
        <Card className="w-80 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                {status === 'open' ? <Wifi size={18} /> : <WifiOff size={18} />}
                {t('WebSocket')}
              </CardTitle>
              <Badge variant="outline" className="font-normal">
                <div className={`w-2 h-2 rounded-full mr-1.5 ${getStatusColor()}`}></div>
                {status}
              </Badge>
            </div>
            <CardDescription>
              {t('Real-time communication channel')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={status === 'open' ? 'outline' : 'default'} 
                onClick={status === 'open' ? disconnect : connect}
              >
                {status === 'open' ? t('Disconnect') : t('Connect')}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleSendPing}
                disabled={status !== 'open'}
              >
                {t('Ping')}
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearMessages}
              >
                <RefreshCw size={16} />
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsExpanded(false)}
              >
                {t('Minimize')}
              </Button>
            </div>
            
            <div>
              <h3 className="font-medium mb-1 text-sm">
                {t('Messages')}
              </h3>
              <ScrollArea className="h-40 rounded border">
                {renderMessages()}
              </ScrollArea>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={t('Enter message...')}
                disabled={status !== 'open'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                size="icon"
                disabled={status !== 'open' || !messageInput.trim()}
                onClick={handleSendMessage}
              >
                <Send size={16} />
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="pt-0 text-xs text-gray-500">
            {messages.length} {t('messages received')}
          </CardFooter>
        </Card>
      ) : (
        <Button
          variant="outline" 
          size="sm"
          className="rounded-full h-12 w-12 shadow-md flex items-center justify-center p-0"
          onClick={() => setIsExpanded(true)}
        >
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        </Button>
      )}
    </div>
  );
}