import React, { useState } from 'react';
import { StrategySettings } from '../types';
import { Copy, ExternalLink, Sparkles } from 'lucide-react';

interface PromptGeneratorProps {
  settings: StrategySettings;
}

export const PromptGeneratorTab: React.FC<PromptGeneratorProps> = ({ settings }) => {
  const [prompt, setPrompt] = useState<string>('');

  React.useEffect(() => {
    generatePrompt();
  }, [settings]);

  const generatePrompt = () => {
    const activeFilters = [
      settings.volConfirmation ? "Volume > 1.5x avg" : null,
      settings.sectorMomentum ? "Sector momentum bullish" : null,
      settings.broadMarket ? "Broad market filter (Nifty 50 > 50MA)" : null,
      settings.rsiFilter ? "Avoid overbought (RSI > 75)" : null,
      settings.pythonScript ? "Include Python code to fetch NSE delivery data" : null,
      settings.trailingStop ? "Include trailing stop-loss instructions" : null,
      settings.partialExit ? "Partial exit strategy" : null,
      settings.futureResistance ? "Future resistance mapping" : null,
    ].filter(Boolean).join(', ') || 'None';

    const text = `System Instruction:
You are an expert Indian equity swing trader. Always respond in two strict sections:
[PAST DATA] — historical delivery spike data, battle zone levels, breakout status, historical success rate.
[FUTURE PROJECTION] — exact rupee entry price, stop loss, Target 1, Target 2, estimated days to each target, setup score out of 10, and action recommendation.
Never give vague answers. Always give exact rupee price levels. Never mix past data with future projections. For Action Recommendation use exactly one of: READY TO BUY, WATCH, or AVOID.

User Message:
Analyse [STOCK NAME] for a swing trade setup.
Index: ${settings.indexUniverse} | D/E ratio: ${settings.maxDebtToEquity} | Lookback: ${settings.lookbackDays} days
Spike threshold: ${settings.spikeThreshold} | Entry timeframe: ${settings.entryTimeframe}
Risk-Reward: ${settings.riskReward} | Hold period: ${settings.minHolding}–${settings.maxHolding} days
Active filters: ${activeFilters}
Output format: ${settings.outputFormat}

Give me [PAST DATA] first then [FUTURE PROJECTION] with exact Rs price levels.`;

    setPrompt(text);
  };

  const copyPrompt = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      alert('Prompt copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-[#0D0D0D] p-8 rounded-lg border border-[#222] text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-[#222] text-[#E4E4E4] mb-6">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-widest mb-2">AI Prompt Generator</h2>
        <p className="text-white/40 mb-8 max-w-lg mx-auto text-sm">Generate the exact prompt to use directly in Google AI Studio to manually analyse your stocks.</p>
        
        <button 
          onClick={generatePrompt}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded font-bold text-sm tracking-widest uppercase transition-colors inline-flex items-center"
        >
          Generate AI prompt
        </button>
      </div>

      {prompt && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#050505] border border-[#222] rounded-lg overflow-hidden">
            <div className="bg-[#0D0D0D] border-b border-[#222] px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Generated Prompt</span>
            </div>
            <pre className="p-6 text-sm text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
              {prompt}
            </pre>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button 
              onClick={copyPrompt}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-[10px] font-bold border border-white/10 rounded tracking-widest text-[#E4E4E4] transition-colors flex items-center justify-center uppercase"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Prompt
            </button>
            <a 
              href="https://aistudio.google.com/apps" 
              target="_blank" 
              rel="noreferrer"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-[10px] font-bold rounded tracking-widest text-white transition-colors flex items-center justify-center uppercase"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in AI Studio
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
