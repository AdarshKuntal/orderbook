'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useBinanceSocket } from '../hooks/useBinanceSocket';
import { applyDepthDelta, mapToSortedArray } from '../lib/orderbook';

// ✅ Define proper types
interface DepthDelta {
  b?: [string, string][]; // bids: [price, quantity]
  a?: [string, string][]; // asks: [price, quantity]
}

interface OrderRow {
  price: number;
  qty: number;
  cum: number;
}

interface OrderBookProps {
  symbol?: string;
}

export default function OrderBook({ symbol = 'btcusdt' }: OrderBookProps) {
  const bidsRef = useRef<Map<string, number>>(new Map());
  const asksRef = useRef<Map<string, number>>(new Map());
  const [version, setVersion] = useState(0);
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);

  // ✅ Smooth rendering: debounce UI updates with requestAnimationFrame
  const pending = useRef(false);
  const scheduleRender = () => {
    if (pending.current) return;
    pending.current = true;
    requestAnimationFrame(() => {
      pending.current = false;
      setVersion((v) => v + 1);
    });
  };

  // ✅ Called when new WebSocket depth data arrives
  const onDepthUpdate = (d: DepthDelta | null) => {
    if (!d) return;
    applyDepthDelta(bidsRef.current, d.b ?? []);
    applyDepthDelta(asksRef.current, d.a ?? []);
    scheduleRender();
  };

  // ✅ Connect to Binance WebSocket
  const { close } = useBinanceSocket({
    symbol,
    onDepthUpdate,
    combined: true,
  });

  // ✅ Clean up socket on unmount
  useEffect(() => {
    return close;
  }, [close]);

  // ✅ Convert Maps → Sorted arrays (top 25 entries)
  const bids: OrderRow[] = useMemo(
    () => mapToSortedArray(bidsRef.current, 'bids', 25),
    [version]
  );
  const asks: OrderRow[] = useMemo(
    () => mapToSortedArray(asksRef.current, 'asks', 25),
    [version]
  );

  // ✅ Compute top levels and spread
  const topBid = bids[0]?.price ?? 0;
  const topAsk = asks[0]?.price ?? 0;
  const spread = topAsk && topBid ? topAsk - topBid : 0;

  // ✅ Cumulative max values (for background bar width scaling)
  const maxBidCum = bids.length ? Math.max(...bids.map((r) => r.cum)) : 1;
  const maxAskCum = asks.length ? Math.max(...asks.map((r) => r.cum)) : 1;

  return (
    <div className="flex-1 bg-[#0d1117] p-4 rounded-2xl shadow-md border border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-gray-200 tracking-wide">
        Order Book
      </h3>

      <div className="flex gap-4 text-gray-300 font-mono">
        {/* ===== BIDS ===== */}
        <div className="w-1/2">
          <div className="grid grid-cols-3 text-xs text-gray-400 mb-1">
            <div>Price (USDT)</div>
            <div>Amount</div>
            <div>Total</div>
          </div>
          <div className="space-y-[1px]">
            {bids.map((r) => {
              const barWidth = Math.min(100, (r.cum / maxBidCum) * 100);
              return (
                <div
                  key={r.price}
                  className={`relative py-1 text-xs transition-all duration-200 ${
                    hoverPrice === r.price ? 'bg-green-950/40' : ''
                  }`}
                  onMouseEnter={() => setHoverPrice(r.price)}
                  onMouseLeave={() => setHoverPrice(null)}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 transition-[width] duration-200 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      background:
                        'linear-gradient(to right, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
                      zIndex: 0,
                    }}
                  />
                  <div className="relative z-10 grid grid-cols-3">
                    <div className="text-green-400">{r.price.toFixed(2)}</div>
                    <div>{r.qty}</div>
                    <div>{r.cum}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== SPREAD ===== */}
        <div className="w-1/6 text-center flex flex-col items-center justify-center">
          <div className="text-sm text-gray-400">Spread</div>
          <div className="text-base font-semibold text-yellow-400 mt-1">
            {spread.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {topBid ? `Bid ${topBid.toFixed(2)}` : '-'}
            <br />
            {topAsk ? `Ask ${topAsk.toFixed(2)}` : '-'}
          </div>
        </div>

        {/* ===== ASKS ===== */}
        <div className="w-1/2">
          <div className="grid grid-cols-3 text-xs text-gray-400 mb-1">
            <div>Price (USDT)</div>
            <div>Amount</div>
            <div>Total</div>
          </div>
          <div className="space-y-[1px]">
            {asks.map((r) => {
              const barWidth = Math.min(100, (r.cum / maxAskCum) * 100);
              return (
                <div
                  key={r.price}
                  className={`relative py-1 text-xs transition-all duration-200 ${
                    hoverPrice === r.price ? 'bg-red-950/40' : ''
                  }`}
                  onMouseEnter={() => setHoverPrice(r.price)}
                  onMouseLeave={() => setHoverPrice(null)}
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 transition-[width] duration-200 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      background:
                        'linear-gradient(to left, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                      zIndex: 0,
                    }}
                  />
                  <div className="relative z-10 grid grid-cols-3">
                    <div className="text-red-400">{r.price.toFixed(2)}</div>
                    <div>{r.qty}</div>
                    <div>{r.cum}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
