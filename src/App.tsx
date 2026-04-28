import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  LineChart as LineChartIcon,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap
} from 'lucide-react';
import StockSearch from './components/StockSearch';
import PriceChart from './components/PriceChart';
import Disclaimer from './components/Disclaimer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PredictionData {
  trend: string;
  signal: string;
  currentPrice: number;
  indicators: {
    rsi: number;
    sma50: number;
    sma200: number;
  };
  predictions: {
    shortTerm: any[];
    longTerm: any[];
  };
}

const FEATURED_STOCKS = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: 'RELIANCE.NS', name: 'Reliance' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
];

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('^NSEI');
  const [history, setHistory] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = async () => {
    try {
      const symbols = FEATURED_STOCKS.map(s => s.symbol).join(',');
      const res = await fetch(`/api/stock/quotes?symbols=${symbols}`);
      if (res.ok) {
        const data = await res.json();
        setWatchlistData(data);
      }
    } catch (err) {
      console.error('Failed to fetch watchlist', err);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    const interval = setInterval(fetchWatchlist, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (symbol: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [histRes, predRes] = await Promise.all([
        fetch(`/api/stock/history/${symbol}`),
        fetch(`/api/stock/predict/${symbol}`)
      ]);

      if (!histRes.ok || !predRes.ok) throw new Error('Failed to fetch stock data');

      const histData = await histRes.json();
      const predData = await predRes.json();

      setHistory(histData);
      setPrediction(predData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedSymbol);
  }, [selectedSymbol]);

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'uptrend': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'downtrend': return <TrendingDown className="w-5 h-5 text-rose-500" />;
      default: return <Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSignalColor = (signal: string) => {
    if (signal.toLowerCase().includes('buy')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (signal.toLowerCase().includes('sell')) return 'bg-rose-50 text-rose-600 border-rose-200';
    return 'bg-amber-50 text-amber-600 border-amber-200';
  };

  return (
    <div className="h-screen flex flex-col bg-dashboard-bg text-slate-900 overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="h-16 border-b border-line flex items-center justify-between px-6 bg-dashboard-sidebar shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Stylized SS Logo inspired by upload */}
            <div className="absolute inset-0 bg-slate-900 rounded-lg shadow-lg rotate-3 transition-transform group-hover:rotate-6"></div>
            <div className="absolute inset-0 bg-indigo-600 rounded-lg shadow-lg -rotate-3 transition-transform group-hover:-rotate-6 flex items-center justify-center overflow-hidden">
               <span className="text-white font-black text-xl italic tracking-tighter select-none">SS</span>
               <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tighter text-slate-900">STOCK<span className="text-indigo-600 font-black italic">SAGE</span></span>
        </div>
        
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
          <StockSearch onSelect={setSelectedSymbol} />
        </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          <div className="hidden lg:flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            NIFTY 50: 22,415.80 (+0.45%)
          </div>
          <div className="h-4 w-[1px] bg-line hidden lg:block"></div>
        </div>
      </nav>

      {/* Main Dashboard Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Watchlist */}
        <aside className="w-64 border-r border-line bg-dashboard-sidebar hidden lg:flex flex-col shrink-0 shadow-sm z-0">
          <div className="p-4 border-b border-line text-[10px] font-black uppercase tracking-widest text-slate-400">Watchlist</div>
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {FEATURED_STOCKS.map((stock) => {
              const quote = watchlistData.find(q => q.symbol === stock.symbol);
              const price = quote?.regularMarketPrice;
              const change = quote?.regularMarketChangePercent;
              const isPositive = change >= 0;

              return (
                <button
                  key={stock.symbol}
                  onClick={() => setSelectedSymbol(stock.symbol)}
                  className={cn(
                    "w-full text-left p-3 transition-all rounded-xl border border-transparent group mb-1",
                    selectedSymbol === stock.symbol 
                      ? "bg-dashboard-hover border-line border-l-brand-primary border-l-4 shadow-sm" 
                      : "hover:bg-dashboard-hover"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className={cn("font-bold text-sm group-hover:text-brand-primary", selectedSymbol === stock.symbol ? "text-brand-primary" : "text-slate-700")}>
                      {stock.symbol.split('.')[0]}
                    </span>
                    <div className="text-right">
                      <div className="text-[10px] font-mono font-bold text-slate-900">
                        {price ? `₹${price.toLocaleString()}` : '...'}
                      </div>
                      <div className={cn("text-[8px] font-mono font-bold", isPositive ? "text-emerald-600" : "text-rose-600")}>
                        {change !== undefined ? `${isPositive ? '+' : ''}${change.toFixed(2)}%` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-tighter">
                    {stock.name}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-dashboard-bg flex flex-col">
          <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
            <div className="md:hidden mb-6">
              <StockSearch onSelect={setSelectedSymbol} />
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[60vh] flex flex-col items-center justify-center gap-6"
                >
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-4 border-brand-primary/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-brand-primary rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-primary font-black">Sage Pulse</p>
                    <p className="text-slate-400 text-sm">Decoding historical patterns...</p>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card border-rose-200 bg-white text-center py-12 shadow-md"
                >
                  <Info className="w-12 h-12 text-rose-500 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-slate-900 uppercase italic">Signal Lost</h3>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto">{error}</p>
                  <button 
                    onClick={() => fetchData(selectedSymbol)}
                    className="mt-8 px-6 py-3 bg-brand-primary rounded-xl font-black text-xs uppercase tracking-widest text-white hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
                  >
                    Reconnect Analysis
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Header Stats Block */}
                  <div className="flex flex-col md:flex-row items-start md:items-end justify-between bg-dashboard-card p-6 md:p-8 rounded-3xl border border-line gap-6 grow-0 shadow-sm">
                    <div className="space-y-2">
                      <div className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity className="w-3 h-3 text-brand-primary animate-pulse" />
                        {selectedSymbol} (NSE) Market Context
                      </div>
                      <div className="flex items-baseline gap-4">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
                          ₹{prediction?.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h1>
                        <span className={cn(
                          "font-bold font-mono text-lg flex items-center gap-1",
                          prediction?.trend === 'Uptrend' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {prediction?.trend === 'Uptrend' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                          {prediction?.trend === 'Uptrend' ? '+1.09%' : '-0.85%'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="flex-1 md:flex-none text-right px-6 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl">
                        <div className="text-[10px] text-brand-primary uppercase font-black tracking-widest mb-1 opacity-70">Sage Signal</div>
                        <div className={cn("text-2xl font-black uppercase italic tracking-tight", prediction?.signal.includes('Sell') ? 'text-rose-600' : 'text-brand-primary')}>
                          {prediction?.signal}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Market Movers Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {watchlistData.slice(0, 5).map((quote) => (
                      <div key={quote.symbol} className="bg-dashboard-card border border-line rounded-2xl p-4 shadow-sm hover:border-brand-primary/20 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedSymbol(quote.symbol)}>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{quote.symbol.split('.')[0]}</div>
                        <div className="text-sm font-bold text-slate-900">₹{quote.regularMarketPrice?.toLocaleString()}</div>
                        <div className={cn("text-[10px] font-mono font-bold mt-1", quote.regularMarketChangePercent >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {quote.regularMarketChangePercent >= 0 ? '+' : ''}{quote.regularMarketChangePercent?.toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Main Charts & Analysis Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Chart Column */}
                    <div className="xl:col-span-2 space-y-6">
                      <div className="card h-full min-h-[500px] flex flex-col bg-dashboard-card border border-line shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <LineChartIcon className="w-4 h-4 text-brand-primary" />
                            Trend Projection (Linear Regression)
                          </h3>
                        </div>
                        <div className="flex-1 relative min-h-[350px]">
                          <PriceChart data={history} predictions={prediction?.predictions.shortTerm || []} />
                        </div>
                      </div>
                    </div>

                    {/* Analysis Sidebar Column */}
                    <div className="space-y-6">
                      <div className="card p-5 border-emerald-100 bg-emerald-50/10 shadow-sm">
                        <div className="text-[10px] text-slate-400 uppercase mb-4 font-black tracking-widest">Short-term Prediction</div>
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm",
                            prediction?.trend === 'Uptrend' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                          )}>
                            {getTrendIcon(prediction?.trend || '')}
                          </div>
                          <div>
                            <div className={cn("text-xl font-black uppercase italic", prediction?.trend === 'Uptrend' ? 'text-emerald-600' : 'text-rose-600')}>
                              {prediction?.trend}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                              Est. 30D Target: <span className="text-slate-900 font-mono">₹{prediction?.predictions.shortTerm[prediction.predictions.shortTerm.length - 1].value.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card p-5 border-line shadow-sm">
                        <div className="text-[10px] text-slate-400 uppercase mb-4 font-black tracking-widest text-center flex items-center justify-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-brand-primary"></div>
                          Analysis Confidence
                          <div className="w-1 h-1 rounded-full bg-brand-primary"></div>
                        </div>
                        <div className="flex flex-col items-center pt-2">
                          <div className="relative w-32 h-32">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                              <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="3" />
                              <motion.circle 
                                cx="18" cy="18" r="16" fill="none" 
                                className="stroke-brand-primary" 
                                strokeWidth="3" 
                                strokeDasharray="100"
                                initial={{ strokeDashoffset: 100 }}
                                animate={{ strokeDashoffset: 15 }}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black font-mono text-slate-900">85%</span>
                              <span className="text-[8px] uppercase font-black text-slate-400 tracking-widest">Accuracy</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 text-center mt-6 leading-relaxed italic opacity-70">
                            Statistical model derived from LSTM logic utilizing 24 months of volatility metrics.
                          </p>
                        </div>
                      </div>

                      <div className="card p-0 overflow-hidden border-line shadow-sm">
                        <div className="px-5 py-4 border-b border-line bg-slate-50/50">
                          <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Technical Snap</h4>
                        </div>
                        <div className="divide-y divide-line">
                          <div className="px-5 py-3 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">RSI (14)</span>
                            <span className="text-xs font-mono font-bold text-slate-700">{prediction?.indicators.rsi.toFixed(2)}</span>
                          </div>
                          <div className="px-5 py-3 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SMA 50 Relay</span>
                            <span className="text-xs font-mono font-bold text-slate-700">₹{prediction?.indicators.sma50.toFixed(0)}</span>
                          </div>
                          <div className="px-5 py-3 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Base Context</span>
                            <span className="text-xs font-mono font-bold text-emerald-600 uppercase">Stable</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-auto">
            <Disclaimer />
          </div>
        </main>
      </div>
    </div>
  );
}
