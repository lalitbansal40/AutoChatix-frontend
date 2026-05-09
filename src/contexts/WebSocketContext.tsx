import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import useAuth from 'hooks/useAuth';

interface WsMessage {
  type: string;
  message?: any;
  contact_id?: string;
  channel_id?: string;
  accountId?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (handler: (msg: WsMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  subscribe: () => () => {},
});

export const useWebSocketChat = () => useContext(WebSocketContext);

// Send a ping every 2 minutes so API Gateway doesn't close the idle connection (10-min timeout)
const PING_INTERVAL_MS = 2 * 60 * 1000;

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { isLoggedIn, user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Set<(msg: WsMessage) => void>>(new Set());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const pingTimer = useRef<ReturnType<typeof setInterval>>();

  const stopPing = () => {
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = undefined;
    }
  };

  const startPing = (ws: WebSocket) => {
    stopPing();
    pingTimer.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, PING_INTERVAL_MS);
  };

  const connect = useCallback((accountId: string) => {
    const wsUrl = process.env.REACT_APP_WS_URL;
    if (!accountId || !wsUrl) {
      console.warn('[WS] Cannot connect — accountId or WS URL missing', { accountId, wsUrl });
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;

    console.log(`[WS] Connecting → ${wsUrl}?accountId=${accountId}`);
    const ws = new WebSocket(`${wsUrl}?accountId=${accountId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected ✅');
      setIsConnected(true);
      startPing(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data: WsMessage = JSON.parse(event.data);
        // Ignore server pong — it's just a keepalive ack
        if ((data as any).type === 'pong') return;
        handlersRef.current.forEach((handler) => handler(data));
      } catch {}
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected, reconnecting in 3s...');
      stopPing();
      setIsConnected(false);
      reconnectTimer.current = setTimeout(() => {
        if (accountId) connect(accountId);
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      ws.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const accountId = (user as any)?.account_id || user?._id || user?.id;
    if (isLoggedIn && accountId) {
      connect(accountId);
    } else {
      clearTimeout(reconnectTimer.current);
      stopPing();
      wsRef.current?.close();
      wsRef.current = null;
      setIsConnected(false);
    }
    return () => {
      clearTimeout(reconnectTimer.current);
    };
  }, [isLoggedIn, user, connect]);

  const subscribe = useCallback((handler: (msg: WsMessage) => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};
