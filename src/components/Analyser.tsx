import React, { useState, useEffect, useCallback } from 'react';
import { StrategySettings, AnalysisData } from '../types';
import Chart from 'react-apexcharts';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2, Bot } from 'lucide-react';

interface AnalyserProps {
  settings: StrategySettings;
}

export const AnalyserTab: React.FC<AnalyserProps> = ({ settings }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [prevClose, setPrevClose] = useState<number | null>(null);
  const [chartDataState, setChartDataState] = useState<any[]>([]);

  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [investCapital, setInvestCapital] = useState<number>(100000);

  const handleAnalyse = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setChatMessages([]);

    const today = new Date();
    const todayStr = today.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    const activeFilters = [
      settings.volConfirmation ? "Volume > 1.5x avg" : null,
      settings.sectorMomentum ? "Sector momentum bullish" : null,
      settings.broadMarket ? "Broad market filter (Nifty 50 > 50MA)" : null,
      settings.rsiFilter ? "Avoid overbought (RSI > 75)" : null,
      settings.partialExit ? "Partial exit strategy" : null,
      settings.futureResistance ? "Future resistance mapping" : null,
    ].filter(Boolean).join(', ') || 'None';

    // User-provided strict guidelines for system instruction
    const systemInstruction = `You are a world-class Indian equity swing trader and quantitative analyst with 20 years of experience trading on NSE. You specialize in the Smart Money Delivery Spike Strategy — identifying stocks where institutional investors are accumulating positions through unusually high delivery volumes, then trading the subsequent breakout.

=== THINKING MODE INSTRUCTIONS ===
Before giving any answer you MUST think through:

THINK 1 — Stock Selection:
Which stock from the selected index genuinely has a delivery spike setup right now? Think about:
- Is this stock actually in the selected index?
- Does its debt-to-equity ratio match the filter?
- Is the delivery spike real and significant?
- Is the stock liquid enough to trade safely?

THINK 2 — Price Consistency Check:
Before finalizing any price, verify:
- Is Battle Zone HIGH actually higher than Battle Zone LOW?
- Is Entry Price actually above Battle Zone HIGH?
- Is Stop Loss actually below Battle Zone LOW?
- Is Target 1 actually above Entry Price?
- Is Target 2 actually above Target 1?
- Do the recent 10 closing prices match the real price range of this stock?
- Is riskPerShare exactly equal to Entry minus Stop Loss?

THINK 3 — Filter Compliance:
For every active toggle, verify the stock passes:
- If Volume Confirmation ON: does breakout volume exceed 1.5x the 20-day average volume?
- If Sector Momentum ON: is the sectoral index above its 20-day moving average?
- If Broad Market ON: is Nifty 50 above its 50-day moving average right now?
- If RSI Filter ON: is RSI below 75 at entry?

THINK 4 — Score Honesty:
Calculate setup score honestly out of 10:
- Spike strength vs threshold: up to 3 points
- Volume confirmation: up to 2 points  
- Price proximity to battle zone: up to 2 points
- Broad market trend: up to 2 points
- Historical success rate: up to 1 point
Do NOT give high scores to weak setups.

THINK 5 — Index Rules:
Apply the correct rules for the selected index before picking any stock.

=== USER SETTINGS — APPLY ALL OF THESE ===

SETTING 1 — Index Universe:
User selects one of:
- Nifty 100 (recommended) → top 100 liquid stocks, balanced opportunity and safety
- Nifty 50 (safest) → most liquid 50 stocks, need stronger spike (prefer 2x or above), tighter battle zones
- Nifty 200 (broader) → good mix of large and midcap, standard rules apply
- Nifty Midcap 150 → midcap stocks, hold 5 to 18 days, moderate liquidity
- Nifty Midcap 100 → top midcap stocks, good delivery signals, hold 5 to 18 days
- Nifty Smallcap 100 → small cap stocks, ONLY pick stocks with daily volume above 2 lakh shares, stricter stop loss required, hold 7 to 21 days, delivery spike signal is very strong here because institutions rarely move smallcaps
- Nifty 500 → covers large, mid, and small cap, maximum opportunities, avoid any stock with very low daily volume, apply stricter liquidity check

SETTING 2 — Max Debt-to-Equity:
User selects one of:
- Less than 1 → only pick stocks with D/E below 1
- Less than 0.5 → only pick stocks with D/E below 0.5, very conservative, financially strong companies only
- Less than 2 → relaxed filter, more stocks qualify
- Any → ignore debt filter completely

SETTING 3 — Delivery Lookback Period:
User selects one of:
- 30 days (standard) → compare spike to 30-day average
- 20 days (faster) → compare spike to 20-day average, more sensitive to recent changes
- 50 days (smoother) → compare spike to 50-day average, filters out short-term noise

SETTING 4 — Delivery Spike Threshold:
User selects one of:
- 1.5x → spike must be 50% above the lookback average
- 2x → spike must be 100% above average, very strong institutional signal
- 1.3x → spike must be 30% above average, more sensitive, catches earlier moves

SETTING 5 — Entry Timeframe:
User selects one of:
- 15-min or 1-hour → entry when price closes above Battle Zone HIGH on 15-minute or 1-hour candle
- Daily candle close → only enter on daily close above Battle Zone HIGH
- 1-hour only → must close above on 1-hour candle
- 15-min only → must close above on 15-min candle

SETTING 6 — Risk-Reward Target:
User selects one of:
- 1:2 (balanced) → Target 1 = Entry + (Risk x 2)
- 1:1.5 (conservative) → Target 1 = Entry + (Risk x 1.5)
- 1:3 (aggressive) → Target 1 = Entry + (Risk x 3)
Target 2 is always 1.5x Target 1 distance from entry

SETTING 7 — Min and Max Holding Days:
User enters number for minimum and maximum days.
Estimated days to Target 1 and Target 2 must fall within this range.

=== OPTIONAL ENHANCEMENT TOGGLES ===
Each toggle is either ON or OFF based on user selection.
Apply rules ONLY for toggles that are ON.

TOGGLE 1 — Volume Confirmation:
Label: Require volume > 1.5x avg on breakout day
When ON:
  Only select stock if the delivery spike day volume is above 1.5x its 20-day average volume.
  This confirms genuine institutional activity.
  If volume is not confirmed, reject this stock and find another that passes.

TOGGLE 2 — Sector Momentum:
Label: Only trade stocks in bullish sectors (sectoral index > 20-day MA)
When ON:
  Only select stock if its Nifty sectoral index (example: Nifty Bank, Nifty IT, Nifty Auto) is currently trading above its 20-day moving average.
  If sector is bearish, reject and find another stock.

TOGGLE 3 — Broad Market Filter:
Label: Only enter when Nifty 50 is above its 50-day MA
When ON:
  Only enter trades when Nifty 50 index is above its 50-day simple moving average.
  If Nifty 50 is below 50-day MA, mark setup as WATCH only regardless of other signals.

TOGGLE 4 — RSI Filter:
Label: Avoid overbought stocks (RSI > 75) at entry
When ON:
  Check 14-period RSI on daily chart at entry point.
  If RSI is above 75, the stock is overbought.
  Reject this stock and find one with RSI below 75.

TOGGLE 5 — Python Script:
Label: Include Python code to fetch NSE delivery data
When ON:
  Include a complete working Python script that:
  1. Downloads NSE Bhavcopy CSV for the selected index
  2. Calculates rolling average delivery % per stock
  3. Flags stocks where delivery exceeds average by selected threshold
  4. Records Battle Zone High and Low for flagged stocks
  5. Outputs results to a clean CSV file
  Use pandas, requests libraries.
  Add inline comments explaining each step.

TOGGLE 6 — Trailing Stop:
Label: Include trailing stop-loss instructions
When ON:
  After price reaches Target 1:
  Move stop loss to exact breakeven price (entry price)
  After price reaches 1.5R gain:
  Trail stop loss to lock 0.5R profit
  Give exact rupee values for each trail level.

TOGGLE 7 — Partial Exit:
Label: Book 50% at Target 1, ride rest to Target 2
When ON:
  At Target 1: sell exactly 50% of position
  For remaining 50%: move stop to breakeven
  Let remaining 50% ride to Target 2
  With trailing stop as per Trailing Stop toggle.

TOGGLE 8 — Future Resistance Mapping:
Label: Identify next 2 resistance zones with exact price levels
When ON:
  Identify the next 2 horizontal resistance zones above the entry price on the daily chart.
  Give exact rupee values for Resistance Zone 1 and Resistance Zone 2.
  These become alternative Target levels.

=== STRATEGY LOGIC — NEVER CHANGE THIS ===

IMPORTANT: Delivery data is ALWAYS past data.
This is correct and expected in swing trading.
The strategy requires past delivery data to find the spike day. Do not try to make delivery data current — past is correct.

PAST DATA section (historical):
Step 1: Find the day in the lookback period where delivery % spiked above average by threshold
Step 2: Record that day's date as spikeDate
Step 3: That day's HIGH price = Battle Zone HIGH
Step 4: That day's LOW price = Battle Zone LOW
Step 5: Calculate spike strength = spike delivery % divided by average delivery %

CURRENT STATUS:
Check where current price is relative to Battle Zone:
- Current price above Battle Zone HIGH = Already Broken Out
- Current price below Battle Zone HIGH = Waiting for Breakout

FUTURE PROJECTION section (forward looking):
Entry Price = Battle Zone HIGH multiplied by 1.005
Stop Loss = Battle Zone LOW multiplied by 0.997
Risk per share = Entry Price minus Stop Loss
Target 1 = Entry Price plus (Risk x RR multiplier)
Target 2 = Entry Price plus (Risk x RR multiplier x 1.5)
Estimated days = based on stock ATR and price distance

=== STRICT RULES — NEVER VIOLATE ===
Rule 1: Battle Zone HIGH must be greater than LOW
Rule 2: Entry must be greater than Battle Zone HIGH
Rule 3: Stop Loss must be less than Battle Zone LOW
Rule 4: Target 1 must be greater than Entry
Rule 5: Target 2 must be greater than Target 1
Rule 6: riskPerShare must equal Entry minus Stop Loss
Rule 7: recentPrices must have exactly 10 values
Rule 8: All prices must match real trading range
Rule 9: Never give vague prices — always exact rupees
Rule 10: actionRecommendation must be exactly one of: READY TO BUY, WATCH, AVOID

=== FINAL OUTPUT MUST ALWAYS CONTAIN ===
suggestedTicker → real NSE symbol
spikeDate → real recent date DD-MMM-YYYY
avgDelivery30d → percentage string e.g. 42.5%
spikeDayDelivery → percentage string e.g. 78.3%
spikeStrength → e.g. 1.8x average
battleZoneHigh → exact rupee number
battleZoneLow → exact rupee number
breakoutStatus → Already Broken Out or Waiting for Breakout
historicalSuccessRate → e.g. 4 out of 5 went up 80%
trendAlignment → Bullish or Bearish or Neutral
institutionalActivity → High or Medium or Low
keySupport → exact rupee number
keyResistance → exact rupee number
sectorOutlook → Positive or Negative or Neutral
recentPrices → array of exactly 10 closing prices
entryTriggerPrice → exact rupee number
stopLossPrice → exact rupee number
riskPerShare → exact rupee number
target1 → exact rupee number
target2 → exact rupee number
estimatedDaysT1 → e.g. 5 to 7 days
estimatedDaysT2 → e.g. 10 to 14 days
setupScore → number from 1 to 10
actionRecommendation → READY TO BUY or WATCH or AVOID`;

    const prompt = `Today is ${todayStr}. Indian stock market is active.

Based on the instructions, the user has selected the following settings for the scan:
- SETTING 1 (Index Universe): ${settings.indexUniverse}
- SETTING 2 (Max Debt-to-Equity): ${settings.maxDebtToEquity}
- SETTING 3 (Lookback): ${settings.lookbackDays} days
- SETTING 4 (Spike Threshold): ${settings.spikeThreshold}
- SETTING 5 (Entry Timeframe): ${settings.entryTimeframe}
- SETTING 6 (Risk-Reward): ${settings.riskReward}
- SETTING 7 (Holding Days): ${settings.minHolding} to ${settings.maxHolding} days

Active Enhancement Toggles (ON):
${settings.volConfirmation ? "- Volume Confirmation (Require volume > 1.5x avg)" : ""}
${settings.sectorMomentum ? "- Sector Momentum (sectoral index > 20-day MA)" : ""}
${settings.broadMarket ? "- Broad Market (Nifty 50 above 50-day MA)" : ""}
${settings.rsiFilter ? "- RSI Filter (Avoid overbought RSI > 75)" : ""}
${settings.pythonScript ? "- Include Python code to fetch NSE delivery data" : ""}
${settings.trailingStop ? "- Include trailing stop-loss instructions" : ""}
${settings.partialExit ? "- Partial Exit (Book 50% at T1)" : ""}
${settings.futureResistance ? "- Future Resistance Mapping (next 2 zones)" : ""}

Output strictly in JSON matching the defined schema. Use the provided instructions and current state.`;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              thoughtProcess: { type: Type.STRING, description: "Your step-by-step thinking process going through THINK 1 to THINK 5" },
              spikeDate: { type: Type.STRING, description: "Real recent date e.g. 15-Apr-2025" },
              avgDelivery30d: { type: Type.STRING, description: "e.g. 42.5%" },
              spikeDayDelivery: { type: Type.STRING, description: "e.g. 78.3%" },
              spikeStrength: { type: Type.STRING, description: "e.g. 1.8x average" },
              battleZoneHigh: { type: Type.NUMBER },
              battleZoneLow: { type: Type.NUMBER },
              breakoutStatus: { type: Type.STRING, description: "Already Broken Out or Waiting for Breakout" },
              historicalSuccessRate: { type: Type.STRING, description: "e.g. 4 out of 5 past spikes went up - 80%" },
              trendAlignment: { type: Type.STRING, description: "Bullish, Bearish, or Neutral" },
              institutionalActivity: { type: Type.STRING, description: "High, Medium, or Low" },
              keySupport: { type: Type.NUMBER },
              keyResistance: { type: Type.NUMBER },
              sectorOutlook: { type: Type.STRING, description: "Positive, Negative, or Neutral" },
              suggestedTicker: { type: Type.STRING, description: "Real NSE ticker e.g. TATASTEEL" },
              recentPrices: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "10 real closing prices of the stock in correct price range"
              },
              entryTriggerPrice: { type: Type.NUMBER },
              stopLossPrice: { type: Type.NUMBER },
              riskPerShare: { type: Type.NUMBER },
              target1: { type: Type.NUMBER },
              target2: { type: Type.NUMBER },
              estimatedDaysT1: { type: Type.STRING },
              estimatedDaysT2: { type: Type.STRING },
              setupScore: { type: Type.NUMBER, description: "Score out of 10" },
              actionRecommendation: { type: Type.STRING, description: "Exactly: READY TO BUY, WATCH, or AVOID" }
            },
            required: [
              "spikeDate", "avgDelivery30d", "spikeDayDelivery", "spikeStrength",
              "battleZoneHigh", "battleZoneLow", "breakoutStatus", "historicalSuccessRate",
              "trendAlignment", "institutionalActivity", "keySupport", "keyResistance",
              "sectorOutlook", "suggestedTicker", "recentPrices", "entryTriggerPrice",
              "stopLossPrice", "riskPerShare", "target1", "target2",
              "estimatedDaysT1", "estimatedDaysT2", "setupScore", "actionRecommendation"
            ]
          }
        }
      });

      if (response.text) {
        const parsedData = JSON.parse(response.text) as AnalysisData;

        // VALIDATION: Fix any price inconsistencies before rendering
        if (parsedData.target1 <= parsedData.entryTriggerPrice) {
          parsedData.target1 = parsedData.entryTriggerPrice * 1.05;
        }
        if (parsedData.target2 <= parsedData.target1) {
          parsedData.target2 = parsedData.target1 * 1.05;
        }
        if (parsedData.stopLossPrice >= parsedData.entryTriggerPrice) {
          parsedData.stopLossPrice = parsedData.entryTriggerPrice * 0.97;
        }
        if (parsedData.battleZoneHigh <= parsedData.battleZoneLow) {
          parsedData.battleZoneHigh = parsedData.battleZoneLow * 1.03;
        }
        parsedData.riskPerShare = parsedData.entryTriggerPrice - parsedData.stopLossPrice;

        // Fetch real historical data from our Yahoo Finance proxy
        let newChartData: any[] = [];
        let lastClose = 0;
        let pClose = 0;

        try {
          const histRes = await fetch(`/api/history?ticker=${parsedData.suggestedTicker}&days=10`);
          if (histRes.ok) {
            const histData = await histRes.json();
            if (histData && Array.isArray(histData) && histData.length > 0) {
              histData.forEach((candle: any) => {
                newChartData.push({
                   x: candle.time,
                   y: [
                     Number(candle.open.toFixed(2)),
                     Number(candle.high.toFixed(2)),
                     Number(candle.low.toFixed(2)),
                     Number(candle.close.toFixed(2))
                   ]
                });
              });
              lastClose = histData[histData.length - 1].close;
              pClose = histData.length > 1 ? histData[histData.length - 2].close : lastClose;
            }
          }
        } catch (e) {
          console.error("Failed to fetch historical data:", e);
        }

        // Fallback if historical data fetch fails or is incomplete
        if (newChartData.length === 0) {
          const now = new Date();
          if (parsedData.recentPrices && parsedData.recentPrices.length > 0) {
            parsedData.recentPrices.forEach((price: number, i: number) => {
              const d = new Date(now);
              d.setDate(now.getDate() - (parsedData.recentPrices.length - 1 - i));
              const prevCloseVal = i === 0 ? price * 0.99 : parsedData.recentPrices[i - 1];
              const o = prevCloseVal;
              const c = price;
              const h = Math.max(o, c) + (price * 0.005 * Math.random());
              const l = Math.min(o, c) - (price * 0.005 * Math.random());
              newChartData.push({
                x: d.getTime(),
                y: [Number(o.toFixed(2)), Number(h.toFixed(2)), Number(l.toFixed(2)), Number(c.toFixed(2))]
              });
            });
            lastClose = parsedData.recentPrices[parsedData.recentPrices.length - 1];
            pClose = parsedData.recentPrices.length > 1
              ? parsedData.recentPrices[parsedData.recentPrices.length - 2]
              : lastClose * 0.99;
          } else {
            const bzLow = parsedData.battleZoneLow;
            for (let i = 0; i < 10; i++) {
              newChartData.push({ x: now.getTime(), y: [bzLow, bzLow, bzLow, bzLow] });
            }
            lastClose = parsedData.entryTriggerPrice || bzLow;
            pClose = lastClose;
          }
        }

        // Validate BZ vs prices? If the prices are completely off, BZ needs adjusting
        // Gemini doesn't know REAL prices today, so let's adjust the Battle Zone & Entry/Targets relative to the REAL lastClose
        if (lastClose > 0) {
           const factor = lastClose / (parsedData.entryTriggerPrice || lastClose);
           // Scale everything if they are drastically off (e.g. Gemini returned 300 but real price is 600)
           if (Math.abs(factor - 1) > 0.05) {
             parsedData.entryTriggerPrice *= factor;
             parsedData.stopLossPrice *= factor;
             parsedData.target1 *= factor;
             parsedData.target2 *= factor;
             parsedData.battleZoneHigh *= factor;
             parsedData.battleZoneLow *= factor;
             parsedData.riskPerShare = parsedData.entryTriggerPrice - parsedData.stopLossPrice;
             parsedData.keySupport *= factor;
             parsedData.keyResistance *= factor;
           }
        }

        setData(parsedData);
        setChartDataState(newChartData);
        setLivePrice(lastClose);
        setPrevClose(pClose);
      } else {
        throw new Error("No response from Gemini.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  }, [settings]);

  useEffect(() => {
    const handleTrigger = () => handleAnalyse();
    document.addEventListener('trigger-analysis', handleTrigger);
    return () => document.removeEventListener('trigger-analysis', handleTrigger);
  }, [handleAnalyse]);

  useEffect(() => {
    let interval: number;
    if (data && data.suggestedTicker) {
      const fetchLiveData = async () => {
        try {
          const res = await fetch(`/api/quote?ticker=${data.suggestedTicker}`);
          if (res.ok) {
             const quoteData = await res.json();
             if (quoteData && quoteData.price) {
                setLivePrice(quoteData.price);
                setPrevClose(quoteData.prevClose);

                setChartDataState(prevChart => {
                  const newChart = [...prevChart];
                  const currentCandle = newChart[newChart.length - 1];
                  newChart[newChart.length - 1] = {
                    x: currentCandle.x,
                    y: [
                      Number(currentCandle.y[0].toFixed(2)),
                      Number(Math.max(currentCandle.y[1], quoteData.price, quoteData.high || quoteData.price).toFixed(2)),
                      Number(Math.min(currentCandle.y[2], quoteData.price, quoteData.low || quoteData.price).toFixed(2)),
                      Number(quoteData.price.toFixed(2))
                    ]
                  };
                  return newChart;
                });
             }
          }
        } catch (err) {
          console.error("Failed to fetch real-time quote:", err);
        }
      };
      
      // Fetch currently and then poll every 5 seconds for real-time updates
      fetchLiveData();
      interval = window.setInterval(fetchLiveData, 5000);
    }
    return () => clearInterval(interval);
  }, [data]);

  const copyTradePlan = () => {
    if (!data) return;
    const plan = `TRADE PLAN FOR ${data.suggestedTicker}

[PAST DATA]
Spike Date: ${data.spikeDate}
30-day Avg Delivery: ${data.avgDelivery30d}
Spike Day Delivery: ${data.spikeDayDelivery}
Spike Strength: ${data.spikeStrength}
Battle Zone HIGH: ₹${data.battleZoneHigh}
Battle Zone LOW: ₹${data.battleZoneLow}
Breakout Status: ${data.breakoutStatus}
Success Rate: ${data.historicalSuccessRate}

[FUTURE PROJECTION]
Entry Price: ₹${data.entryTriggerPrice}
Stop Loss: ₹${data.stopLossPrice}
Risk Per Share: ₹${data.riskPerShare}
Target 1: ₹${data.target1} (${data.estimatedDaysT1})
Target 2: ₹${data.target2} (${data.estimatedDaysT2})
Setup Score: ${data.setupScore}/10
Action: ${data.actionRecommendation}`;
    navigator.clipboard.writeText(plan);
    alert('Trade plan copied!');
  };

  const getScoreColor = (score: number) =>
    score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500';

  const getScoreTextClass = (score: number) =>
    score >= 7 ? 'text-green-400' : score >= 5 ? 'text-amber-400' : 'text-red-400';

  const getActionBannerClass = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('buy') || a.includes('ready')) return 'bg-green-600 text-white border-green-500';
    if (a.includes('watch') || a.includes('wait')) return 'bg-amber-500 text-white border-amber-400';
    return 'bg-red-600 text-white border-red-500';
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !data) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert swing trading assistant.
The user is looking at a setup for ${data.suggestedTicker} with:
- Current Price: ₹${livePrice?.toFixed(2)}
- Entry Price: ₹${data.entryTriggerPrice?.toFixed(2)}
- Target 1: ₹${data.target1?.toFixed(2)}
- Stop Loss: ₹${data.stopLossPrice?.toFixed(2)}
- Recommendation: ${data.actionRecommendation}

Trade Plan Context:
${JSON.stringify(data, null, 2)}

User asks: "${userMessage}"

Keep your answer concise, practical, and focused on helping the user make a trading decision. Do not use markdown for simple responses, unless making a list.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      if (response.text) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error: ' + err.message }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

      {loading && !data && (
        <div className="flex flex-col items-center justify-center p-12 bg-[#0D0D0D] border border-[#222] rounded-xl">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-4" />
          <p className="text-white/60 text-sm tracking-widest uppercase">Analysing Setup...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-900/50">
          <p className="font-medium text-xs tracking-widest uppercase">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

          {data.thoughtProcess && (
            <div className="bg-[#111] border border-blue-500/30 rounded p-4 text-sm mt-4">
               <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Bot size={14} /> AI Analyst Thinking Process
               </h3>
               <div className="text-white/70 whitespace-pre-wrap leading-relaxed text-xs">
                 {data.thoughtProcess}
               </div>
            </div>
          )}

          <div className={`p-6 rounded border-2 text-center ${getActionBannerClass(data.actionRecommendation)}`}>
            <div className="text-xl font-bold uppercase tracking-wider">
              {data.actionRecommendation.includes('BUY') || data.actionRecommendation.includes('READY')
                ? '✓ READY TO BUY'
                : data.actionRecommendation.includes('WATCH') || data.actionRecommendation.includes('WAIT')
                ? '⚠ WATCH — WAIT FOR BREAKOUT'
                : '✗ AVOID'}
            </div>
          </div>

          <div className="bg-[#0D0D0D] p-4 rounded-xl border border-[#222] relative">
            <div className="absolute top-4 left-4 z-10">
              <h3 className="text-[10px] text-white/30 uppercase tracking-widest">
                {data.suggestedTicker} — Battle Zone Chart
              </h3>
            </div>
            {livePrice !== null && prevClose !== null && (
              <div className="absolute top-10 left-4 z-10 flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/30 tracking-widest">CMP</span>
                  <span className="text-lg font-bold">₹{livePrice.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/30 tracking-widest">CHG</span>
                  <span className={`text-lg font-bold ${(livePrice - prevClose) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(livePrice - prevClose) >= 0 ? '+' : ''}
                    {(((livePrice - prevClose) / prevClose) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
            <div className="w-full h-[400px] pt-16">
              <Chart
                options={{
                  chart: { type: 'candlestick', background: 'transparent', toolbar: { show: false }, animations: { enabled: false } },
                  theme: { mode: 'dark' },
                  grid: { borderColor: '#222' },
                  xaxis: { type: 'datetime', labels: { style: { colors: '#666' } }, axisBorder: { color: '#222' }, axisTicks: { color: '#222' } },
                  yaxis: { labels: { style: { colors: '#666' }, formatter: (v) => v.toFixed(2) } },
                  plotOptions: { candlestick: { colors: { upward: '#22c55e', downward: '#ef4444' }, wick: { useFillColor: true } } },
                  annotations: {
                    yaxis: [
                      { y: data.battleZoneHigh, y2: data.battleZoneLow, fillColor: '#ED8936', opacity: 0.1 },
                      { y: data.battleZoneHigh, borderColor: '#ED8936', strokeDashArray: 5, label: { text: `BZ High: ₹${data.battleZoneHigh.toFixed(2)}`, style: { color: '#fff', background: '#ED8936' } } },
                      { y: data.battleZoneLow, borderColor: '#ED8936', strokeDashArray: 5, label: { text: `BZ Low: ₹${data.battleZoneLow.toFixed(2)}`, style: { color: '#fff', background: '#ED8936' } } },
                      { y: data.entryTriggerPrice, borderColor: '#D97706', strokeDashArray: 0, borderWidth: 2, label: { text: `Entry: ₹${data.entryTriggerPrice.toFixed(2)}`, position: 'left', style: { color: '#fff', background: '#D97706' } } },
                      { y: data.stopLossPrice, borderColor: '#DC2626', strokeDashArray: 0, borderWidth: 2, label: { text: `SL: ₹${data.stopLossPrice.toFixed(2)}`, position: 'left', style: { color: '#fff', background: '#DC2626' } } },
                      { y: data.target1, borderColor: '#86EFAC', strokeDashArray: 0, borderWidth: 2, label: { text: `T1: ₹${data.target1.toFixed(2)}`, position: 'left', style: { color: '#000', background: '#86EFAC' } } },
                      { y: data.target2, borderColor: '#166534', strokeDashArray: 0, borderWidth: 2, label: { text: `T2: ₹${data.target2.toFixed(2)}`, position: 'left', style: { color: '#fff', background: '#166534' } } }
                    ]
                  }
                }}
                series={[{ name: 'Candles', data: chartDataState }]}
                type="candlestick"
                height={350}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-[#0D0D0D] border border-[#222] border-t-4 border-t-blue-600 p-4 rounded-lg">
              <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-4">Past Data</h3>
              <div className="space-y-1">
                <DataRow label="Spike Date" value={data.spikeDate} />
                <DataRow label="Avg Delivery %" value={data.avgDelivery30d} />
                <DataRow label="Spike Day Delivery %" value={data.spikeDayDelivery} />
                <DataRow label="Spike Strength" value={data.spikeStrength} />
                <DataRow label="Battle Zone High" value={`₹${data.battleZoneHigh.toFixed(2)}`} />
                <DataRow label="Battle Zone Low" value={`₹${data.battleZoneLow.toFixed(2)}`} />
                <DataRow label="Success Rate" value={data.historicalSuccessRate} />
                <div className="flex justify-between items-center py-1.5 text-[11px] uppercase tracking-wider mt-2">
                  <span className="text-white/40">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    data.breakoutStatus.toLowerCase().includes('broken') || data.breakoutStatus.toLowerCase().includes('already')
                      ? 'bg-green-900/30 text-green-400 border-green-800'
                      : 'bg-amber-900/30 text-amber-500 border-amber-800'
                  }`}>
                    {data.breakoutStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#0D0D0D] border border-[#222] border-t-4 border-t-[#1D9E75] p-4 rounded-lg">
              <h3 className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-4">Future Projection</h3>
              <div className="space-y-1">
                <DataRow label="Entry Price" value={`₹${data.entryTriggerPrice.toFixed(2)}`} valueClass="font-bold text-amber-500" />
                <DataRow label="Stop Loss" value={`₹${data.stopLossPrice.toFixed(2)}`} valueClass="font-bold text-red-500" />
                <DataRow label="Risk Per Share" value={`₹${Number(data.riskPerShare).toFixed(2)}`} />
                <DataRow label="Target 1" value={`₹${data.target1.toFixed(2)}`} valueClass="font-bold text-green-400" />
                <DataRow label="Target 2" value={`₹${data.target2.toFixed(2)}`} valueClass="font-bold text-green-500" />
                <DataRow label="Days to T1" value={data.estimatedDaysT1} />
                <DataRow label="Days to T2" value={data.estimatedDaysT2} />
              </div>
            </div>

            <div className="bg-[#0D0D0D] border border-[#222] border-t-4 border-t-purple-500 p-4 rounded-lg xl:col-span-1 md:col-span-2">
              <h3 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-4">Position Sizing</h3>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Capital (₹)</label>
                  <input
                    type="number"
                    value={investCapital}
                    onChange={(e) => setInvestCapital(Number(e.target.value))}
                    className="w-full bg-[#111] border border-[#333] text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <DataRow label="Shares to Buy" value={Math.floor(investCapital / data.entryTriggerPrice)} valueClass="font-bold text-blue-400" />
                  <DataRow label="Total Invested" value={`₹${(Math.floor(investCapital / data.entryTriggerPrice) * data.entryTriggerPrice).toFixed(2)}`} />
                  <DataRow label="Total Risk" value={`₹${(Math.floor(investCapital / data.entryTriggerPrice) * data.riskPerShare).toFixed(2)}`} valueClass="text-red-400 font-bold" />
                  <DataRow label="Profit (T1)" value={`₹${(Math.floor(investCapital / data.entryTriggerPrice) * (data.target1 - data.entryTriggerPrice)).toFixed(2)}`} valueClass="text-green-400 font-bold" />
                  <DataRow label="Profit (T2)" value={`₹${(Math.floor(investCapital / data.entryTriggerPrice) * (data.target2 - data.entryTriggerPrice)).toFixed(2)}`} valueClass="text-green-500 font-bold" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0D0D0D] border border-[#222] border-t-4 border-t-purple-600 p-4 rounded-lg">
            <h3 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-4">Confidence Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <span className="block text-[9px] text-white/40 uppercase mb-1">Trend</span>
                <span className={`text-[11px] font-bold ${data.trendAlignment.toLowerCase().includes('bull') ? 'text-green-500' : data.trendAlignment.toLowerCase().includes('bear') ? 'text-red-500' : 'text-amber-500'}`}>{data.trendAlignment}</span>
              </div>
              <div>
                <span className="block text-[9px] text-white/40 uppercase mb-1">Inst. Activity</span>
                <span className={`text-[11px] font-bold ${data.institutionalActivity.toLowerCase().includes('high') ? 'text-green-500' : data.institutionalActivity.toLowerCase().includes('low') ? 'text-red-500' : 'text-white'}`}>{data.institutionalActivity}</span>
              </div>
              <div>
                <span className="block text-[9px] text-white/40 uppercase mb-1">Key Support</span>
                <span className="text-[11px] font-bold text-white">₹{data.keySupport}</span>
              </div>
              <div>
                <span className="block text-[9px] text-white/40 uppercase mb-1">Key Resistance</span>
                <span className="text-[11px] font-bold text-white">₹{data.keyResistance}</span>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="block text-[9px] text-white/40 uppercase mb-1">Sector</span>
                <span className={`text-[11px] font-bold ${data.sectorOutlook.toLowerCase().includes('pos') ? 'text-green-500' : data.sectorOutlook.toLowerCase().includes('neg') ? 'text-red-500' : 'text-white'}`}>{data.sectorOutlook}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0D0D0D] p-4 rounded-xl border border-[#222]">
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-bold text-white uppercase tracking-widest text-[10px]">Setup Score</h3>
              <span className={`text-xl font-bold ${getScoreTextClass(data.setupScore)}`}>
                {data.setupScore}<span className="text-white/40 text-sm">/10</span>
              </span>
            </div>
            <div className="h-3 w-full bg-[#222] rounded-full overflow-hidden">
              <div
                className={`h-full ${getScoreColor(data.setupScore)} transition-all duration-1000 ease-out`}
                style={{ width: `${(data.setupScore / 10) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={copyTradePlan}
            className="w-full bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase border border-white/10 rounded tracking-widest text-[#E4E4E4] transition-colors py-3"
          >
            Copy Trade Plan
          </button>

          {/* Chat Section */}
          <div className="bg-[#0D0D0D] border border-[#222] p-4 rounded-lg mt-6">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">Trading Assistant</h3>
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <p className="text-white/40 text-xs text-center italic">Ask a question about this setup...</p>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`p-3 text-sm rounded ${msg.role === 'user' ? 'bg-blue-900/40 text-blue-50 ml-auto w-[85%]' : 'bg-[#222] text-white/80 w-[85%]'}`}>
                    <div className="text-[10px] uppercase font-bold text-white/40 mb-1">{msg.role === 'user' ? 'You' : 'Assistant'}</div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))
              )}
              {isChatLoading && (
                 <div className="p-3 text-sm rounded bg-[#222] text-white/80 w-[85%]">
                    <Loader2 className="animate-spin h-4 w-4 text-blue-500" />
                 </div>
              )}
            </div>
            <form onSubmit={handleAskQuestion} className="flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 bg-[#111] border border-[#333] text-white text-sm rounded p-2 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Should I buy now or wait?"
              />
              <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 rounded font-bold text-xs uppercase tracking-wider">
                Ask
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
};

const DataRow = ({ label, value, valueClass = "text-white" }: { label: string; value: React.ReactNode; valueClass?: string }) => (
  <div className="flex justify-between py-1 text-[11px] uppercase tracking-wider">
    <span className="text-white/40">{label}</span>
    <span className={`text-right font-medium ${valueClass}`}>{value}</span>
  </div>
);