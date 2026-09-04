import { useEffect, useRef } from 'react';
import { wsManager } from '@/services/websocket';

type EventHandler = (data: unknown) => void;

export function useWebSocket() {
  const connectedRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || connectedRef.current) return;

    wsManager.connect();
    connectedRef.current = true;

    return () => {
      wsManager.disconnect();
      connectedRef.current = false;
    };
  }, []);
}

export function useWSEvent(event: string, handler: EventHandler) {
  useEffect(() => {
    wsManager.on(event, handler);
    return () => {
      wsManager.off(event, handler);
    };
  }, [event, handler]);
}
