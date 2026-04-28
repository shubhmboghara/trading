import React, { useState, useEffect } from 'react';
import { SettingsTab } from './components/Settings';
import { AnalyserTab } from './components/Analyser';
import { ForensicsTab } from './components/ForensicsTab';
import { GlobalChatbot } from './components/GlobalChatbot';
import { StrategySettings } from './types';
import { Settings2, ToggleLeft, Bot, Activity, Scaling } from 'lucide-react';

const DEFAULT_SETTINGS: StrategySettings = {
  indexUniverse: 'Nifty 100 (recommended)',
  maxDebtToEquity: 'Less than 1',
  lookbackDays: 30,
  spikeThreshold: 1.5,
  entryTimeframe: '1-hour only',
  riskReward: '1:2 (balanced)',
  minHolding: 3,
  maxHolding: 14,
  outputFormat: 'Step-by-step guide (past + future)',
  volConfirmation: true,
  sectorMomentum: false,
  broadMarket: true,
  rsiFilter: false,
  pythonScript: true,
  trailingStop: true,
  partialExit: false,
  futureResistance: true,
};

export default function App() {
  const [settings, setSettings] = useState<StrategySettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'swing' | 'forensics'>('swing');

  useEffect(() => {
    const savedSettings = localStorage.getItem('swingTraderSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveSettings = (newSettings: StrategySettings) => {
    setSettings(newSettings);
    localStorage.setItem('swingTraderSettings', JSON.stringify(newSettings));
  };

  const handleSaveAndGo = () => {
    saveSettings(settings);
    setActiveTab('swing');
    // Trigger analysis in AnalyserTab by firing an event
    document.dispatchEvent(new CustomEvent('trigger-analysis'));
    setTimeout(() => {
      document.getElementById('analyser-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-[#E4E4E4] font-sans selection:bg-blue-900 selection:text-white">
      <header className="bg-[#0D0D0D] border-b border-white/10 sticky top-0 z-10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold">
              S
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight uppercase leading-none">Smart Money <span className="text-blue-500">Trader</span></h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('swing')}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${
                activeTab === 'swing' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-black/40 text-white/50 border border-white/10 hover:bg-white/5'
              }`}
            >
              <Activity size={14} /> Swing Strategy
            </button>
            <button
              onClick={() => setActiveTab('forensics')}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${
                activeTab === 'forensics' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-black/40 text-white/50 border border-white/10 hover:bg-white/5'
              }`}
            >
              <Scaling size={14} /> Forensic Analysis
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {activeTab === 'swing' ? (
          <>
            <SettingsTab 
              settings={settings} 
              setSettings={saveSettings} 
              onSave={handleSaveAndGo} 
            />
            <div id="analyser-section">
              <AnalyserTab settings={settings} />
            </div>
          </>
        ) : (
          <ForensicsTab />
        )}
      </main>
      
      <GlobalChatbot currentSettings={settings} />
    </div>
  );
}

