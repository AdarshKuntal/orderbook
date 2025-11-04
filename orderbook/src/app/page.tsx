import OrderBook from '../components/OrderBook';
import RecentTrades from '../components/RecentTrades';

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Real-Time BTC/USDT Order Book (Binance)</h1>
        <div className="flex flex-col md:flex-row gap-6">
          <OrderBook symbol="btcusdt" />
          <RecentTrades symbol="btcusdt" />
        </div>
      </div>
    </main>
  );
}
