export interface StrategySettings {
  indexUniverse: string;
  maxDebtToEquity: string;
  lookbackDays: number;
  spikeThreshold: number;
  entryTimeframe: string;
  riskReward: string;
  minHolding: number;
  maxHolding: number;
  outputFormat: string;
  volConfirmation: boolean;
  sectorMomentum: boolean;
  broadMarket: boolean;
  rsiFilter: boolean;
  pythonScript: boolean;
  trailingStop: boolean;
  partialExit: boolean;
  futureResistance: boolean;
}

export interface AnalysisSectionData {
  pastData: string;
  futureProjection: string;
}

export interface ForensicAnalysisData {
  ticker: string;
  businessQualityScore: number;
  cashFlowAssessment: string;
  solvencyRisk: string;
  marginTrend: string;
  forensicRedFlags: string[];
  fundamentalStrengths: string[];
  intrinsicValueEstimate: string;
  finalVerdict: string;
  thoughtProcess?: string;
}

export interface AnalysisData {
  thoughtProcess?: string;
  // PAST DATA
  spikeDate: string;
  avgDelivery30d: string;
  spikeDayDelivery: string;
  spikeStrength: string;
  battleZoneHigh: number;
  battleZoneLow: number;
  breakoutStatus: string;
  historicalSuccessRate: string;

  // CONFIDENCE METRICS (NEW)
  trendAlignment: string;
  institutionalActivity: string;
  keySupport: number;
  keyResistance: number;
  sectorOutlook: string;
  suggestedTicker: string;
  recentPrices: number[];

  // FUTURE PROJECTION
  entryTriggerPrice: number;
  stopLossPrice: number;
  riskPerShare: number;
  target1: number;
  target2: number;
  estimatedDaysT1: string;
  estimatedDaysT2: string;
  setupScore: number;
  actionRecommendation: string;
}

export interface HistoryItem {
  ticker: string;
  date: string;
}
