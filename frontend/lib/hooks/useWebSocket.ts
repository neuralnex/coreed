"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: number;
}

interface WebSocketStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  reconnectAttempts: number;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;

/**
 * Custom hook for managing WebSocket connections with automatic reconnection
 */
export function useWebSocket(url: string): WebSocketStatus & {
  send: (message: WebSocketMessage) => void;
  onMessage: (callback: (message: WebSocketMessage) => void) => void;
  close: () => void;
} {
  const [status, setStatus] = useState<WebSocketStatus>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const messageCallbackRef = useRef<(message: WebSocketMessage) => void>(() => {});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const connect = useCallback(() => {
    if (status.isConnected || status.isConnecting) return;

    setStatus(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setStatus({
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          messageCallbackRef.current(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        setStatus(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY_MS);
        } else {
          setStatus(prev => ({
            ...prev,
            error: new Error(`WebSocket connection failed after ${MAX_RECONNECT_ATTEMPTS} attempts`)
          }));
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: new Error("WebSocket connection error")
        }));
      };
    } catch (error) {
      setStatus({
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error : new Error("Failed to create WebSocket"),
        reconnectAttempts: reconnectAttemptsRef.current
      });
    }
  }, [url, status.isConnected, status.isConnecting]);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }, []);

  const onMessage = useCallback((callback: (message: WebSocketMessage) => void) => {
    messageCallbackRef.current = callback;
  }, []);

  const close = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  return {
    ...status,
    send,
    onMessage,
    close
  };
}

/**
 * Hook specifically for health monitoring WebSocket
 * Connects to 0G Chain's health monitoring endpoint
 */
export function useHealthWebSocket(spaceId: string) {
  const wsUrl = process.env.NEXT_PUBLIC_HEALTH_WS_URL || 
    `wss://router-api.0g.ai/v1/health?spaceId=${spaceId}`;

  return useWebSocket(wsUrl);
}

/**
 * Simplified mock WebSocket for development
 * In production, this would connect to actual 0G Chain WebSocket endpoints
 */
export function useMockHealthWebSocket(spaceId: string) {
  const [healthStatus, setHealthStatus] = useState({
    isActive: true,
    lastChecked: Date.now(),
    latency: 0,
    isAsleep: false
  });

  const [requestCount, setRequestCount] = useState(0);

  // Simulate periodic health updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random health status changes
      setHealthStatus(prev => ({
        ...prev,
        isActive: Math.random() > 0.1, // 90% chance of being active
        lastChecked: Date.now(),
        latency: Math.random() * 500 // Random latency between 0-500ms
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Simulate request counting
  const recordRequest = useCallback(() => {
    setRequestCount(prev => prev + 1);
  }, []);

  return {
    healthStatus,
    requestCount,
    recordRequest,
    isConnected: true
  };
}
