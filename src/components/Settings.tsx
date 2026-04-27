import React from 'react';
import { StrategySettings } from '../types';

interface SettingsProps {
  settings: StrategySettings;
  setSettings: (settings: StrategySettings) => void;
  onSave: () => void;
}

export const SettingsTab: React.FC<SettingsProps> = ({ settings, setSettings, onSave }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings({ ...settings, [name]: checked });
    } else if (type === 'number') {
        setSettings({ ...settings, [name]: Number(value) });
    } else {
      setSettings({ ...settings, [name]: value });
    }
  };

  const handleToggle = (name: keyof StrategySettings) => {
    setSettings({ ...settings, [name]: !settings[name] });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div className="bg-[#0D0D0D] p-6 rounded-lg border border-[#222]">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center">
          <span className="w-6 h-6 rounded bg-blue-600/20 text-blue-500 flex items-center justify-center mr-3 text-xs">1</span>
          Strategy Parameters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase text-white/40 font-bold tracking-widest">Index Universe</label>
            <select name="indexUniverse" value={settings.indexUniverse} onChange={handleChange} className="w-full p-2.5 bg-black/40 border border-[#222] rounded text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors">
              <option>Nifty 100 (recommended)</option>
              <option>Nifty 50 (safest)</option>
              <option>Nifty 200 (broader)</option>
              <option>Nifty Midcap 150</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase text-white/40 font-bold tracking-widest">Max Debt-to-Equity</label>
            <select name="maxDebtToEquity" value={settings.maxDebtToEquity} onChange={handleChange} className="w-full p-2.5 bg-black/40 border border-[#222] rounded text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors">
              <option>Less than 1</option>
              <option>Less than 0.5</option>
              <option>Less than 2</option>
              <option>Any</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase text-white/40 font-bold tracking-widest">Delivery Avg Lookback</label>
            <select name="lookbackDays" value={settings.lookbackDays} onChange={handleChange} className="w-full p-2.5 bg-black/40 border border-[#222] rounded text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors">
              <option value={30}>30 days (standard)</option>
              <option value={20}>20 days (faster)</option>
              <option value={50}>50 days (smoother)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase text-white/40 font-bold tracking-widest">Delivery Spike Threshold</label>
            <select name="spikeThreshold" value={settings.spikeThreshold} onChange={handleChange} className="w-full p-2.5 bg-black/40 border border-[#222] rounded text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors">
              <option value={1.5}>1.5x - 50% above avg</option>
              <option value={2}>2x - 100% above avg</option>
              <option value={1.3}>1.3x - 30% above avg</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase text-white/40 font-bold tracking-widest">Entry Timeframe</label>
            <select name="entryTimeframe" value={settings.entryTimeframe} onChange={handleChange} className="w-full p-2.5 bg-black/40 border border-[#222] rounded text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors">
              <option>15-min or 1-hour</option>
              <option>Daily candle close</option>
              <option>1-hour only</option>
              <option>15-min only</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase text-white/40 font-bold tracking-widest">Risk-Reward Target</label>
            <select name="riskReward" value={settings.riskReward} onChange={handleChange} className="w-full p-2.5 bg-black/40 border border-[#222] rounded text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors">
              <option>1:2 (balanced)</option>
              <option>1:1.5 (conservative)</option>
              <option>1:3 (aggressive)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase text-white/40 font-bold tracking-widest">Min Holding Days</label>
            <input type="number" name="minHolding" value={settings.minHolding} onChange={handleChange} className="w-full p-2.5 bg-black/40 border border-[#222] rounded text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors" />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase text-white/40 font-bold tracking-widest">Max Holding Days</label>
            <input type="number" name="maxHolding" value={settings.maxHolding} onChange={handleChange} className="w-full p-2.5 bg-black/40 border border-[#222] rounded text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-[10px] uppercase text-white/40 font-bold tracking-widest">Output Format</label>
            <select name="outputFormat" value={settings.outputFormat} onChange={handleChange} className="w-full p-2.5 bg-black/40 border border-[#222] rounded text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors">
              <option>Step-by-step guide (past + future)</option>
              <option>Python code</option>
              <option>Screener checklist</option>
              <option>Trade journal template</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#0D0D0D] p-6 rounded-lg border border-[#222]">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center">
          <span className="w-6 h-6 rounded bg-blue-600/20 text-blue-500 flex items-center justify-center mr-3 text-xs">2</span>
          Optional Enhancements
        </h2>
        
        <div className="space-y-4">
          <ToggleRow label="Require volume > 1.5x avg on breakout day" name="volConfirmation" checked={settings.volConfirmation} onToggle={() => handleToggle('volConfirmation')} />
          <ToggleRow label="Only trade stocks in bullish sectors (sectoral index > 20-day MA)" name="sectorMomentum" checked={settings.sectorMomentum} onToggle={() => handleToggle('sectorMomentum')} />
          <ToggleRow label="Only enter when Nifty 50 is above its 50-day MA" name="broadMarket" checked={settings.broadMarket} onToggle={() => handleToggle('broadMarket')} />
          <ToggleRow label="Avoid overbought stocks (RSI > 75) at entry" name="rsiFilter" checked={settings.rsiFilter} onToggle={() => handleToggle('rsiFilter')} />
          <ToggleRow label="Include Python code to fetch NSE delivery data" name="pythonScript" checked={settings.pythonScript} onToggle={() => handleToggle('pythonScript')} />
          <ToggleRow label="Include trailing stop-loss instructions" name="trailingStop" checked={settings.trailingStop} onToggle={() => handleToggle('trailingStop')} />
          <ToggleRow label="Book 50% at Target 1, ride rest to Target 2" name="partialExit" checked={settings.partialExit} onToggle={() => handleToggle('partialExit')} />
          <ToggleRow label="Identify next 2 resistance zones with exact price levels" name="futureResistance" checked={settings.futureResistance} onToggle={() => handleToggle('futureResistance')} />
        </div>
      </div>

      <div className="flex justify-end pt-4 gap-4">
        <button onClick={() => onSave()} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded font-bold text-sm tracking-widest uppercase transition-colors flex items-center">
          Analyse a stock with these settings
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </button>
      </div>
    </div>
  );
};

const ToggleRow = ({ label, checked, onToggle, name }: { label: string; checked: boolean; onToggle: () => void; name: string }) => (
  <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded transition-colors cursor-pointer border border-transparent hover:border-white/10" onClick={onToggle}>
    <span className="text-sm text-white select-none">{label}</span>
    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-[#333]'}`}>
      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
  </div>
);
