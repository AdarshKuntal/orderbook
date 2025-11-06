# Real-Time Order Book Visualizer (Next.js 15 - Canary)

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the dev server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000

## Notes

- This scaffold targets Next.js 15 canary with App Router. If you'd prefer Next.js 14 stable, edit package.json accordingly.
- Tailwind is pre-configured via `tailwind.config.ts` and `globals.css`.
- The app connects to Binance WebSocket combined streams (`aggTrade` and `depth`).
- For a fully consistent local orderbook you may implement REST snapshot + sequence handling (see Binance docs).

## Files of interest
- `src/hooks/useBinanceSocket.ts` - WebSocket hook, reconnection logic.
- `src/lib/orderbook.ts` - aggregator helpers (Map-based).
- `src/components/OrderBook.tsx` - order book UI.
- `src/components/RecentTrades.tsx` - recent trades UI.

## Deploy
 https://adarshkorderbook.netlify.app/

