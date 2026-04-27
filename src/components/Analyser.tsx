import React, { useState, useEffect, useCallback } from 'react';
import { StrategySettings, AnalysisData } from '../types';
import Chart from 'react-apexcharts';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2, Copy } from 'lucide-react';

interface OHLCData {
  x: Date;
  y: [number, number, number, number];
}

interface AnalyserProps {
  settings: StrategySettings;
}

export const AnalyserTab: React.FC<AnalyserProps> = ({ settings }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time Simulation States
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [prevClose, setPrevClose] = useState<number | null>(null);
  const [chartDataState, setChartDataState] = useState<any[]>([]);

  const handleAnalyse = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);

    const activeFilters = [
      settings.volConfirmation ? "Volume > 1.5x avg" : null,
      settings.sectorMomentum ? "Sector momentum bullish" : null,
      settings.broadMarket ? "Broad market filter (Nifty 50 > 50MA)" : null,
      settings.rsiFilter ? "Avoid overbought (RSI > 75)" : null,
      settings.partialExit ? "Partial exit strategy" : null,
      settings.futureResistance ? "Future resistance mapping" : null,
    ].filter(Boolean).join(', ') || 'None';

    const systemInstruction = "You are an expert Indian equity swing trader. Always respond with exact rupee price levels. Provide realistic and technically sound estimates for historical and future pricing.";
    
    // We request JSON back to easily paint the UI that the user wants
    const prompt = `Based on the following parameters, select an Indian equity (NSE) stock that hypothetically or realistically forms a perfect swing trade setup right now. 
Index: ${settings.indexUniverse} | D/E ratio: ${settings.maxDebtToEquity} | Lookback: ${settings.lookbackDays} days
Spike threshold: ${settings.spikeThreshold} | Entry timeframe: ${settings.entryTimeframe}
Risk-Reward: ${settings.riskReward} | Hold period: ${settings.minHolding}-${settings.maxHolding} days
Active filters: ${activeFilters}
Output format: JSON

Provide a detailed structured analysis for this chosen stock based on technical indicators.
IMPORTANT CONSTRAINTS:
1. Target 1 and Target 2 MUST be strictly greater than the Entry Price.
2. Stop Loss MUST be strictly less than the Entry Price.
3. Battle Zone High must be greater than Battle Zone Low.
4. Give realistic prices for Indian stocks (between ₹50 and ₹5000).`;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
      
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spikeDate: { type: Type.STRING, description: "E.g. 15-May-2024" },
              avgDelivery30d: { type: Type.STRING, description: "E.g. 45.2%" },
              spikeDayDelivery: { type: Type.STRING, description: "E.g. 85.6%" },
              spikeStrength: { type: Type.STRING, description: "E.g. 2.1x average" },
              battleZoneHigh: { type: Type.NUMBER },
              battleZoneLow: { type: Type.NUMBER },
              breakoutStatus: { type: Type.STRING, description: "Already Broken Out or Waiting for Breakout" },
              historicalSuccessRate: { type: Type.STRING, description: "E.g. 4 out of 5 past spikes went up - 80%" },
              
              trendAlignment: { type: Type.STRING, description: "Bullish, Bearish, or Neutral" },
              institutionalActivity: { type: Type.STRING, description: "High, Medium, or Low" },
              keySupport: { type: Type.NUMBER },
              keyResistance: { type: Type.NUMBER },
              sectorOutlook: { type: Type.STRING, description: "Positive, Negative, or Neutral" },
              suggestedTicker: { type: Type.STRING, description: "The symbol of the stock you selected, e.g. TATASTEEL" },
              
              entryTriggerPrice: { type: Type.NUMBER },
              stopLossPrice: { type: Type.NUMBER },
              riskPerShare: { type: Type.NUMBER },
              target1: { type: Type.NUMBER },
              target2: { type: Type.NUMBER },
              estimatedDaysT1: { type: Type.STRING },
              estimatedDaysT2: { type: Type.STRING },
              setupScore: { type: Type.NUMBER, description: "Score out of 10" },
              actionRecommendation: { type: Type.STRING, description: "Must be exactly READY TO BUY, WATCH, or AVOID" }
            },
            required: ["spikeDate", "avgDelivery30d", "spikeDayDelivery", "spikeStrength", "battleZoneHigh", "battleZoneLow", "breakoutStatus", "historicalSuccessRate", "trendAlignment", "institutionalActivity", "keySupport", "keyResistance", "sectorOutlook", "suggestedTicker", "entryTriggerPrice", "stopLossPrice", "riskPerShare", "target1", "target2", "estimatedDaysT1", "estimatedDaysT2", "setupScore", "actionRecommendation"]
          }
        }
      });

      if (response.text) {
        const parsedData = JSON.parse(response.text) as AnalysisData;
        setData(parsedData);
        
        // Initialize Real-time Data Simulation
        const isBullish = parsedData.actionRecommendation.includes('BUY') || parsedData.actionRecommendation.includes('READY');
        const mockInitialPrice = isBullish ? parsedData.entryTriggerPrice : parsedData.battleZoneHigh - Math.random() * (parsedData.battleZoneHigh - parsedData.battleZoneLow);
        
        const newChartData: any[] = [];
        const bzHigh = parsedData.battleZoneHigh;
        const bzLow = parsedData.battleZoneLow;
        const volatility = (bzHigh - bzLow) * 0.3; // 30% of the zone width
        
        let currentOpen = bzLow - volatility * 2;
        const now = new Date();
        
        // Generate pseudo-OHLC data
        for (let i = 0; i < 9; i++) {
          // Trend towards the battle zone
          const targetPrice = bzLow + (bzHigh - bzLow) * (i / 9);
          const currentClose = targetPrice + (Math.random() - 0.5) * volatility;
          
          const h = Math.max(currentOpen, currentClose) + Math.random() * volatility;
          const l = Math.max(0.1, Math.min(currentOpen, currentClose) - Math.random() * volatility);
          
          const d = new Date(now);
          d.setDate(now.getDate() - (9 - i));
          
          newChartData.push({ x: d.getTime(), y: [Number(currentOpen.toFixed(2)), Number(h.toFixed(2)), Number(l.toFixed(2)), Number(currentClose.toFixed(2))] });
          currentOpen = currentClose;
        }
        
        // Today's candle
        const todayO = currentOpen;
        const todayC = mockInitialPrice;
        const todayH = Math.max(todayO, todayC) + Math.random() * volatility;
        const todayL = Math.max(0.1, Math.min(todayO, todayC) - Math.random() * volatility);
        
        newChartData.push({ x: now.getTime(), y: [Number(todayO.toFixed(2)), Number(todayH.toFixed(2)), Number(todayL.toFixed(2)), Number(todayC.toFixed(2))] });
        
        setChartDataState(newChartData);
        setLivePrice(mockInitialPrice);
        setPrevClose(newChartData[8].y[3]); // Previous close is the close of the 9th candle
        
      } else {
        throw new Error("No response text found.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  }, [settings]);

  useEffect(() => {
    const handleTrigger = () => {
      handleAnalyse();
    };
    document.addEventListener('trigger-analysis', handleTrigger);
    return () => document.removeEventListener('trigger-analysis', handleTrigger);
  }, [handleAnalyse]);

  useEffect(() => {
    let interval: number;
    if (data && livePrice !== null) {
      interval = window.setInterval(() => {
        setLivePrice(prev => {
          if (prev === null) return prev;
          // max 0.2% movement per tick
          const volatility = prev * 0.002; 
          const change = (Math.random() * volatility * 2) - volatility;
          const newPrice = prev + change;

          // Also update the last point in the chart data
          setChartDataState(prevChart => { 
            const newChart = [...prevChart];
            const currentCandle = newChart[newChart.length - 1];
            const currentO = currentCandle.y[0];
            const currentH = Math.max(currentCandle.y[1], newPrice);
            const currentL = Math.min(currentCandle.y[2], newPrice);
            const currentC = newPrice;
            newChart[newChart.length - 1] = {
              x: currentCandle.x,
              y: [Number(currentO.toFixed(2)), Number(currentH.toFixed(2)), Number(currentL.toFixed(2)), Number(currentC.toFixed(2))]
            };
            return newChart;
          });

          return newPrice;
        });
      }, 3000);
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
Battle Zone HIGH: Rs ${data.battleZoneHigh}
Battle Zone LOW: Rs ${data.battleZoneLow}
Breakout Status: ${data.breakoutStatus}
Success Rate: ${data.historicalSuccessRate}

[FUTURE PROJECTION]
Entry Trigger Price: Rs ${data.entryTriggerPrice}
Stop Loss Price: Rs ${data.stopLossPrice}
Risk Per Share (1R): Rs ${data.riskPerShare}
Target 1: Rs ${data.target1} (${data.estimatedDaysT1})
Target 2: Rs ${data.target2} (${data.estimatedDaysT2})
Setup Score: ${data.setupScore}/10
Action: ${data.actionRecommendation}`;
    navigator.clipboard.writeText(plan);
    alert('Trade plan copied to clipboard!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'bg-green-500';
    if (score >= 5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreTextClass = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-amber-600';
    return 'text-red-600';
  };

  const getActionBannerClass = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('buy') || a.includes('ready')) return 'bg-green-600 text-white border-green-500';
    if (a.includes('watch') || a.includes('wait')) return 'bg-amber-500 text-white border-amber-400';
    return 'bg-red-600 text-white border-red-500';
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
          {/* Action Badge */}
          <div className={`p-6 rounded border-2 text-center flex flex-col gap-2 ${getActionBannerClass(data.actionRecommendation)}`}>
            <div className="flex justify-center text-xl font-bold uppercase tracking-wider">
               <span>
                  {data.actionRecommendation.includes('BUY') || data.actionRecommendation.includes('READY') 
                    ? 'READY TO BUY' 
                    : data.actionRecommendation.includes('WATCH') || data.actionRecommendation.includes('WAIT') 
                    ? 'WATCH — WAIT FOR BREAKOUT' 
                    : 'AVOID'}
               </span>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-[#0D0D0D] p-4 rounded-xl border border-[#222] relative">
            <div className="absolute top-4 left-4 z-10 flex gap-6">
              <div>
                <h3 className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{data.suggestedTicker} — Battle Zone Chart</h3>
              </div>
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
                    {(livePrice - prevClose) >= 0 ? '+' : ''}{(((livePrice - prevClose) / prevClose) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            <div className="w-full h-[400px] pt-16">
              <Chart
                options={{
                  chart: {
                    type: 'candlestick',
                    background: 'transparent',
                    toolbar: { show: false },
                    animations: { enabled: false } // Best for rapid updates
                  },
                  theme: { mode: 'dark' },
                  grid: { borderColor: '#222' },
                  xaxis: {
                    type: 'datetime',
                    labels: { style: { colors: '#666' } },
                    axisBorder: { color: '#222' },
                    axisTicks: { color: '#222' }
                  },
                  yaxis: {
                    labels: { style: { colors: '#666' }, formatter: (value) => value.toFixed(2) }
                  },
                  plotOptions: {
                    candlestick: {
                      colors: { upward: '#22c55e', downward: '#ef4444' },
                      wick: { useFillColor: true }
                    }
                  },
                  annotations: {
                    yaxis: [
                      {
                        y: data.battleZoneHigh,
                        y2: data.battleZoneLow,
                        fillColor: '#ED8936',
                        opacity: 0.1,
                      },
                      {
                        y: data.battleZoneHigh,
                        borderColor: '#ED8936',
                        strokeDashArray: 5,
                        label: { text: 'BZ High', style: { color: '#fff', background: '#ED8936' } }
                      },
                      {
                        y: data.battleZoneLow,
                        borderColor: '#ED8936',
                        strokeDashArray: 5,
                        label: { text: 'BZ Low', style: { color: '#fff', background: '#ED8936' } }
                      },
                      {
                        y: data.entryTriggerPrice,
                        borderColor: '#D97706',
                        strokeDashArray: 0,
                        borderWidth: 2,
                        label: { text: 'Entry', position: 'left', style: { color: '#fff', background: '#D97706' } }
                      },
                      {
                        y: data.stopLossPrice,
                        borderColor: '#DC2626',
                        strokeDashArray: 0,
                        borderWidth: 2,
                        label: { text: 'Stop Loss', position: 'left', style: { color: '#fff', background: '#DC2626' } }
                      },
                      {
                        y: data.target1,
                        borderColor: '#86EFAC',
                        strokeDashArray: 0,
                        borderWidth: 2,
                        label: { text: 'Target 1', position: 'left', style: { color: '#000', background: '#86EFAC' } }
                      },
                      {
                        y: data.target2,
                        borderColor: '#166534',
                        strokeDashArray: 0,
                        borderWidth: 2,
                        label: { text: 'Target 2', position: 'left', style: { color: '#fff', background: '#166534' } }
                      }
                    ]
                  }
                }}
                series={[{ name: 'Candles', data: chartDataState }]}
                type="candlestick"
                height={350}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Past Data */}
            <div className="bg-[#0D0D0D] border border-[#222] border-t-4 border-t-blue-600 p-4 rounded-lg">
                <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-4">
                  Past Data
                </h3>
                <div className="space-y-1 text-[11px]">
                  <DataRow label="Spike Date" value={data.spikeDate} />
                  <DataRow label="Average Delivery %" value={data.avgDelivery30d} />
                  <DataRow label="Spike Day Delivery %" value={data.spikeDayDelivery} />
                  <DataRow label="Battle Zone High" value={`₹${data.battleZoneHigh}`} />
                  <DataRow label="Battle Zone Low" value={`₹${data.battleZoneLow}`} />
                  <div className="flex justify-between items-center py-1.5 border-[#222] text-[11px] uppercase tracking-wider mt-2">
                    <span className="text-white/40">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${data.breakoutStatus.toLowerCase().includes('already') || data.breakoutStatus.toLowerCase().includes('broken') ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-amber-900/30 text-amber-500 border-amber-800'}`}>
                      {data.breakoutStatus}
                    </span>
                  </div>
                </div>
            </div>

            {/* Right Card: Future Projection */}
            <div className="bg-[#0D0D0D] border border-[#222] border-t-4 border-t-[#1D9E75] p-4 rounded-lg">
                <h3 className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-4">
                  Future Projection
                </h3>
                <div className="space-y-1 text-[11px]">
                  <DataRow label="Entry Price" value={`₹${data.entryTriggerPrice}`} valueClass="font-bold text-amber-500" />
                  <DataRow label="Stop Loss" value={`₹${data.stopLossPrice}`} valueClass="font-bold text-red-500" />
                  <DataRow label="Target 1" value={`₹${data.target1}`} valueClass="font-bold text-green-400" />
                  <DataRow label="Target 2" value={`₹${data.target2}`} valueClass="font-bold text-green-500" />
                  <DataRow label="Days to Target 1" value={data.estimatedDaysT1} />
                  <DataRow label="Days to Target 2" value={data.estimatedDaysT2} />
                </div>
            </div>
          </div>

          {/* New Confidence Metrics Section */}
          <div className="bg-[#0D0D0D] border border-[#222] border-t-4 border-t-purple-600 p-4 rounded-lg">
            <h3 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-4">
              Confidence Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <span className="block text-[9px] text-white/40 uppercase mb-1">Trend Alignment</span>
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
                <span className="block text-[9px] text-white/40 uppercase mb-1">Sector Outlook</span>
                <span className={`text-[11px] font-bold ${data.sectorOutlook.toLowerCase().includes('pos') ? 'text-green-500' : data.sectorOutlook.toLowerCase().includes('neg') ? 'text-red-500' : 'text-white'}`}>{data.sectorOutlook}</span>
              </div>
            </div>
          </div>

          {/* Setup Score Bar */}
          <div className="bg-[#0D0D0D] p-4 rounded-xl border border-[#222]">
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-bold text-white uppercase tracking-widest text-[10px]">Setup Score</h3>
              <span className={`text-xl font-bold ${getScoreTextClass(data.setupScore)}`}>{data.setupScore}<span className="text-white/40 text-sm">/10</span></span>
            </div>
            <div className="h-3 w-full bg-[#222] rounded-full overflow-hidden">
              <div 
                className={`h-full ${getScoreColor(data.setupScore)} transition-all duration-1000 ease-out`} 
                style={{ width: `${(data.setupScore / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          <button onClick={copyTradePlan} className="w-full bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase border border-white/10 rounded tracking-widest text-[#E4E4E4] transition-colors py-3 mt-4">
            Copy Trade Plan
          </button>
        </div>
      )}
    </div>
  );
};

const DataRow = ({ label, value, valueClass = "text-white" }: { label: string; value: React.ReactNode; valueClass?: string }) => (
  <div className="flex justify-between py-1 border-[#222] last:border-0 text-[11px] uppercase tracking-wider">
    <span className="text-white/40">{label}</span>
    <span className={`text-right font-medium ${valueClass}`}>{value}</span>
  </div>
);
