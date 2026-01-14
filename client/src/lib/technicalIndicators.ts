export interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RSIData {
  timestamp: number;
  value: number;
}

export interface MACDData {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface SMAData {
  timestamp: number;
  value: number;
}

/**
 * Calculate RSI (Relative Strength Index)
 * @param prices Array of price data
 * @param period RSI period (default: 14)
 * @returns Array of RSI values
 */
export function calculateRSI(prices: PriceData[], period: number = 14): RSIData[] {
  if (prices.length < period + 1) return [];

  const rsiData: RSIData[] = [];
  const changes: number[] = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i].close - prices[i - 1].close);
  }

  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate RSI for each subsequent point
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];

    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    rsiData.push({
      timestamp: prices[i + 1].timestamp,
      value: rsi,
    });
  }

  return rsiData;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param prices Array of price data
 * @param fastPeriod Fast EMA period (default: 12)
 * @param slowPeriod Slow EMA period (default: 26)
 * @param signalPeriod Signal line period (default: 9)
 * @returns Array of MACD values
 */
export function calculateMACD(
  prices: PriceData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDData[] {
  if (prices.length < slowPeriod + signalPeriod) return [];

  const fastEMA = calculateEMA(prices.map(p => p.close), fastPeriod);
  const slowEMA = calculateEMA(prices.map(p => p.close), slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < fastEMA.length && i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i] - slowEMA[i]);
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);

  const macdData: MACDData[] = [];
  const startIndex = slowPeriod - 1;

  for (let i = signalPeriod - 1; i < macdLine.length && i < signalLine.length; i++) {
    const histogram = macdLine[i] - signalLine[i];
    macdData.push({
      timestamp: prices[startIndex + i].timestamp,
      macd: macdLine[i],
      signal: signalLine[i],
      histogram,
    });
  }

  return macdData;
}

/**
 * Calculate SMA (Simple Moving Average)
 * @param prices Array of price data
 * @param period SMA period
 * @returns Array of SMA values
 */
export function calculateSMA(prices: PriceData[], period: number): SMAData[] {
  if (prices.length < period) return [];

  const smaData: SMAData[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j].close;
    }
    const sma = sum / period;

    smaData.push({
      timestamp: prices[i].timestamp,
      value: sma,
    });
  }

  return smaData;
}

/**
 * Calculate EMA (Exponential Moving Average)
 * @param values Array of values
 * @param period EMA period
 * @returns Array of EMA values
 */
function calculateEMA(values: number[], period: number): number[] {
  if (values.length < period) return [];

  const emaData: number[] = [];
  const multiplier = 2 / (period + 1);

  // Calculate initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let ema = sum / period;
  emaData.push(ema);

  // Calculate EMA for remaining values
  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
    emaData.push(ema);
  }

  return emaData;
}

/**
 * Calculate Bollinger Bands
 * @param prices Array of price data
 * @param period Period (default: 20)
 * @param stdDev Standard deviations (default: 2)
 * @returns Array of Bollinger Bands data
 */
export function calculateBollingerBands(
  prices: PriceData[],
  period: number = 20,
  stdDev: number = 2
): Array<{ timestamp: number; upper: number; middle: number; lower: number }> {
  if (prices.length < period) return [];

  const bands: Array<{ timestamp: number; upper: number; middle: number; lower: number }> = [];

  for (let i = period - 1; i < prices.length; i++) {
    // Calculate SMA (middle band)
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j].close;
    }
    const sma = sum / period;

    // Calculate standard deviation
    let variance = 0;
    for (let j = 0; j < period; j++) {
      variance += Math.pow(prices[i - j].close - sma, 2);
    }
    const sd = Math.sqrt(variance / period);

    bands.push({
      timestamp: prices[i].timestamp,
      upper: sma + stdDev * sd,
      middle: sma,
      lower: sma - stdDev * sd,
    });
  }

  return bands;
}
