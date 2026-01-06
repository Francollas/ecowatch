
export interface ForestData {
  region: string;
  lossAreaHa: number;
  treesCut: number;
  treesCutPerDay: number; // Nova métrica solicitada
  co2LossTons: number;
  o2LostTons: number;
  fireAlerts: number;
  lastUpdate: string;
}

export interface EnvironmentalNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: 'Desmatamento' | 'Incêndios' | 'Clima' | 'Políticas';
}

export interface RainAnalysis {
  region: string;
  evapotranspirationIndex: number;
  estimatedRainfallContribution: number;
  status: 'Critical' | 'Warning' | 'Healthy';
}

export enum ViewMode {
  HOME = 'HOME',
  DASHBOARD = 'DASHBOARD',
  MAP = 'MAP',
  REPORTS = 'REPORTS',
  AI_ANALYST = 'AI_ANALYST'
}
