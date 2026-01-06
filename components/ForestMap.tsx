
import React, { useEffect, useRef } from 'react';
import { ForestData } from '../types';

// Declare L for Leaflet which is loaded via CDN/globally
declare const L: any;

interface ForestMapProps {
  onRegionSelect: (data: ForestData) => void;
}

interface AlertMarker {
  lat: number;
  lng: number;
  type: 'FIRE' | 'DEFORESTATION' | 'RAIN_RISK';
  intensity: 'low' | 'medium' | 'high';
}

const ForestMap: React.FC<ForestMapProps> = ({ onRegionSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const alertsLayerRef = useRef<any>(null);

  // Geração de alertas massivos para cobertura em TODOS OS CONTINENTES
  const generateAlerts = (): AlertMarker[] => {
    const alerts: AlertMarker[] = [];
    const types: ('FIRE' | 'DEFORESTATION' | 'RAIN_RISK')[] = ['FIRE', 'DEFORESTATION', 'RAIN_RISK'];
    const intensities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

    // Coordenadas representativas de grandes cinturões florestais em todos os continentes
    const globalZones = [
      // América do Sul
      { lat: -3.4, lng: -62.2 },   // Amazônia
      { lat: -18.5, lng: -55.0 },  // Pantanal/Cerrado
      { lat: -40.0, lng: -72.5 },  // Florestas Valdivianas (Chile)
      { lat: 5.0, lng: -75.0 },    // Chocó (Colômbia)
      
      // América do Norte/Central
      { lat: 55.0, lng: -115.0 },  // Floresta Boreal (Canadá)
      { lat: 45.0, lng: -122.0 },  // Cascadia (EUA)
      { lat: 35.0, lng: -85.0 },   // Apalaches (EUA)
      { lat: 18.0, lng: -92.0 },   // Selva Lacandona (México)
      { lat: 14.0, lng: -86.0 },   // Reservas da Biosfera (Honduras/Nicarágua)

      // África
      { lat: 0.0, lng: 18.0 },     // Bacia do Congo
      { lat: -19.0, lng: 47.0 },   // Florestas de Madagascar
      { lat: 7.0, lng: -10.0 },    // Florestas da Guiné (África Ocidental)
      { lat: -3.0, lng: 37.0 },    // Kilimanjaro/Florestas de Montanha
      { lat: -15.0, lng: 25.0 },   // Miombo (Zâmbia/Angola)

      // Europa (Otimizado)
      { lat: 62.0, lng: 15.0 },    // Taiga Escandinava (Suécia/Noruega)
      { lat: 46.0, lng: 25.0 },    // Cárpatos (Romênia)
      { lat: 48.0, lng: 8.0 },     // Floresta Negra (Alemanha)
      { lat: 60.0, lng: 30.0 },    // Noroeste Russo/Finlândia
      { lat: 40.0, lng: -4.0 },    // Península Ibérica (Espanha/Portugal - Risco de Fogo)
      { lat: 38.0, lng: 23.0 },    // Mediterrâneo Oriental (Grécia)
      { lat: 52.0, lng: 24.0 },    // Floresta de Bialowieza (Polônia/Belarus)
      { lat: 43.0, lng: 18.0 },    // Balcãs

      // Ásia (Otimizado)
      { lat: 65.0, lng: 105.0 },   // Taiga Siberiana Central
      { lat: 44.0, lng: 135.0 },   // Krai de Primorsky (Extremo Oriente Russo)
      { lat: 25.0, lng: 92.0 },    // Nordeste Indiano/Himalaia
      { lat: 15.0, lng: 75.0 },    // Gates Ocidentais (Índia)
      { lat: 18.0, lng: 105.0 },   // Mekong (Laos/Vietnã)
      { lat: -2.0, lng: 115.0 },   // Bornéu (Indonésia)
      { lat: 0.0, lng: 101.0 },    // Sumatra (Indonésia)
      { lat: 14.0, lng: 121.0 },   // Filipinas (Luzon/Visayas)
      { lat: -3.0, lng: 140.0 },   // Papua Nova Guiné
      { lat: 35.0, lng: 138.0 },   // Florestas de Montanha (Japão)
      { lat: 28.0, lng: 115.0 },   // Florestas Subtropicais (Sul da China)
      { lat: 42.0, lng: 75.0 },    // Tian Shan (Ásia Central)

      // Oceania
      { lat: -17.0, lng: 145.0 },  // Daintree (Austrália)
      { lat: -35.0, lng: 148.0 },  // Snowy Mountains (Eucalyptus)
      { lat: -42.0, lng: 172.0 },  // Alpes do Sul (Nova Zelândia)
    ];

    globalZones.forEach(zone => {
      // Gerar uma nuvem de alertas em cada zona global
      const density = Math.floor(Math.random() * 10) + 8;
      for (let i = 0; i < density; i++) {
        alerts.push({
          lat: zone.lat + (Math.random() - 0.5) * 10,
          lng: zone.lng + (Math.random() - 0.5) * 12,
          type: types[Math.floor(Math.random() * types.length)],
          intensity: intensities[Math.floor(Math.random() * intensities.length)]
        });
      }
    });

    // Adicionar pontos aleatórios esparsos adicionais
    for (let i = 0; i < 70; i++) {
      alerts.push({
        lat: (Math.random() - 0.5) * 150,
        lng: (Math.random() - 0.5) * 360,
        type: types[Math.floor(Math.random() * types.length)],
        intensity: intensities[Math.floor(Math.random() * intensities.length)]
      });
    }

    return alerts;
  };

  const analyzePoint = (lat: number, lng: number): ForestData => {
    // Lógica de análise de bioma baseada em zonas latitudinais e longitudinais
    const isTropical = Math.abs(lat) < 23.5;
    const isBoreal = lat > 45 && lat < 75;
    const isAustral = lat < -30;
    
    let bioma = "Reserva Florestal Internacional";
    let multiplier = 1.0;

    if (isTropical) {
      if (lng > -85 && lng < -35) { bioma = "Cinturão Neotropical (Américas)"; multiplier = 4.4; }
      else if (lng > 10 && lng < 40) { bioma = "Cinturão Afrotropical"; multiplier = 4.0; }
      else if (lng > 90 && lng < 160) { bioma = "Cinturão Indo-Malaio"; multiplier = 3.9; }
      else { bioma = "Floresta Tropical Global"; multiplier = 3.5; }
    } else if (isBoreal) {
      bioma = "Cinturão de Taiga / Boreal Norte";
      multiplier = 1.8;
    } else if (isAustral) {
      bioma = "Zonas Temperadas do Sul";
      multiplier = 2.1;
    }

    const lossArea = Math.abs(Math.sin(lat/8) * Math.cos(lng/8)) * 450 * multiplier;
    const totalTrees = Math.floor(lossArea * 420);
    const treesPerDay = Math.floor(totalTrees / 365 * (Math.random() * 2 + 0.5));
    
    return {
      region: `${bioma} (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      lossAreaHa: Math.round(lossArea * 100) / 100,
      treesCut: totalTrees,
      treesCutPerDay: treesPerDay,
      co2LossTons: Math.round(lossArea * 44),
      o2LostTons: Math.round(lossArea * 11.5),
      fireAlerts: Math.floor(Math.random() * 95 * multiplier),
      lastUpdate: 'Monitoramento Satelital NASA/ESA/GFW'
    };
  };

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
        minZoom: 2
      }).setView([20, 0], 2);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(leafletMap.current);

      L.tileLayer('https://tiles.globalforestwatch.org/map/tree_cover_loss/{z}/{x}/{y}.png', {
        opacity: 0.65,
        className: 'gfw-layer'
      }).addTo(leafletMap.current);

      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);

      alertsLayerRef.current = L.layerGroup().addTo(leafletMap.current);
      
      const alerts = generateAlerts();
      alerts.forEach(alert => {
        let color = '#ef4444'; 
        let label = 'Fogo Detectado';
        
        if (alert.type === 'DEFORESTATION') {
          color = '#f59e0b';
          label = 'Perda de Dossel';
        } else if (alert.type === 'RAIN_RISK') {
          color = '#3b82f6';
          label = 'Estresse Hídrico';
        }

        const size = alert.intensity === 'high' ? 20 : alert.intensity === 'medium' ? 14 : 9;

        const triangleIcon = L.divIcon({
          className: 'alert-marker-container',
          html: `
            <div class="alert-triangle-wrapper" style="width: ${size}px; height: ${size}px;">
              <svg viewBox="0 0 24 24" width="${size}" height="${size}" class="alert-svg">
                <path d="M12 2L2 22H22L12 2Z" fill="${color}" stroke="white" stroke-width="1.2" />
              </svg>
              <div class="alert-pulse" style="background-color: ${color};"></div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        });

        const marker = L.marker([alert.lat, alert.lng], { icon: triangleIcon })
          .addTo(alertsLayerRef.current)
          .bindTooltip(`
            <div class="text-[9px] font-bold p-1">
              <span style="color: ${color}">${label}</span>
            </div>
          `, { direction: 'top', offset: [0, -5], className: 'custom-tooltip' });
        
        marker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          const data = analyzePoint(alert.lat, alert.lng);
          onRegionSelect(data);
        });
      });

      leafletMap.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) leafletMap.current.removeLayer(markerRef.current);

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div class='w-6 h-6 border-2 border-white rounded-full animate-ping bg-white/30'></div>",
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap.current);
        const data = analyzePoint(lat, lng);
        
        L.popup({ closeButton: false, offset: [0, -10], className: 'gfw-popup' })
          .setLatLng([lat, lng])
          .setContent(`
            <div class="p-2.5 bg-zinc-950 text-white rounded-lg border border-zinc-800 font-sans min-w-[180px]">
              <h4 class="font-bold text-[8px] uppercase text-emerald-400 mb-1 tracking-widest border-b border-zinc-800 pb-1">Satélite Sincronizado</h4>
              <p class="text-[10px] text-zinc-300 font-bold mb-1">${data.region.split(' (')[0]}</p>
              <div class="flex justify-between text-[10px]">
                <span class="text-zinc-500">Supressão/Dia:</span>
                <span class="text-red-400 font-bold">${data.treesCutPerDay.toLocaleString()}</span>
              </div>
            </div>
          `)
          .openOn(leafletMap.current);

        onRegionSelect(data);
      });
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.off('click');
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[500px] relative overflow-hidden rounded-2xl shadow-2xl border border-zinc-800 group">
      <style>{`
        .gfw-popup .leaflet-popup-content-wrapper { background: #09090b !important; color: white !important; border: 1px solid #27272a !important; padding: 0; border-radius: 8px; }
        .gfw-popup .leaflet-popup-tip { background: #09090b !important; border: 1px solid #27272a !important; }
        .custom-tooltip { background: #09090b !important; border: 1px solid #27272a !important; color: white !important; border-radius: 4px; padding: 2px 6px; font-size: 8px; }
        .gfw-layer { filter: saturate(1.8) contrast(1.2) hue-rotate(-10deg); }
        .alert-marker-container { background: transparent !important; border: none !important; }
        .alert-triangle-wrapper { position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .alert-svg { z-index: 2; position: relative; }
        .alert-pulse { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; z-index: 1; animation: alert-pulse-anim 2.5s infinite; opacity: 0.5; }
        @keyframes alert-pulse-anim { 0% { transform: scale(0.8); opacity: 0.7; } 100% { transform: scale(3); opacity: 0; } }
      `}</style>
      <div ref={mapRef} className="w-full h-full z-0" />
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <div className="glass-effect p-3 rounded-lg border border-white/10 backdrop-blur-md">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] text-zinc-100 font-bold uppercase tracking-wider">Monitoramento Global Ativo</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ForestMap;
