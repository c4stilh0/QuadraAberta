import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, CalendarPlus, Wrench, Crosshair, Sparkles, PlusCircle, Users, Trophy } from 'lucide-react';
import { BAIRROS_COORDS } from './NovaPartidaModal';

// Coordenadas centrais de Sete Lagoas / MG
const SETE_LAGOAS_CENTER = [-19.4658, -44.2467];

const ESPORTE_ICONS = {
  FUTSAL: '⚽',
  BASQUETE: '🏀',
  VOLEI: '🏐',
  BEACH_TENNIS: '🏖️',
  FUTEBOL_CAMPO: '🥅',
  TENIS: '🎾',
  OUTRO: '🎯'
};

// Gera coordenadas geográficas reais da quadra ou mapeia determinístico pelo bairro
function getQuadraCoords(quadra) {
  if (quadra.latitude && quadra.longitude) {
    return [Number(quadra.latitude), Number(quadra.longitude)];
  }
  if (BAIRROS_COORDS[quadra.bairro]) {
    const offsetLat = ((quadra.id * 7) % 10 - 5) * 0.0012;
    const offsetLng = ((quadra.id * 11) % 10 - 5) * 0.0012;
    return [
      BAIRROS_COORDS[quadra.bairro][0] + offsetLat,
      BAIRROS_COORDS[quadra.bairro][1] + offsetLng,
    ];
  }
  const idNum = Number(quadra.id) || 1;
  const lat = SETE_LAGOAS_CENTER[0] + (((idNum * 13) % 20 - 10) * 0.003);
  const lng = SETE_LAGOAS_CENTER[1] + (((idNum * 19) % 20 - 10) * 0.003);
  return [lat, lng];
}

// Gera coordenadas do centróide ou bairro do criador da partida
function getPartidaCoords(partida) {
  const lat = partida.centroideLat || partida.latitudeCentroide;
  const lng = partida.centroideLng || partida.longitudeCentroide;
  if (lat && lng) {
    return [Number(lat), Number(lng)];
  }
  const bairro = partida.bairroCriador || partida.criadorBairro;
  if (bairro && BAIRROS_COORDS[bairro]) {
    return BAIRROS_COORDS[bairro];
  }
  return SETE_LAGOAS_CENTER;
}

// Fórmula de Haversine para cálculo de distância em km
function calcularDistanciaKm(coord1, coord2) {
  if (!coord1 || !coord2) return null;
  const R = 6371; // Raio da Terra em km
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLon = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[0] * Math.PI) / 180) *
      Math.cos((coord2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`;
}

export default function MapaQuadras({ 
  quadras = [], 
  partidas = [],
  onReservar, 
  onVerChamados,
  onSelecionarPartida,
  onCriarPartida
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const partidasLayerRef = useRef(null);
  const userLocationLayerRef = useRef(null);

  const [quadraSelecionada, setQuadraSelecionada] = useState(null);
  const [partidaSelecionada, setPartidaSelecionada] = useState(null);
  const [abaLateral, setAbaLateral] = useState('partidas'); // 'partidas' | 'quadras'
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Inicialização do mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: SETE_LAGOAS_CENTER,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Camada de quadras públicas
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Camada de partidas abertas e centróides
    const partidasLayer = L.layerGroup().addTo(map);
    partidasLayerRef.current = partidasLayer;

    // Camada de localização do usuário
    const userLocationLayer = L.layerGroup().addTo(map);
    userLocationLayerRef.current = userLocationLayer;

    mapInstanceRef.current = map;

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

  // Busca localização do usuário
  useEffect(() => {
    obterLocalizacaoUsuario(false);
  }, []);

  const obterLocalizacaoUsuario = (centralizar = false) => {
    if (!('geolocation' in navigator)) return;

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setLoadingLocation(false);

        if (centralizar && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(coords, 15, { duration: 1.2 });
        }
      },
      (err) => {
        setLoadingLocation(false);
        console.warn('Geolocalização não concedida:', err.message);
        if (centralizar) {
          alert('Não foi possível obter sua localização. Verifique as permissões de localização do seu navegador.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Renderiza marcador de localização do usuário
  useEffect(() => {
    const layer = userLocationLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (userLocation) {
      L.circle(userLocation, {
        radius: 250,
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 6',
      }).addTo(layer);

      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 cursor-pointer">
            <span class="absolute -inset-2 rounded-full bg-sky-400/40 animate-ping"></span>
            <span class="absolute -inset-1 rounded-full bg-sky-500/30"></span>
            <div class="relative w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center border-2 border-white shadow-lg shadow-sky-500/60">
              <div class="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });

      const userMarker = L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 }).addTo(layer);
      userMarker.bindPopup(`
        <div style="min-width:180px;font-family:inherit;padding:4px;text-align:center;">
          <div style="font-size:10px;text-transform:uppercase;font-weight:700;color:#38bdf8;margin-bottom:2px;">📍 Você está aqui</div>
          <h4 style="font-size:13px;font-weight:700;color:#ffffff;margin:0 0 2px 0;">Sua Posição Atual</h4>
          <p style="font-size:10px;color:#94a3b8;margin:0;">Localização georreferenciada do morador</p>
        </div>
      `);
    }
  }, [userLocation]);

  // Renderiza MARCADORES DAS PARTIDAS ABERTAS (Centróides / Bairros)
  useEffect(() => {
    const layer = partidasLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    partidas.forEach((p) => {
      const coords = getPartidaCoords(p);
      const isDefinida = p.status === 'QUADRA_DEFINIDA';
      const iconSport = ESPORTE_ICONS[p.esporte] || '⚽';

      // Círculo de centróide se houver mais de 1 participante
      if (p.totalParticipantes > 1) {
        L.circle(coords, {
          radius: 400,
          color: isDefinida ? '#10b981' : '#a855f7',
          fillColor: isDefinida ? '#10b981' : '#a855f7',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '5, 5'
        }).addTo(layer);
      }

      const marcadorHtml = `
        <div class="relative flex items-center justify-center w-10 h-10 cursor-pointer group">
          <span class="absolute -inset-1 rounded-full ${isDefinida ? 'bg-emerald-400/40' : 'bg-purple-400/40'} animate-ping"></span>
          <div class="relative w-9 h-9 rounded-2xl ${
            isDefinida 
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 border-2 border-emerald-300' 
              : 'bg-gradient-to-tr from-purple-600 to-indigo-500 border-2 border-purple-300'
          } text-white flex items-center justify-center text-sm shadow-xl shadow-purple-950/60 font-bold transform transition-transform hover:scale-110">
            ${iconSport}
          </div>
        </div>
      `;

      const partidaIcon = L.divIcon({
        className: 'partida-leaflet-marker',
        html: marcadorHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });

      const marker = L.marker(coords, { icon: partidaIcon, zIndexOffset: 500 }).addTo(layer);

      const rawData = p.dataHora || p.dataHoraPartida || new Date().toISOString();
      const horaFormatada = new Date(rawData).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const diaFormatado = new Date(rawData).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      });

      const distTexto = userLocation ? calcularDistanciaKm(userLocation, coords) : null;
      const distBadge = distTexto
        ? `<span style="background:rgba(168,85,247,0.2);color:#c084fc;border:1px solid rgba(168,85,247,0.4);padding:2px 6px;border-radius:6px;font-size:10px;font-weight:700;">⚡ a ${distTexto} de você</span>`
        : '';

      const totalParts = p.totalParticipantes ?? (p.participantes?.length || 1);
      const minJog = p.minJogadores || p.quorumMinimo || 10;
      const bairroCriador = p.bairroCriador || p.criadorBairro || 'Sete Lagoas';
      const bairroExib = p.bairroExibicao || `Centróide de ${totalParts} Moradores`;
      const quadraNome = (p.quadraEscolhida?.nome) || (p.quadraDefinida?.nome);
      const tituloPartida = p.titulo || p.descricao || `Partida de ${p.esporte}`;

      const localLabel = totalParts <= 1
        ? `📍 Bairro do Criador: <strong>${bairroCriador}</strong>`
        : `🌐 Centróide do Grupo: <strong>${bairroExib}</strong>`;

      const popupHtml = `
        <div style="min-width:230px;font-family:inherit;padding:6px 2px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:10px;text-transform:uppercase;font-weight:800;color:${isDefinida ? '#34d399' : '#c084fc'};">
              ${isDefinida ? '🏆 Quadra Definida' : '🔥 Partida Aberta'}
            </span>
            ${distBadge}
          </div>
          <h4 style="font-size:14px;font-weight:800;color:#ffffff;margin:2px 0 4px 0;">${tituloPartida}</h4>
          <p style="font-size:11px;color:#94a3b8;margin:0 0 6px 0;">${localLabel}</p>
          <div style="font-size:11px;color:#cbd5e1;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
            <span>📅 ${diaFormatado} às ${horaFormatada}</span>
            <span>•</span>
            <span style="color:#38bdf8;font-weight:700;">👥 ${totalParts}/${minJog} jog.</span>
          </div>
          ${quadraNome ? `<div style="font-size:11px;color:#34d399;font-weight:700;margin-bottom:8px;">Quadra: ${quadraNome}</div>` : ''}
          <button
            id="btn-ver-partida-${p.id}"
            style="width:100%;background:linear-gradient(to right, #9333ea, #6366f1);color:#ffffff;border:none;padding:8px;border-radius:10px;font-size:11px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"
          >
            🎯 Ver 3 Quadras Sugeridas & Entrar
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        setPartidaSelecionada(p);
        const btn = document.getElementById(`btn-ver-partida-${p.id}`);
        if (btn && onSelecionarPartida) {
          btn.onclick = () => onSelecionarPartida(p);
        }
      });
    });
  }, [partidas, userLocation, onSelecionarPartida]);

  // Renderiza QUADRAS PÚBLICAS
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;

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

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center w-7 h-7 cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
            <div class="relative w-6 h-6 rounded-full ${corFundo} text-slate-950 flex items-center justify-center font-bold text-xs border-2 border-slate-900 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(layer);

      const statusLabel = isDisponivel
        ? '<span style="color:#34d399;font-weight:700">● Disponível</span>'
        : isManutencao
        ? '<span style="color:#fbbf24;font-weight:700">● Manutenção</span>'
        : '<span style="color:#f87171;font-weight:700">● Interditada</span>';

      const distTexto = userLocation ? calcularDistanciaKm(userLocation, coords) : null;
      const distBadge = distTexto
        ? `<span style="background:rgba(14,165,233,0.15);color:#38bdf8;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600;">⚡ a ${distTexto}</span>`
        : '';

      const popupHtml = `
        <div style="min-width:210px;font-family:inherit;padding:6px 2px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
            <span style="font-size:10px;text-transform:uppercase;">${statusLabel}</span>
            ${distBadge}
          </div>
          <h4 style="font-size:13px;font-weight:700;color:#ffffff;margin:2px 0 4px 0;">${q.nome}</h4>
          <p style="font-size:11px;color:#94a3b8;margin:0 0 4px 0;">📍 ${q.bairro} — ${q.logradouro}</p>
          ${q.modalidades ? `<div style="font-size:10px;color:#38bdf8;font-weight:600;margin-bottom:6px;">⚡ ${q.modalidades}</div>` : ''}
          <button
            id="btn-reservar-${q.id}"
            style="width:100%;background:#059669;color:#ffffff;border:none;padding:6px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;"
            ${!isDisponivel ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}
          >
            📅 Ver Espaço
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        setQuadraSelecionada(q);
        const btn = document.getElementById(`btn-reservar-${q.id}`);
        if (btn && onReservar) {
          btn.onclick = () => onReservar(q);
        }
      });
    });
  }, [quadras, userLocation, onReservar]);

  const centralizarSeteLagoas = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(SETE_LAGOAS_CENTER, 13, { duration: 1.2 });
    }
  };

  const selecionarPartidaItem = (p) => {
    setPartidaSelecionada(p);
    const coords = getPartidaCoords(p);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, 15, { duration: 1 });
    }
    onSelecionarPartida?.(p);
  };

  const selecionarQuadraItem = (q) => {
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
          <span>Visão Geral Sete Lagoas</span>
        </button>

        <button
          onClick={() => obterLocalizacaoUsuario(true)}
          disabled={loadingLocation}
          className="glass-panel hover:bg-slate-800/90 text-sky-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg border border-sky-500/30 transition-all hover:scale-105 hover:border-sky-500/60"
          title="Centralizar na minha localização atual"
        >
          <Crosshair className={`w-3.5 h-3.5 text-sky-400 ${loadingLocation ? 'animate-spin' : ''}`} />
          <span>{loadingLocation ? 'Localizando...' : 'Meu GPS'}</span>
        </button>

        {onCriarPartida && (
          <button
            onClick={onCriarPartida}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-glow transition-all flex items-center space-x-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Criar Partida</span>
          </button>
        )}

        <span className="glass-panel text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-700 font-medium">
          <strong className="text-purple-400">{partidas.length}</strong> partidas • <strong className="text-emerald-400">{quadras.length}</strong> quadras
        </span>
      </div>

      {/* Container Leaflet do Mapa */}
      <div ref={mapContainerRef} className="w-full h-[620px] z-10 dark-map-tiles" />

      {/* Legenda de Status inferior esquerda */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1.5 shadow-xl hidden sm:block">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
          Legenda do Mapa:
        </span>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-white"></span>
          <span className="font-semibold text-purple-300">Partida Aberta (Centróide)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow"></span>
          <span className="font-semibold text-emerald-300">Partida com Quadra Definida</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white"></span>
          <span>Sua Posição Atual (GPS)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
          <span className="text-slate-400">Quadras Públicas de Apoio</span>
        </div>
      </div>

      {/* Drawer lateral para seleção rápida no mapa */}
      <div className="absolute top-4 right-4 bottom-4 z-20 w-72 glass-panel rounded-2xl p-4 border border-slate-700/80 shadow-2xl flex flex-col justify-between hidden lg:flex pointer-events-auto">
        <div>
          {/* Alternador de abas no drawer */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-3">
            <button
              onClick={() => setAbaLateral('partidas')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                abaLateral === 'partidas'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Partidas ({partidas.length})
            </button>
            <button
              onClick={() => setAbaLateral('quadras')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                abaLateral === 'quadras'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quadras ({quadras.length})
            </button>
          </div>

          {/* Lista de Partidas no Drawer */}
          {abaLateral === 'partidas' && (
            <div className="overflow-y-auto max-h-[440px] space-y-2 pr-1">
              {partidas.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Nenhuma partida aberta no momento. Crie a primeira!
                </div>
              ) : (
                partidas.map((p) => {
                  const selecionada = partidaSelecionada?.id === p.id;
                  const coords = getPartidaCoords(p);
                  const dist = userLocation ? calcularDistanciaKm(userLocation, coords) : null;
                  const iconSport = ESPORTE_ICONS[p.esporte] || '⚽';

                  const totalParts = p.totalParticipantes ?? (p.participantes?.length || 1);
                  const minJog = p.minJogadores || p.quorumMinimo || 10;
                  const quadraNome = p.quadraEscolhida?.nome || p.quadraDefinida?.nome;
                  const tituloPartida = p.titulo || p.descricao || `Partida de ${p.esporte}`;
                  const bairroExib = p.bairroExibicao || p.bairroCriador || p.criadorBairro;

                  return (
                    <div
                      key={p.id}
                      onClick={() => selecionarPartidaItem(p)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selecionada
                          ? 'bg-purple-950/40 border-purple-500/60 text-white'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate text-white flex items-center space-x-1">
                          <span>{iconSport}</span>
                          <span className="truncate">{tituloPartida}</span>
                        </span>
                        {dist && (
                          <span className="text-[10px] font-bold text-purple-400 ml-1 shrink-0">
                            {dist}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                        <span className="truncate">📍 {bairroExib}</span>
                        <span className="text-sky-400 font-bold shrink-0 ml-1">
                          {totalParts}/{minJog} jog.
                        </span>
                      </div>

                      {quadraNome ? (
                        <div className="mt-1.5 text-[10px] text-emerald-300 font-semibold truncate flex items-center space-x-1">
                          <Trophy className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{quadraNome}</span>
                        </div>
                      ) : (
                        <div className="mt-1.5 text-[10px] text-amber-400 font-medium">
                          ✨ 3 quadras sugeridas
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Lista de Quadras no Drawer */}
          {abaLateral === 'quadras' && (
            <div className="overflow-y-auto max-h-[440px] space-y-2 pr-1">
              {quadras.map((q) => {
                const selecionada = quadraSelecionada?.id === q.id;
                const coords = getQuadraCoords(q);
                const dist = userLocation ? calcularDistanciaKm(userLocation, coords) : null;

                return (
                  <div
                    key={q.id}
                    onClick={() => selecionarQuadraItem(q)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selecionada
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold truncate text-slate-200">{q.nome}</div>
                      {dist && (
                        <span className="text-[10px] font-semibold text-sky-400 shrink-0 ml-1">
                          {dist}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                      <span>{q.bairro}</span>
                      <span className={q.status === 'DISPONIVEL' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                        ● {q.status === 'DISPONIVEL' ? 'Livre' : 'Ocupada'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ação rápida no drawer */}
        {abaLateral === 'partidas' && onCriarPartida && (
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={onCriarPartida}
              className="w-full py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-glow transition-all flex items-center justify-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Criar Nova Partida</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
