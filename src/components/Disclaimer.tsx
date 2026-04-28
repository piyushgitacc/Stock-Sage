import { AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <footer className="bg-white border-t border-slate-200 p-4 text-center">
      <p className="text-[10px] text-slate-400 leading-relaxed max-w-4xl mx-auto font-medium">
        <span className="font-bold text-slate-500 uppercase mr-2 tracking-widest">⚠️ Disclaimer:</span>
        Stock Sage is an educational and informational tool only. All predictions are generated using historical data and statistical models and should NOT be considered financial advice. Users should not rely on this platform for investment decisions. Investing in Indian stock markets involves risk.
      </p>
    </footer>
  );
}
