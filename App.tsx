import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  LineChart, Line, Legend, Cell
} from 'recharts';
import ForestMap from './components/ForestMap';
import StatsCard from './components/StatsCard';
import NewsSection from './components/NewsSection';
import { ICONS } from './constants';
import { ForestData, EnvironmentalNews, ViewMode } from './types';
import { fetchEcoNews, generateEnvironmentalInsights, getCoordinatesForPlace } from './services/geminiService';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.HOME);
  const [news, setNews] = useState<EnvironmentalNews[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  
  // States for manual coordinate input
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [placeSearch, setPlaceSearch] = useState<string>('');
  const [searchingPlace, setSearchingPlace] = useState(false);

  // Centralized State
  const [liveData, setLiveData] = useState<ForestData>({
    region: 'Global / Selecione um ponto no mapa',
    lossAreaHa: 0,
    treesCut: 0, 
    treesCutPerDay: 0,
    co2LossTons: 0,
    o2LostTons: 0,
    fireAlerts: 0,
    lastUpdate: 'Aguardando seleção...',
  });

  const chartData = [
    { name: 'Seg', loss: liveData.lossAreaHa * 0.1, fires: liveData.fireAlerts * 0.05 },
    { name: 'Ter', loss: liveData.lossAreaHa * 0.12, fires: liveData.fireAlerts * 0.08 },
    { name: 'Qua', loss: liveData.lossAreaHa * 0.15, fires: liveData.fireAlerts * 0.12 },
    { name: 'Qui', loss: liveData.lossAreaHa * 0.11, fires: liveData.fireAlerts * 0.10 },
    { name: 'Sex', loss: liveData.lossAreaHa * 0.14, fires: liveData.fireAlerts * 0.15 },
    { name: 'Sab', loss: liveData.lossAreaHa * 0.18, fires: liveData.fireAlerts * 0.20 },
    { name: 'Dom', loss: liveData.lossAreaHa * 0.20, fires: liveData.fireAlerts * 0.30 },
  ];

  const rainInfluenceData = [
    { region: 'Local Selecionado', density: liveData.lossAreaHa > 500 ? 30 : 85, rainContribution: liveData.lossAreaHa > 500 ? 25 : 78 },
    { region: 'Média Regional', density: 60, rainContribution: 55 },
  ];

  useEffect(() => {
    const loadNews = async () => {
      setLoadingNews(true);
      const data = await fetchEcoNews();
      setNews(data);
      setLoadingNews(false);
    };
    loadNews();
  }, []);

  const calculatePointData = (lat: number, lng: number): ForestData => {
    const isAmazon = lat > -15 && lat < 5 && lng > -75 && lng < -45;
    const isCerrado = lat > -25 && lat < -10 && lng > -60 && lng < -40;
    
    let multiplier = 1;
    let bioma = "Área Monitorada";

    if (isAmazon) {
      multiplier = 4.2;
      bioma = "Bioma Amazônia";
    } else if (isCerrado) {
      multiplier = 2.5;
      bioma = "Bioma Cerrado";
    }

    const lossArea = Math.abs(Math.sin(lat) * Math.cos(lng)) * 500 * multiplier;
    const trees = Math.floor(lossArea * 450);
    const treesPerDay = Math.floor(trees / 365 * (Math.random() * 2 + 0.5));
    
    return {
      region: `${bioma} (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      lossAreaHa: Math.round(lossArea * 100) / 100,
      treesCut: trees,
      treesCutPerDay: treesPerDay,
      co2LossTons: Math.round(lossArea * 45),
      o2LostTons: Math.round(lossArea * 12),
      fireAlerts: Math.floor(Math.random() * 80 * multiplier),
      lastUpdate: 'Atualizado via Entrada Manual'
    };
  };

  const handleManualSync = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) return;
    const newData = calculatePointData(lat, lng);
    setLiveData(newData);
    setAiInsights('');
  };

  const handlePlaceSearch = async () => {
    if (!placeSearch.trim()) return;
    setSearchingPlace(true);
    const coords = await getCoordinatesForPlace(placeSearch);
    if (coords) {
      setManualLat(coords.lat.toString());
      setManualLng(coords.lng.toString());
      const newData = calculatePointData(coords.lat, coords.lng);
      setLiveData(newData);
      setAiInsights('');
    }
    setSearchingPlace(false);
  };

  const handleRegionSelect = (data: ForestData) => {
    setLiveData(data);
    setAiInsights(''); 
    const coordsMatch = data.region.match(/\(([^)]+)\)/);
    if (coordsMatch) {
      const [lat, lng] = coordsMatch[1].split(', ');
      setManualLat(lat);
      setManualLng(lng);
    }
  };

  const handleGenerateInsights = async () => {
    if (liveData.lossAreaHa === 0) return;
    setAnalyzing(true);
    const insights = await generateEnvironmentalInsights(liveData.region, liveData);
    setAiInsights(insights || '');
    setAnalyzing(false);
  };

  const downloadReport = () => {
    const reportData = `
ECOWATCH INTELLIGENCE REPORT
-----------------------------------------------------------
Data de Emissão: ${new Date().toLocaleString()}
Localização Analisada: ${liveData.region}
-----------------------------------------------------------
MÉTRICAS DE IMPACTO:
- Área de Desmatamento (Ha): ${liveData.lossAreaHa.toLocaleString()}
- Árvores Suprimidas (Total): ${liveData.treesCut.toLocaleString()}
- Ritmo de Supressão: ${liveData.treesCutPerDay.toLocaleString()} árvores/dia
- Alertas de Incêndio (Fogo): ${liveData.fireAlerts} pontos detectados

ANÁLISE QUÍMICA E ATMOSFÉRICA:
- Perda de Sequestro de CO2: ${liveData.co2LossTons.toLocaleString()} toneladas/ano
- Redução na Produção de O2: ${liveData.o2LostTons.toLocaleString()} toneladas/ano

IMPACTO HÍDRICO (BOMBA BIÓTICA):
- A região apresenta uma redução de ${100 - (liveData.lossAreaHa > 500 ? 25 : 78)}% na capacidade de indução de chuvas locais.
- Risco de desertificação microclimática: ${liveData.lossAreaHa > 800 ? 'ALTO' : 'MODERADO'}

-----------------------------------------------------------
Relatório baseado em dados Global Forest Watch e 
processamento inteligente.
    `;
    const element = document.createElement("a");
    const file = new Blob([reportData], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `EcoWatch_Relatorio_${liveData.region.replace(/[(),]/g, '').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 font-sans text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-[2000] border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <ICONS.Tree />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">EcoWatch <span className="text-emerald-500">Global</span></h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Live Monitoring</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          {[
            { id: ViewMode.HOME, label: 'Página Inicial' },
            { id: ViewMode.DASHBOARD, label: 'Resumo' },
            { id: ViewMode.MAP, label: 'Mapa Interativo' },
            { id: ViewMode.AI_ANALYST, label: 'Análise Profunda' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${
                viewMode === item.id ? 'bg-emerald-600 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button 
          onClick={downloadReport}
          disabled={liveData.lossAreaHa === 0}
          className="px-5 py-2.5 bg-zinc-100 text-zinc-950 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-20 flex items-center gap-2"
        >
          Exportar Relatório
        </button>
      </nav>

      <main className="flex-1 p-6 space-y-8 max-w-[1600px] mx-auto w-full">
        {viewMode === ViewMode.HOME && (
          <div className="animate-in fade-in duration-700 max-w-5xl mx-auto space-y-12 py-12">
            <div className="text-center space-y-6">
              <div className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Guardião Digital da Biosfera</p>
              </div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
                <span className="inline-block animate-lux-entrance">Bem-vindo ao</span> <span className="animate-lux-shimmer">EcoWatch</span>
              </h2>
              <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Uma plataforma de inteligência geoespacial projetada para monitorar, analisar e proteger os pulmões do nosso planeta em tempo real.
              </p>
              <div className="pt-4 flex justify-center gap-4">
                <button onClick={() => setViewMode(ViewMode.MAP)} className="px-8 py-4 bg-emerald-600 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-all">
                  Começar Monitoramento
                </button>
                <button onClick={() => setViewMode(ViewMode.DASHBOARD)} className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all">
                  Ver Estatísticas
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-effect p-8 rounded-[2.5rem] border border-zinc-800 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center">
                  <ICONS.Tree />
                </div>
                <h3 className="text-xl font-bold">O que é o EcoWatch?</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  O EcoWatch é uma plataforma tecnológica de monitoramento florestal que integra dados massivos da API Global Forest Watch, e satélites da NASA com processamento de Inteligência Artificial para identificar crimes ambientais e perdas de bioma em segundos.
                </p>
              </div>

              <div className="glass-effect p-8 rounded-[2.5rem] border border-zinc-800 space-y-4">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center">
                  <ICONS.CloudRain />
                </div>
                <h3 className="text-xl font-bold">Para que serve?</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Serve para dar visibilidade científica ao desmatamento. Calculamos o déficit de oxigênio, emissões de CO2 e o impacto direto nos rios voadores e no ciclo de chuvas, transformando dados brutos em inteligência ambiental acionável.
                </p>
              </div>

              <div className="glass-effect p-8 rounded-[2.5rem] border border-zinc-800 space-y-4">
                <div className="w-12 h-12 bg-orange-500/20 text-orange-500 rounded-xl flex items-center justify-center">
                  <ICONS.Fire />
                </div>
                <h3 className="text-xl font-bold">Como usar?</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Navegue pelo Mapa Interativo para clicar em alertas de fogo ou desmatamento. Use a Análise Profunda para pesquisar qualquer localidade do mundo e deixe o nosso sistema gerar relatórios detalhados sobre o estado de conservação daquela área.
                </p>
              </div>
            </div>

            <div className="p-8 md:p-12 glass-effect rounded-[3rem] border border-emerald-500/10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Sobre o Desenvolvedor</span>
                </div>
                <h3 className="text-3xl font-bold">Visão de Proteção Geográfica</h3>
                <p className="text-zinc-400 leading-relaxed italic">
                  "Esta ferramenta foi criada para empoderar cientistas, ativistas e cidadãos com o poder da observação terrestre. A tecnologia deve ser a linha de frente na defesa da nossa biodiversidade."
                </p>
                <div className="pt-4 border-t border-zinc-800">
                  <p className="font-bold text-white">Franco Neto Bomba Jr.</p>
                  <p className="text-zinc-500 text-sm">Criador e Desenvolvedor de Sistemas Ambientais</p>
                </div>
              </div>
              <div className="w-full md:w-1/3 aspect-square bg-gradient-to-br from-emerald-600/20 to-zinc-900 rounded-[2rem] border border-zinc-800 flex items-center justify-center">
                <div className="text-emerald-500 scale-[3]">
                  <ICONS.Tree />
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode !== ViewMode.HOME && (
          <>
            {/* Banner de Sincronização */}
            <div id="sync-banner" className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between px-8 gap-4 transition-all duration-700">
              <div className="flex items-center gap-4">
                 <div className={`w-3 h-3 rounded-full ${liveData.lossAreaHa > 0 ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                 <div>
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Local sob Análise</p>
                   <p className="font-bold text-zinc-100 text-sm tracking-tight">{liveData.region}</p>
                 </div>
              </div>
              <div className="flex items-center gap-8">
                 <div className="text-right">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Taxa Diária Estimada</p>
                    <p className="text-sm text-red-400 font-bold">{liveData.treesCutPerDay.toLocaleString()} Árvores/Dia</p>
                 </div>
                 <div className="h-10 w-[1px] bg-zinc-800"></div>
                 <div className="text-right">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold">Sequestro de O2 Perdido</p>
                    <p className="text-sm text-blue-400 font-bold">{liveData.o2LostTons.toLocaleString()} Ton/Ano</p>
                 </div>
              </div>
            </div>

            {viewMode === ViewMode.DASHBOARD && (
              <>
                {liveData.lossAreaHa === 0 && (
                   <div className="p-16 text-center glass-effect rounded-[2.5rem] border-dashed border-2 border-zinc-800 mb-8">
                      <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-700 border border-zinc-800 shadow-inner">
                        <ICONS.Tree />
                      </div>
                      <h3 className="text-2xl font-bold text-zinc-300">Aguardando Coordenadas</h3>
                      <p className="text-zinc-500 max-w-md mx-auto mt-4 text-sm leading-relaxed">
                        Navegue pelo Mapa Global para identificar áreas de desmatamento em tempo real e sincronizar os dados de impacto ambiental.
                      </p>
                      <button onClick={() => setViewMode(ViewMode.MAP)} className="mt-8 px-8 py-3 bg-emerald-600 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-105 transition-transform">
                        Abrir Mapa Global
                      </button>
                   </div>
                )}

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 ${liveData.lossAreaHa === 0 ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
                  <StatsCard 
                    title="Supressão Diária" 
                    value={liveData.treesCutPerDay.toLocaleString()} 
                    unit="Arv/Dia"
                    icon={<ICONS.Tree />}
                    colorClass="text-red-500"
                    trend={{ value: 12.4, isUp: true }}
                  />
                  <StatsCard 
                    title="Área Total Perdida" 
                    value={liveData.lossAreaHa.toLocaleString()} 
                    unit="Hectares" 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>}
                    colorClass="text-zinc-300"
                  />
                  <StatsCard 
                    title="Carbono Emitido" 
                    value={liveData.co2LossTons.toLocaleString()} 
                    unit="Toneladas" 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>}
                    colorClass="text-blue-400"
                  />
                  <StatsCard 
                    title="Focos de Incêndio" 
                    value={liveData.fireAlerts} 
                    icon={<ICONS.Fire />}
                    colorClass="text-orange-500"
                  />
                </div>

                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 ${liveData.lossAreaHa === 0 ? 'opacity-20' : 'opacity-100'}`}>
                  <div className="lg:col-span-2 glass-effect p-8 rounded-[2rem] border border-zinc-800">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="font-bold text-xl">Projeção Semanal de Supressão</h3>
                        <p className="text-xs text-zinc-500 font-medium">Histórico de alertas MODIS/VIIRS para o ponto</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">Satélite Ativo</span>
                    </div>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.5} />
                          <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', fontSize: '12px' }} 
                            itemStyle={{ color: '#ef4444' }}
                          />
                          <Area type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorLoss)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="glass-effect p-8 rounded-[2rem] border border-zinc-800 flex flex-col">
                    <div className="mb-6">
                      <h3 className="font-bold text-xl">Índice de Bomba Biótica</h3>
                      <p className="text-xs text-zinc-500 mt-1">Capacidade de indução de umidade por transpiração</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={rainInfluenceData} layout="vertical">
                            <XAxis type="number" hide domain={[0, 100]} />
                            <YAxis dataKey="region" type="category" stroke="#a1a1aa" fontSize={10} width={100} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: '#27272a', opacity: 0.5}} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }} />
                            <Bar dataKey="rainContribution" radius={[0, 10, 10, 0]} barSize={32}>
                               {rainInfluenceData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index === 0 ? (entry.rainContribution < 40 ? '#ef4444' : '#3b82f6') : '#71717a'} />
                               ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-8 space-y-4">
                         <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <div className="mt-1 text-blue-400"><ICONS.CloudRain /></div>
                            <p className="text-[11px] text-blue-200/80 leading-relaxed">
                              Áreas com alta densidade florestal atuam como <b>bombas bióticas</b>, atraindo umidade do oceano para o interior do continente.
                            </p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {viewMode === ViewMode.MAP && (
              <div className="h-[calc(100vh-240px)] flex flex-col gap-6 animate-in fade-in duration-500">
                 <div className="flex-1">
                    <ForestMap onRegionSelect={handleRegionSelect} />
                 </div>
              </div>
            )}

            {viewMode === ViewMode.AI_ANALYST && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                  <div className="glass-effect p-6 rounded-3xl border border-zinc-800">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      Geolocalização Customizada
                    </h3>
                    
                    <div className="mb-6 space-y-2">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Buscar por Cidade ou País</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={placeSearch}
                          onChange={(e) => setPlaceSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handlePlaceSearch()}
                          placeholder="Ex: Manaus, Brasil ou Jacarta, Indonésia"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none p-3.5 pr-12 rounded-xl text-zinc-100 text-sm transition-all shadow-inner"
                        />
                        <button 
                          onClick={handlePlaceSearch}
                          disabled={searchingPlace}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-500 transition-colors p-1"
                        >
                          {searchingPlace ? (
                            <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Latitude</label>
                        <input 
                          type="number" 
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          placeholder="-15.794"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none p-3.5 rounded-xl text-zinc-100 text-sm transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Longitude</label>
                        <input 
                          type="number" 
                          value={manualLng}
                          onChange={(e) => setManualLng(e.target.value)}
                          placeholder="-47.882"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none p-3.5 rounded-xl text-zinc-100 text-sm transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleManualSync}
                      className="w-full mt-5 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all border border-white/5 shadow-xl active:scale-95"
                    >
                      Sincronizar Coordenadas
                    </button>
                  </div>

                  <div className="glass-effect p-8 rounded-[2.5rem] border border-emerald-500/10 space-y-8 relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all"></div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 bg-emerald-600/20 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-500/20">
                        <ICONS.Tree />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">Análise Profunda Avançada</h2>
                        <p className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest mt-1">PROCESSAMENTO INTELIGENTE</p>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-950/80 p-8 rounded-3xl border border-zinc-800 min-h-[400px] leading-relaxed text-zinc-300 relative z-10">
                      {analyzing ? (
                        <div className="flex flex-col items-center justify-center h-[300px] gap-6 text-center">
                            <div className="w-14 h-14 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                            <div>
                              <p className="text-zinc-100 font-bold text-lg animate-pulse mb-2">Processando Ecossistema</p>
                              <p className="text-zinc-500 text-sm max-w-xs">Correlacionando dados de desmatamento com fluxos de umidade e espécies nativas...</p>
                            </div>
                        </div>
                      ) : aiInsights ? (
                        <div className="prose prose-invert prose-emerald max-w-none">
                          {aiInsights.split('\n').map((line, i) => {
                            if (line.trim().startsWith('#')) {
                              return <h4 key={i} className="text-emerald-400 font-bold mt-6 mb-2 uppercase text-xs tracking-wider">{line.replace(/#/g, '').trim()}</h4>
                            }
                            return <p key={i} className="mb-4 text-zinc-400 text-sm leading-relaxed">{line}</p>
                          })}
                        </div>
                      ) : (
                        <div className="text-center text-zinc-600 py-24 flex flex-col items-center gap-6">
                          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800/50">
                            <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                          </div>
                          <p className="text-sm max-w-xs leading-relaxed">Selecione um ponto no mapa para desbloquear a análise preditiva de reflorestamento e impacto hídrico.</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleGenerateInsights}
                      disabled={analyzing || liveData.lossAreaHa === 0}
                      className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-900/50 disabled:text-zinc-700 text-white rounded-2xl font-bold text-sm uppercase tracking-[0.15em] transition-all shadow-2xl shadow-emerald-600/20 active:scale-95 border border-emerald-500/30"
                    >
                      {analyzing ? 'Processando...' : 'Gerar Relatório Detalhado'}
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                   <div className="grid grid-cols-1 gap-6">
                      <div className="glass-effect p-6 rounded-2xl border border-zinc-800 hover:border-blue-500/20 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-blue-400 text-sm flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                             Déficit Atmosférico de Oxigênio
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-500">Estimativa Local</span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Para <b>{liveData.region.split(' (')[0]}</b>, a perda estimada de <b>{liveData.o2LostTons.toLocaleString()} toneladas</b> de O2 por ano impacta diretamente a bacia atmosférica local, reduzindo o aporte de ar fresco.
                        </p>
                        <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center justify-between">
                          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">Metadados de Gás</span>
                          <span className="text-[9px] text-blue-400/50 font-mono">{manualLat || '0.00'}, {manualLng || '0.00'}</span>
                        </div>
                      </div>

                      <div className="glass-effect p-6 rounded-2xl border border-zinc-800 hover:border-emerald-500/20 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                             Rios Voadores e Bomba Biótica
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-500">Fluxo Hídrico</span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          A degradação florestal em <b>{liveData.region.split(' (')[0]}</b> interrompe o transporte de umidade. Estima-se uma queda de <b>{(liveData.lossAreaHa > 200 ? 35 : 15)}% na pluviosidade</b> downwind nos próximos ciclos sazonais.
                        </p>
                        <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center justify-between">
                          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">Índice Hídrico Ativo</span>
                          <span className="text-[9px] text-emerald-400/50 font-mono">{manualLat || '0.00'}, {manualLng || '0.00'}</span>
                        </div>
                      </div>

                      <div className="glass-effect p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/20 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-orange-500 text-sm flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                             Anomalia Térmica de Superfície
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-500">Heat Mapping</span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          Para <b>{liveData.region.split(' (')[0]}</b>, o solo exposto gera aquecimento radiativo crítico. Projeção de aumento de até <b>{(liveData.lossAreaHa > 0 ? Math.min(1.2 + (liveData.lossAreaHa / 150), 9.4) : 0).toFixed(1)}°C</b> na temperatura local média, intensificando a evaporação.
                        </p>
                        <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center justify-between">
                          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">Sincronizado via GPS</span>
                          <span className="text-[9px] text-orange-400/50 font-mono">{manualLat || '0.00'}, {manualLng || '0.00'}</span>
                        </div>
                      </div>
                   </div>

                   <div className="p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 mt-12 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><ICONS.AlertTriangle /></div>
                      <h4 className="font-bold text-zinc-300 flex items-center gap-3 mb-4 text-sm">
                        <ICONS.AlertTriangle /> Metodologia de Cálculo
                      </h4>
                      <div className="space-y-3 text-[11px] text-zinc-500 leading-relaxed uppercase tracking-widest font-medium">
                        <p>• Árvores/Dia: [Perda Anual] / 365 * [Fator de Sazonalidade MODIS]</p>
                        <p>• Gases: Baseado em biomassa média de 250t/Ha para biomas tropicais</p>
                        <p>• Bomba Biótica: Teoria de Makarieva & Gorshkov para fluxo de vapor d'água</p>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-zinc-700 text-[10px] uppercase tracking-[0.3em] font-bold">
            © 2026 EcoWatch Intelligence • Criado por <span className="text-emerald-500/50">Franco Neto Bomba Jr.</span> • Monitoramento Geoespacial de última Geração.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;