import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
// @ts-ignore
import YahooFinance from "yahoo-finance2";
import * as ss from "simple-statistics";
import { addDays, format, parseISO } from "date-fns";

const yahooFinance = new (YahooFinance as any)();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Technical Indicators
  const calculateSMA = (data: number[], period: number) => {
    if (data.length < period) return [];
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push({ index: i, value: sum / period });
    }
    return sma;
  };

  const calculateRSI = (data: number[], period: number = 14) => {
    if (data.length < period + 1) return [];
    const rsi = [];
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = data[i] - data[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgGain / avgLoss;
      rsi.push({ index: i, value: 100 - 100 / (1 + rs) });
    }
    return rsi;
  };

  // API Routes
  app.get("/api/stock/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.json([]);
      console.log(`Searching for: ${query}`);
      const results: any = await yahooFinance.search(query);
      console.log(`Found ${results.quotes?.length || 0} quotes`);
      res.json(results.quotes || []);
    } catch (error: any) {
      console.error('Search API error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stock/history/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      console.log(`Fetching history for: ${ticker}`);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 2);

      const queryOptions = {
        period1: startDate,
        period2: endDate,
        interval: '1d' as const
      };

      const result: any = await yahooFinance.historical(ticker, queryOptions);
      console.log(`History points fetched: ${result?.length || 0}`);
      res.json(result);
    } catch (error: any) {
      console.error('History API error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stock/quotes", async (req, res) => {
    try {
      const symbolsStr = req.query.symbols as string;
      if (!symbolsStr) return res.json([]);
      const symbols = symbolsStr.split(',');
      const results = await yahooFinance.quote(symbols);
      res.json(results);
    } catch (error: any) {
      console.error('Quotes API error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stock/predict/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      console.log(`Predicting for: ${ticker}`);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 2);

      const history: any = await yahooFinance.historical(ticker, {
        period1: startDate,
        period2: endDate,
        interval: '1d' as const
      });

      console.log(`Predictor fetched ${history?.length || 0} history points`);
      if (!history || history.length === 0) {
        return res.status(404).json({ error: "No historical data found for this ticker" });
      }

      const closes = history.map((h) => h.close);
      const sma50 = calculateSMA(closes, 50);
      const sma200 = calculateSMA(closes, 200);
      const rsi = calculateRSI(closes, 14);

      // Simple prediction using Linear Regression
      // X = index, Y = close
      const regressionData = history.map((h, i) => [i, h.close]);
      const l = ss.linearRegression(regressionData);
      const lFunc = ss.linearRegressionLine(l);

      // Predict next 30 days
      const lastIndex = history.length - 1;
      const shortTermPredictions = [];
      const lastDate = new Date(history[lastIndex].date);

      for (let i = 1; i <= 30; i++) {
        shortTermPredictions.push({
          date: addDays(lastDate, i),
          value: lFunc(lastIndex + i)
        });
      }

       // Predict next 365 days (Long term)
       const longTermPredictions = [];
       for (let i = 1; i <= 365; i += 30) {
         longTermPredictions.push({
           date: addDays(lastDate, i),
           value: lFunc(lastIndex + i)
         });
       }

      // Trend Logic
      const lastClose = closes[closes.length - 1];
      const lastSMA50 = sma50[sma50.length - 1]?.value;
      const lastSMA200 = sma200[sma200.length - 1]?.value;
      const lastRSI = rsi[rsi.length - 1]?.value;

      let trend = "Sideways";
      let signal = "Hold";

      if (lastSMA50 && lastSMA200) {
        if (lastSMA50 > lastSMA200 && lastClose > lastSMA50) {
          trend = "Uptrend";
          signal = lastRSI > 70 ? "Hold (Overbought)" : "Buy";
        } else if (lastSMA50 < lastSMA200 && lastClose < lastSMA50) {
          trend = "Downtrend";
          signal = lastRSI < 30 ? "Hold (Oversold)" : "Sell";
        }
      }

      res.json({
        trend,
        signal,
        indicators: {
          rsi: lastRSI,
          sma50: lastSMA50,
          sma200: lastSMA200
        },
        predictions: {
          shortTerm: shortTermPredictions,
          longTerm: longTermPredictions
        },
        currentPrice: lastClose
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
