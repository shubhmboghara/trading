import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2, Bot, AlertTriangle, CheckCircle, BrainCircuit } from 'lucide-react';
import { ForensicAnalysisData } from '../types';

export const ForensicsTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ForensicAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputData, setInputData] = useState<string>('');

  const handleAnalyse = async () => {
    if (!inputData.trim()) {
      setError('Please provide some raw financial data or management commentary to analyse.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    const systemInstruction = `Act as a ruthless, tier-1 forensic equity analyst and quantitative researcher for the Indian stock market. Your job is to perform an uncompromising, deep fundamental analysis of a company to determine if it is a high-quality compounder or a toxic value trap.

You must completely ignore short-term price action, technical charts, and daily momentum.

=== DEEP THINKING INSTRUCTIONS ===
Before generating your final JSON output, you MUST engage in a deep, multi-step internal reasoning process to evaluate the raw financial data and management commentary provided by the user.

THINK STEP 1: The Cash Flow Reality Check
Revenue is vanity, Profit is sanity, Cash is reality. Compare the company's Profit After Tax (PAT) to its Cash Flow from Operations (CFO). Are they reporting massive accounting profits but failing to generate actual cash? Identify aggressive revenue recognition or ballooning receivables.

THINK STEP 2: The Debt & Survival Matrix
Analyze the Debt-to-Equity ratio and Interest Coverage Ratio. Is the company funding its growth with high-cost debt? Can they comfortably pay their interest obligations from their operating profit, or are they one bad quarter away from a liquidity crisis?

THINK STEP 3: The Margin Trajectory
Look at the Operating Profit Margins (OPM) over the last few years/quarters. Are margins expanding due to pricing power, or are they bleeding margins just to maintain revenue growth?

THINK STEP 4: The Management Bullshit Filter
Scan the provided management commentary, earnings call notes, or auditor red flags. Look for contradictions. Are the promoters pledging their shares? Are there shady related-party transactions?`;

    const prompt = `Perform a ruthless forensic analysis on the following company data/commentary:\n\n${inputData}`;

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
              thoughtProcess: { type: Type.STRING, description: "Your deep reasoning for THINK 1 to 4" },
              ticker: { type: Type.STRING, description: "Exact NSE symbol" },
              businessQualityScore: { type: Type.NUMBER, description: "Score 1 to 10" },
              cashFlowAssessment: { type: Type.STRING, description: "One brutal, no-nonsense sentence explaining if earnings are backed by real cash." },
              solvencyRisk: { type: Type.STRING, description: "Low, Medium, High, or Toxic" },
              marginTrend: { type: Type.STRING, description: "Expanding, Stagnant, or Contracting" },
              forensicRedFlags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List exactly 3 specific fundamental risks, accounting anomalies, or management concerns"
              },
              fundamentalStrengths: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List exactly 3 specific financial strengths or moats"
              },
              intrinsicValueEstimate: { type: Type.STRING, description: "Significantly Undervalued, Fairly Valued, or Overvalued" },
              finalVerdict: { type: Type.STRING, description: "STRONG BUY, HOLD, VALUE TRAP, or AVOID" }
            },
            required: [
              "thoughtProcess", "ticker", "businessQualityScore", "cashFlowAssessment",
              "solvencyRisk", "marginTrend", "forensicRedFlags", "fundamentalStrengths",
              "intrinsicValueEstimate", "finalVerdict"
            ]
          }
        }
      });

      if (response.text && response.text.includes('ticker')) {
        const parsed = JSON.parse(response.text);
        setData(parsed);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict.toUpperCase()) {
      case 'STRONG BUY': return 'text-green-500 border-green-500/50 bg-green-500/10';
      case 'HOLD': return 'text-amber-500 border-amber-500/50 bg-amber-500/10';
      case 'VALUE TRAP': return 'text-red-600 border-red-600/50 bg-red-600/10';
      case 'AVOID': return 'text-red-500 border-red-500/50 bg-red-500/10';
      default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
    }
  };

  const getSolvencyColor = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'LOW': return 'text-green-500';
      case 'MEDIUM': return 'text-amber-500';
      case 'HIGH': return 'text-orange-500';
      case 'TOXIC': return 'text-red-600 font-bold';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#0A0A0A] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
          <BrainCircuit className="text-red-600" />
          Ruthless Forensic Analysis
        </h2>
        <p className="text-sm text-white/50 mb-4">
          Paste raw financial data, earnings call transcripts, or management commentary below. 
          Our AI acts as a tier-1 forensic analyst to ruthlessly expose the fundamental truth—ignoring short-term price action.
        </p>

        <textarea
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="Paste trailing 12 months financial numbers, CFO vs PAT comparisons, debt levels, and management commentary here..."
          className="w-full h-48 bg-black/40 border border-[#333] text-white p-4 rounded-lg focus:outline-none focus:border-red-600/50 resize-y mb-4"
        />

        <button
          onClick={handleAnalyse}
          disabled={loading || !inputData.trim()}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Running Forensic Audit...
            </>
          ) : (
            'Execute Fundamental Reality Check'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg text-center animate-in fade-in zoom-in duration-300">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          <p className="font-bold">Audit Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {data.thoughtProcess && (
            <div className="bg-[#111] border border-blue-500/30 rounded p-4 text-sm">
               <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Bot size={14} /> Internal Forensic Reasoning Log
               </h3>
               <div className="text-white/70 whitespace-pre-wrap leading-relaxed text-xs">
                 {data.thoughtProcess}
               </div>
            </div>
          )}

          <div className={`p-6 rounded border-2 text-center ${getVerdictColor(data.finalVerdict)}`}>
            <div className="text-2xl font-black uppercase tracking-widest">
              {data.ticker} - {data.finalVerdict}
            </div>
            <div className="text-sm mt-2 opacity-80 uppercase tracking-widest">
              Overall Business Quality Score: <span className="font-bold text-lg">{data.businessQualityScore}/10</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0D0D0D] border border-[#222] border-t-4 border-t-red-600 p-4 rounded-lg space-y-4">
              <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} /> The Harsh Reality
              </h3>
              
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Cash Flow Assessment</p>
                <p className="text-sm font-medium text-white/90">{data.cashFlowAssessment}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Solvency Risk</p>
                  <p className={`text-sm font-bold uppercase tracking-wider ${getSolvencyColor(data.solvencyRisk)}`}>
                    {data.solvencyRisk}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Margin Trend</p>
                  <p className="text-sm font-bold uppercase tracking-wider text-white">
                    {data.marginTrend}
                  </p>
                </div>
                <div className="col-span-2">
                   <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Intrinsic Value Assessment</p>
                   <p className="text-sm font-bold uppercase tracking-wider text-white">
                    {data.intrinsicValueEstimate}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0D0D0D] border border-[#222] p-4 rounded-lg">
                <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} /> Forensic Red Flags
                </h3>
                <ul className="space-y-2">
                  {data.forensicRedFlags.map((flag, idx) => (
                    <li key={idx} className="text-xs text-red-200/80 flex items-start gap-2">
                      <span className="text-red-500 flex-shrink-0 mt-0.5">•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0D0D0D] border border-[#222] p-4 rounded-lg">
                <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle size={14} /> Fundamental Strengths
                </h3>
                <ul className="space-y-2">
                  {data.fundamentalStrengths.map((strength, idx) => (
                    <li key={idx} className="text-xs text-green-200/80 flex items-start gap-2">
                      <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
