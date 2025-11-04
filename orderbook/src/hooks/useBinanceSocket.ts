'use client';
import { useEffect, useRef, useCallback } from 'react';

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
  b: [string, string][];
  a: [string, string][];
};

type Message = AggTradeEvent | DepthUpdateEvent | any;

export type UseBinanceSocketOptions = {
  symbol?: string;
  onAggTrade?: (t: AggTradeEvent) => void;
  onDepthUpdate?: (d: DepthUpdateEvent) => void;
  combined?: boolean;
  depthInterval?: 100 | 250 | 500;
};

export function useBinanceSocket(opts: UseBinanceSocketOptions) {
  const {
    symbol = 'btcusdt',
    onAggTrade,
    onDepthUpdate,
    combined = true,
    depthInterval = 100,
  } = opts;

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(500);
  const closedByUser = useRef(false);

  const createUrl = useCallback(() => {
    const base = 'wss://stream.binance.com:9443';
    const s = symbol.toLowerCase();
    if (combined) {
      const streams = [`${s}@aggTrade`, `${s}@depth@${depthInterval}ms`].join('/');
      return `${base}/stream?streams=${streams}`;
    } else {
      return `${base}/ws/${s}@aggTrade`;
    }
  }, [symbol, combined, depthInterval]);

  useEffect(() => {
    closedByUser.current = false;
    let mounted = true;

    function connect() {
      if (!mounted) return;
      const url = createUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = 500;
        console.info('[Binance WS] connected', url);
      };

      ws.onmessage = (ev) => {
        const raw = ev.data;
        try {
          const parsed = JSON.parse(raw) as Message | { stream: string; data: any };
          const payload = 'stream' in parsed ? parsed.data : parsed;
          if (!payload || !payload.e) return;

          if (payload.e === 'aggTrade' && onAggTrade) {
            onAggTrade(payload as AggTradeEvent);
          } else if (payload.e === 'depthUpdate' && onDepthUpdate) {
            onDepthUpdate(payload as DepthUpdateEvent);
          }
        } catch (err) {
          console.error('Malformed WS message', err);
        }
      };

      ws.onerror = (e) => {
        console.error('Binance WS error:', e);
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (closedByUser.current || !mounted) return;
        const t = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 1.8, 30000);
        setTimeout(connect, t);
      };
    }

    connect();
    return () => {
      mounted = false;
      closedByUser.current = true;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
      wsRef.current = null;
    };
  }, [createUrl, onAggTrade, onDepthUpdate]);

  return {
    close: () => {
      closedByUser.current = true;
      if (wsRef.current) wsRef.current.close();
    },
  };
}
