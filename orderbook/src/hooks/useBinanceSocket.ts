'use client';

import { useEffect, useRef, useCallback } from 'react';

// ----------------------------
// ✅ Type definitions
// ----------------------------
type AggTradeEvent = {
  e: 'aggTrade';
  E: number;
  s: string;
  a: string;
  p: string;
  q: string;
  f: number;
  l: number;
  T: number;
  m: boolean;
};

type DepthUpdateEvent = {
  e: 'depthUpdate';
  E: number;
  s: string;
  U: number;
  u: number;
  b: [string, string][]; // bids
  a: [string, string][]; // asks
};

type Message = AggTradeEvent | DepthUpdateEvent | any;

export type UseBinanceSocketOptions = {
  symbol?: string;
  onAggTrade?: (t: AggTradeEvent) => void;
  onDepthUpdate?: (d: DepthUpdateEvent) => void;
  combined?: boolean;
  depthInterval?: 100 | 250 | 500;
};

// ----------------------------
// ✅ Hook implementation
// ----------------------------
export function useBinanceSocket({
  symbol = 'btcusdt',
  onAggTrade,
  onDepthUpdate,
  combined = true,
  depthInterval = 100,
}: UseBinanceSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(500);
  const closedByUser = useRef(false);

  // Create connection URL
  const createUrl = useCallback(() => {
    const base = 'wss://stream.binance.com:9443';
    const s = symbol.toLowerCase();

    if (combined) {
      const streams = [`${s}@aggTrade`, `${s}@depth@${depthInterval}ms`].join('/');
      return `${base}/stream?streams=${streams}`;
    }
    return `${base}/ws/${s}@aggTrade`;
  }, [symbol, combined, depthInterval]);

  // ----------------------------
  // ✅ Connection logic
  // ----------------------------
  useEffect(() => {
    closedByUser.current = false;
    let mounted = true;

    const connect = () => {
      if (!mounted) return;

      const url = createUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = 500;
        console.info('[Binance WS] ✅ Connected:', url);
      };

      ws.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data) as Message | { stream: string; data: any };
          const payload = 'stream' in parsed ? parsed.data : parsed;

          if (!payload?.e) return;

          switch (payload.e) {
            case 'aggTrade':
              onAggTrade?.(payload as AggTradeEvent);
              break;
            case 'depthUpdate':
              onDepthUpdate?.(payload as DepthUpdateEvent);
              break;
          }
        } catch (err) {
          console.error('[Binance WS] ❌ Malformed message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[Binance WS] ⚠️ Error:', err);
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (closedByUser.current || !mounted) return;

        const t = backoffRef.current;
        console.warn(`[Binance WS] 🔁 Reconnecting in ${t} ms...`);
        backoffRef.current = Math.min(backoffRef.current * 1.8, 30000);
        setTimeout(connect, t);
      };
    };

    connect();

    return () => {
      mounted = false;
      closedByUser.current = true;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [createUrl, onAggTrade, onDepthUpdate]);

  // ----------------------------
  // ✅ Expose close() for manual shutdown
  // ----------------------------
  return {
    close: () => {
      closedByUser.current = true;
      if (wsRef.current) wsRef.current.close();
    },
  };
}
