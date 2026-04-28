import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route to fetch real-time stock proxy (Yahoo Finance)
  app.get('/api/quote', async (req, res) => {
    try {
      const { ticker } = req.query;
      if (!ticker || typeof ticker !== 'string') {
        return res.status(400).json({ error: 'Ticker is required' });
      }

      // Format for NSE. If it doesn't have .NS, add it assuming it's an Indian stock
      const formattedTicker = ticker.endsWith('.NS') || ticker.endsWith('.BO') ? ticker : `${ticker}.NS`;
      
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedTicker}?region=IN&lang=en-IN&includePrePost=false&interval=1d&useYfid=true&range=1d`;
      
      const yahooRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!yahooRes.ok) {
        return res.status(yahooRes.status).json({ error: 'Failed to fetch quote from Yahoo Finance' });
      }

      const data = await yahooRes.json();
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        return res.status(404).json({ error: 'No data found for this ticker' });
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];
      
      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose;
      
      res.json({
        price,
        prevClose,
        high: meta.regularMarketDayHigh || price,
        low: meta.regularMarketDayLow || price,
        open: quote.open && quote.open.length > 0 ? quote.open[0] : price,
        time: meta.regularMarketTime * 1000
      });
    } catch (error: any) {
      console.error('Error fetching quote:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // API Route to fetch historical stock data
  app.get('/api/history', async (req, res) => {
    try {
      const { ticker, days = '10' } = req.query;
      if (!ticker || typeof ticker !== 'string') {
        return res.status(400).json({ error: 'Ticker is required' });
      }

      // Format for NSE.
      const formattedTicker = ticker.endsWith('.NS') || ticker.endsWith('.BO') ? ticker : `${ticker}.NS`;
      
      const numDays = parseInt(days as string, 10);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedTicker}?region=IN&lang=en-IN&includePrePost=false&interval=1d&useYfid=true&range=${numDays}d`;
      
      const yahooRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!yahooRes.ok) {
        return res.status(yahooRes.status).json({ error: 'Failed to fetch history from Yahoo Finance' });
      }

      const data = await yahooRes.json();
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        return res.status(404).json({ error: 'No data found for this ticker' });
      }

      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      
      const history = [];
      for (let i = 0; i < timestamps.length; i++) {
        history.push({
          time: timestamps[i] * 1000,
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume[i]
        });
      }
      
      res.json(history);
    } catch (error: any) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
