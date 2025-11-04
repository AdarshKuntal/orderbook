'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useBinanceSocket } from '../hooks/useBinanceSocket';

type TradeRow = {
  id: string;
  price: number;
  qty: number;
  time: number;
  buy: boolean;
  flash?: boolean;
};

export default function RecentTrades({ symbol = 'btcusdt' }: { symbol?: string }) {
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const tradesRef = useRef<TradeRow[]>([]);
  tradesRef.current = trades;

  useBinanceSocket({
    symbol,
    onAggTrade: (t) => {
      const row: TradeRow = {
        id: `${t.a}_${t.T}`,
        price: Number(t.p),
        qty: Number(t.q),
        time: t.T,
        buy: !t.m,
        flash: true,
      };
      const next = [row, ...tradesRef.current].slice(0, 60);
      setTrades(next);

      // remove flash after a short time
      setTimeout(() => {
        setTrades((cur) => cur.map((r) => (r.id === row.id ? { ...r, flash: false } : r)));
      }, 400);
    },
    onDepthUpdate: undefined,
    combined: true,
  });

  return (
    <div className="w-80 bg-[#0d1117] p-4 rounded-2xl shadow-md border border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-gray-200 tracking-wide">
        Recent Trades
      </h3>
      <div className="max-h-96 overflow-y-auto space-y-[2px] pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {trades.map((t) => (
          <div
            key={t.id}
            className={`flex justify-between items-center text-xs font-mono rounded-md py-[3px] px-[6px] transition-all duration-200 ${
              t.flash ? 'scale-[1.02]' : 'scale-100'
            }`}
            style={{
              background: t.flash
                ? t.buy
                  ? 'rgba(34,197,94,0.15)'
                  : 'rgba(239,68,68,0.15)'
                : 'transparent',
              borderLeft: `2px solid ${
                t.buy ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'
              }`,
            }}
          >
            <div
              className={`font-semibold ${
                t.buy ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {t.price.toFixed(2)}
            </div>
            <div className="text-gray-300">{t.qty}</div>
            <div className="text-gray-500">{new Date(t.time).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
