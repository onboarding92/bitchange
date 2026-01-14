import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SimpleTradingChartProps {
  symbol: string;
  priceData: PriceData[];
}

export default function SimpleTradingChart({ symbol, priceData }: SimpleTradingChartProps) {
  const chartData = {
    labels: priceData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Price',
        data: priceData.map(d => d.close),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'rgb(226, 232, 240)',
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(148, 163, 184)',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      y: {
        ticks: {
          color: 'rgb(148, 163, 184)',
          callback: function(value: any) {
            if (typeof value !== 'number' || !isFinite(value)) {
              return '$0';
            }
            return '$' + value.toLocaleString();
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="w-full" style={{ height: '400px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
