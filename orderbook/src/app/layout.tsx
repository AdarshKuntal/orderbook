import './globals.css';

export const metadata = {
  title: 'Order Book Visualizer',
  description: 'Real-time order book visualizer using Binance WebSocket',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
