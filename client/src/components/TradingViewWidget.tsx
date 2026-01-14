import { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
}

export default function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined') {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}`,
          interval: '60',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1e293b',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          container_id: 'tradingview_widget',
          studies: [
            'RSI@tv-basicstudies',
            'MASimple@tv-basicstudies',
            'MACD@tv-basicstudies'
          ],
        });
      }
    };

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div 
      ref={container}
      id="tradingview_widget"
      style={{ height: '500px', width: '100%' }}
    />
  );
}
