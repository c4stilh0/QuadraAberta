import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, CalendarPlus, AlertTriangle, Moon, Sun, ShieldCheck } from 'lucide-react';

// Coordenadas centrais de Sete Lagoas / MG
const SETE_LAGOAS_CENTER = [-19.4658, -44.2467];

// Mapeamento georreferenciado dos bairros populares de Sete Lagoas
const BAIRROS_COORDS = {
  'Belo Vale': [-19.4380, -44.2250],
  'Progresso': [-19.4520, -44.2380],
  'Montreal': [-19.4750, -44.2650],
  'Cidade de Deus': [-19.4290, -44.2180],
  'Verde Vale': [-19.4450, -44.2150],
  'Itapuã': [-19.4610, -44.2580],
  'Esperança': [-19.4420, -44.2350],
  'Centro': [-19.4620, -44.2450],
  'Canaã': [-19.4550, -44.2500],
  'Carmo': [-19.4680, -44.2400],
  'Santa Luzia': [-19.4580, -44.2320],
  'Vapabuçu': [-19.4710, -44.2520],
};

// Gera coordenadas geográficas reais da quadra ou mapeia determinístico pelo bairro
function getQuadraCoords(quadra) {
  if (quadra.latitude && quadra.longitude) {
    return [Number(quadra.latitude), Number(quadra.longitude)];
  }
  if (BAIRROS_COORDS[quadra.bairro]) {
    // Pequeno deslocamento se houver múltiplas quadras no mesmo bairro
    const offsetLat = ((quadra.id * 7) % 10 - 5) * 0.0012;
    const offsetLng = ((quadra.id * 11) % 10 - 5) * 0.0012;
    return [
      BAIRROS_COORDS[quadra.bairro][0] + offsetLat,
      BAIRROS_COORDS[quadra.bairro][1] + offsetLng,
    ];
  }
  // Coordenadas padrão em torno do centro de Sete Lagoas
  const idNum = Number(quadra.id) || 1;
  const lat = SETE_LAGOAS_CENTER[0] + (((idNum * 13) % 20 - 10) * 0.003);
  const lng = SETE_LAGOAS_CENTER[1] + (((idNum * 19) % 20 - 10) * 0.003);
  return [lat, lng];
}

export default function MapaQuadras({ quadras, onReservar, onVerChamados }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [quadraSelecionada, setQuadraSelecionada] = useState(null);

  // Inicialização única do mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Cria instância do mapa
    const map = L.map(mapContainerRef.current, {
      center: SETE_LAGOAS_CENTER,
      zoom: 13,
      zoomControl: false,
    });

    // Controle de zoom no canto superior direito
    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap oficial (100% livre de chaves de API)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Camada de marcadores
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Força recálculo das dimensões do Leaflet após montagem no DOM
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Atualiza marcadores quando a lista de quadras mudar
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    quadras.forEach((q) => {
      const coords = getQuadraCoords(q);
      const isDisponivel = q.status === 'DISPONIVEL';
      const isManutencao = q.status === 'EM_MANUTENCAO';

      const corFundo = isDisponivel
        ? 'bg-emerald-500 shadow-glow'
        : isManutencao
        ? 'bg-amber-500 shadow-glow-amber'
        : 'bg-rose-500';

      const pulso = isDisponivel
        ? '<span class="absolute -inset-1 rounded-full bg-emerald-400/40 animate-ping"></span>'
        : '';

      // Ícone HTML estilizado com Tailwind
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
            ${pulso}
            <div class="relative w-8 h-8 rounded-full ${corFundo} text-slate-950 flex items-center justify-center font-bold text-xs border-2 border-slate-900 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m4.93 4.93 4.24 4.24"></path>
                <path d="m14.83 9.17 4.24-4.24"></path>
                <path d="m14.83 14.83 4.24 4.24"></path>
                <path d="m9.17 14.83-4.24 4.24"></path>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(layer);

      // Conteúdo do Popup interativo
      const statusLabel = isDisponivel
        ? '<span style="color:#34d399;font-weight:700">● Disponível</span>'
        : isManutencao
        ? '<span style="color:#fbbf24;font-weight:700">● Em Manutenção</span>'
        : '<span style="color:#f87171;font-weight:700">● Interditada</span>';

      const iluminacaoText = q.possuiIluminacao ? '🌙 Iluminação Noturna' : '☀️ Apenas Diurno';

      const popupHtml = `
        <div style="min-width:210px;font-family:inherit;padding:6px 2px;">
          <div style="font-size:10px;text-transform:uppercase;color:#94a3b8;margin-bottom:2px;">${statusLabel}</div>
          <h4 style="font-size:14px;font-weight:700;color:#ffffff;margin:0 0 4px 0;">${q.nome}</h4>
          <p style="font-size:11px;color:#94a3b8;margin:0 0 4px 0;">📍 ${q.bairro} — ${q.logradouro}</p>
          ${q.modalidades ? `<div style="font-size:10px;color:#38bdf8;font-weight:600;margin-bottom:6px;text-transform:uppercase;">⚡ ${q.modalidades}</div>` : ''}
          <div style="display:flex;gap:4px;margin-bottom:10px;font-size:10px;color:#cbd5e1;flex-wrap:wrap;">
            <span style="background:rgba(30,41,59,0.8);padding:2px 6px;border-radius:6px;">${q.tipoPiso}</span>
            <span style="background:rgba(30,41,59,0.8);padding:2px 6px;border-radius:6px;">${iluminacaoText}</span>
          </div>
          <button
            id="btn-reservar-${q.id}"
            style="width:100%;background:#059669;color:#ffffff;border:none;padding:7px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;"
            ${!isDisponivel ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}
          >
            📅 Agendar Partida
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      // Evento ao abrir popup: conecta clique do botão interno
      marker.on('popupopen', () => {
        setQuadraSelecionada(q);
        const btn = document.getElementById(`btn-reservar-${q.id}`);
        if (btn) {
          btn.onclick = () => onReservar(q);
        }
      });
    });

    // Se houver quadras filtradas, ajusta visualização para a primeira
    if (quadras.length === 1) {
      const singleCoords = getQuadraCoords(quadras[0]);
      map.flyTo(singleCoords, 15, { duration: 1 });
    }
  }, [quadras, onReservar]);

  const centralizarSeteLagoas = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(SETE_LAGOAS_CENTER, 13, { duration: 1.2 });
      setQuadraSelecionada(null);
    }
  };

  const selecionarQuadraLista = (q) => {
    setQuadraSelecionada(q);
    const coords = getQuadraCoords(q);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, 16, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden glass-panel border border-slate-800 shadow-2xl">
      
      {/* Barra de controle superior */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <button
          onClick={centralizarSeteLagoas}
          className="glass-panel hover:bg-slate-800/90 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg border border-slate-700 transition-all hover:scale-105"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Centralizar Sete Lagoas</span>
        </button>

        <span className="glass-panel text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-700 font-medium">
          Exibindo <strong className="text-emerald-400">{quadras.length}</strong> {quadras.length === 1 ? 'quadra' : 'quadras'}
        </span>
      </div>

      {/* Container Leaflet do Mapa */}
      <div ref={mapContainerRef} className="w-full h-[580px] z-10 dark-map-tiles" />

      {/* Legenda de Status inferior esquerda */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1.5 shadow-xl hidden sm:block">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
          Legenda do Mapa:
        </span>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow"></span>
          <span>Disponível para Partida</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-glow-amber"></span>
          <span>Em Manutenção</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Interditada</span>
        </div>
      </div>

      {/* Drawer lateral de seleção rápida de quadra */}
      <div className="absolute top-4 right-4 bottom-4 z-20 w-72 glass-panel rounded-2xl p-4 border border-slate-700/80 shadow-2xl flex flex-col justify-between hidden lg:flex pointer-events-auto">
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quadras em Sete Lagoas</span>
          </h4>
          
          <div className="overflow-y-auto max-h-[380px] space-y-2 pr-1">
            {quadras.map((q) => {
              const selecionada = quadraSelecionada?.id === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => selecionarQuadraLista(q)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selecionada
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="font-bold truncate text-slate-200">{q.nome}</div>
                  {q.modalidades && (
                    <div className="text-[10px] text-sky-400 font-medium truncate">{q.modalidades}</div>
                  )}
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                    <span>{q.bairro}</span>
                    <span className={q.status === 'DISPONIVEL' ? 'text-emerald-400' : 'text-amber-400'}>
                      ● {q.status === 'DISPONIVEL' ? 'Livre' : 'Ocupada'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {quadraSelecionada && (
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => onReservar(quadraSelecionada)}
              disabled={quadraSelecionada.status !== 'DISPONIVEL'}
              className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all flex items-center justify-center space-x-1 disabled:opacity-40"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Agendar Selecionada</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
