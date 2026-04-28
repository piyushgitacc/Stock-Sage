import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceArea
} from 'recharts';
import { format, parseISO, isSameDay } from 'date-fns';

interface ChartData {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  prediction?: number;
  sma50?: number;
  sma200?: number;
}

export default function PriceChart({ data, predictions }: { data: any[], predictions: any[] }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  // Merge data for charting
  const formattedData: ChartData[] = data.map((d, i) => {
    // Basic moving average calculation for display if needed here, 
    // but we can also use values from server
    return {
      date: typeof d.date === 'string' ? d.date : d.date.toISOString(),
      close: d.close,
      open: d.open,
      high: d.high,
      low: d.low,
    };
  });

  const predictionData: ChartData[] = predictions.map(p => ({
    date: p.date,
    close: undefined as any,
    open: undefined as any,
    high: undefined as any,
    low: undefined as any,
    prediction: p.value
  }));

  // Combine only for the axes
  const allData = [...formattedData, ...predictionData];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-slate-500 mb-1">
            {format(new Date(label), 'MMM dd, yyyy')}
          </p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex justify-between gap-4 text-sm">
              <span className="text-slate-500 uppercase text-[10px] font-bold">{entry.name}:</span>
              <span className="font-mono font-bold" style={{ color: entry.color }}>
                ₹{entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={allData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A5B4FC" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#A5B4FC" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(val) => format(new Date(val), 'MMM yy')}
            minTickGap={30}
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
          
          <Area 
            type="monotone" 
            dataKey="close" 
            name="Price" 
            stroke="#4F46E5" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            dot={false}
          />
          
          <Line 
            type="monotone" 
            dataKey="prediction" 
            name="Predicted Trend" 
            stroke="#A5B4FC" 
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />

          {/* Markers for the start of prediction */}
          {formattedData.length > 0 && predictionData.length > 0 && (
            <ReferenceArea 
              x1={formattedData[formattedData.length - 1].date} 
              x2={predictionData[predictionData.length - 1].date} 
              // @ts-ignore
              fill="#A5B4FC" 
              fillOpacity={0.05} 
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
