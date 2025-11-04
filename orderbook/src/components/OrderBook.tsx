'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useBinanceSocket } from '../hooks/useBinanceSocket';
import { applyDepthDelta, mapToSortedArray } from '../lib/orderbook';

export default function OrderBook({ symbol = 'btcusdt' }: { symbol?: string }) {
  const bidsRef = useRef<Map<string, number>>(new Map());
  const asksRef = useRef<Map<string, number>>(new Map());
  const [version, setVersion] = useState(0);
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);

  // smooth rendering control
  const pending = useRef(false);
  const scheduleRender = () => {
    if (pending.current) return;
    pending.current = true;
    requestAnimationFrame(() => {
      pending.current = false;
      setVersion((v) => v + 1);
    });
  };

  const onDepthUpdate = (d: any) => {
    applyDepthDelta(bidsRef.current, d.b || []);
    applyDepthDelta(asksRef.current, d.a || []);
    scheduleRender();
  };

  const { close } = useBinanceSocket({
    symbol,
    onDepthUpdate,
    combined: true,
    onAggTrade: undefined,
  });

  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  const bids = useMemo(() => mapToSortedArray(bidsRef.current, 'bids', 25), [version]);
  const asks = useMemo(() => mapToSortedArray(asksRef.current, 'asks', 25), [version]);

  const topBid = bids.length ? bids[0].price : 0;
  const topAsk = asks.length ? asks[0].price : 0;
  const spread = topAsk && topBid ? topAsk - topBid : 0;

  const maxBidCum = bids.length ? Math.max(...bids.map((r) => r.cum)) : 1;
  const maxAskCum = asks.length ? Math.max(...asks.map((r) => r.cum)) : 1;

  return (
    <div className="flex-1 bg-[#0d1117] p-4 rounded-2xl shadow-md border border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-gray-200 tracking-wide">Order Book</h3>
      <div className="flex gap-4 text-gray-300 font-mono">
        
        {/* Bids */}
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
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${barWidth}%`,
                      background: 'linear-gradient(to right, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
                      zIndex: 0,
                      transition: 'width 0.2s ease-out',
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

        {/* Spread */}
        <div className="w-1/6 text-center flex flex-col items-center justify-center">
          <div className="text-sm text-gray-400">Spread</div>
          <div className="text-base font-semibold text-yellow-400 mt-1">{spread.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-2">
            {topBid ? `Bid ${topBid.toFixed(2)}` : '-'}<br />
            {topAsk ? `Ask ${topAsk.toFixed(2)}` : '-'}
          </div>
        </div>

        {/* Asks */}
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
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: `${barWidth}%`,
                      background: 'linear-gradient(to left, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                      zIndex: 0,
                      transition: 'width 0.2s ease-out',
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
