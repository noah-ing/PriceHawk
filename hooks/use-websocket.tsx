 "use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

// Event types for type safety
export interface PriceUpdateEvent {
  productId: string;
  currentPrice: number;
  previousPrice: number;
  timestamp: string;
  priceDropPercent: number;
}

export interface AlertTriggeredEvent {
  alertId: string;
  productId: string;
  targetPrice: number;
  currentPrice: number;
  timestamp: string;
}

export interface ProductAddedEvent {
  product: any;
  timestamp: string;
}

export interface DashboardStatsUpdateEvent {
  trackedProducts: number;
  activeAlerts: number;
  priceDrops: number;
  savedAmount: number;
  timestamp: string;
}

export interface MarkupUpdatedEvent {
  productId: string;
  markupPercentage: number;
}

export type WebSocketEventMap = {
  'price-update': (data: PriceUpdateEvent) => void;
  'alert-triggered': (data: AlertTriggeredEvent) => void;
  'product-added': (data: ProductAddedEvent) => void;
  'dashboard-stats-update': (data: DashboardStatsUpdateEvent) => void;
  'markup:updated': (data: MarkupUpdatedEvent) => void;
  'product:data': (data: any) => void;
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (err: Error) => void;
}

/**
 * Custom hook for WebSocket connections
 */
export function useWebSocket() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!socketRef.current) {
      const socket = io(process.env.NEXT_PUBLIC_APP_URL || window.location.origin, {
        path: '/ws',
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 10,
      });
      
      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        
        // Authenticate if user is logged in
        if (userId) {
          socket.emit('authenticate', { userId });
        }
      });
      
      socket.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err);
        setError(err);
        setIsConnected(false);
      });
      
      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });
      
      socketRef.current = socket;
    }
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);
  
  // Subscribe to a product's updates
  const joinProductRoom = useCallback((productId: string) => {
    if (socketRef.current && isConnected && productId) {
      socketRef.current.emit('subscribe', { 
        entity: 'product', 
        entityId: productId 
      });
    }
  }, [isConnected]);
  
  // Unsubscribe from a product's updates
  const leaveRoom = useCallback((productId: string) => {
    if (socketRef.current && isConnected && productId) {
      socketRef.current.emit('unsubscribe', { 
        entity: 'product', 
        entityId: productId 
      });
    }
  }, [isConnected]);
  
  // Subscribe to events
  const on = useCallback(<T extends keyof WebSocketEventMap>(
    event: T,
    callback: WebSocketEventMap[T]
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback as any);
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback as any);
      }
    };
  }, []);
  
  // Function to emit events
  const emit = useCallback((event: string, ...args: any[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, ...args);
      return true;
    }
    return false;
  }, [isConnected]);
  
  return {
    isConnected,
    error,
    joinProductRoom,
    leaveRoom,
    on,
    emit,
    socket: socketRef.current
  };
}
