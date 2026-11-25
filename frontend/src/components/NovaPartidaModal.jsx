import React, { useState } from 'react';
import { X, Sparkles, MapPin, Users, Clock, AlertCircle, CheckCircle, Navigation, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';

export const ESPORTES_CONFIG = {
  FUTSAL: { label: 'Futsal', quorumMin: 10, quorumMax: 14, icon: '⚽', desc: 'Quadra poliesportiva cimento/taco' },
  BASQUETE: { label: 'Basquete', quorumMin: 6, quorumMax: 10, icon: '🏀', desc: 'Aros e tabelas oficiais ou 3x3' },
  VOLEI: { label: 'Vôlei', quorumMin: 8, quorumMax: 12, icon: '🏐', desc: 'Rede e demarcações comunitárias' },
  BEACH_TENNIS: { label: 'Beach Tennis', quorumMin: 4, quorumMax: 4, icon: '🏖️', desc: 'Quadra de areia' },
  FUTEBOL_CAMPO: { label: 'Futebol de Campo', quorumMin: 14, quorumMax: 22, icon: '🥅', desc: 'Grama natural ou terrão' },
  TENIS: { label: 'Tênis', quorumMin: 2, quorumMax: 4, icon: '🎾', desc: 'Simples ou duplas' },
  OUTRO: { label: 'Outro Esporte', quorumMin: 4, quorumMax: 10, icon: '🎯', desc: 'Atividade física coletiva' },
};

export const BAIRROS_SETE_LAGOAS = [
  'Belo Vale',
  'Progresso',
  'Montreal',
  'Centro',
  'Canaã',
  'Cidade de Deus',
  'Verde Vale',
  'Itapuã',
  'Esperança',
  'Boa Vista',
  'Carmo',
  'Santa Luzia',
  'Vapabuçu',
  'São João',
  'Interlagos',
  'Manôa',
  'Santa Rosa'
];

export const BAIRROS_COORDS = {
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
  'Boa Vista': [-19.4670, -44.2550],
  'São João': [-19.4590, -44.2390],
  'Interlagos': [-19.4490, -44.2290],
  'Manôa': [-19.4410, -44.2210],
  'Santa Rosa': [-19.4630, -44.2600],
};

export default function NovaPartidaModal({ onClose, onSuccess }) {
  const [esporte, setEsporte] = useState('FUTSAL');
  const [titulo, setTitulo] = useState('Pelada Comunitária de Futsal');
  const [quorumMinimo, setQuorumMinimo] = useState(ESPORTES_CONFIG.FUTSAL.quorumMin);
  const [quorumMaximo, setQuorumMaximo] = useState(ESPORTES_CONFIG.FUTSAL.quorumMax);
  
  // Data e hora padrão: amanhã às 19:00
  const defaultDataHora = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    // Formato YYYY-MM-DDTHH:mm
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [dataHoraPartida, setDataHoraPartida] = useState(defaultDataHora);
  const [duracaoMinutos, setDuracaoMinutos] = useState(90);
  const [bairro, setBairro] = useState('Progresso');
  const [descricao, setDescricao] = useState('');
  const [coordenadasGps, setCoordenadasGps] = useState(null);
  const [obtendoGps, setObtendoGps] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const handleMudarEsporte = (novoEsporte) => {
    setEsporte(novoEsporte);
    const cfg = ESPORTES_CONFIG[novoEsporte];
    setQuorumMinimo(cfg.quorumMin);
    setQuorumMaximo(cfg.quorumMax);
    setTitulo(`Partida de ${cfg.label} em Sete Lagoas`);
  };

  const handleObterGps = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocalização não suportada no seu navegador.');
      return;
    }
    setObtendoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordenadasGps([pos.coords.latitude, pos.coords.longitude]);
        setObtendoGps(false);
      },
      (err) => {
        setObtendoGps(false);
        alert('Não foi possível obter sua localização GPS. Usaremos as coordenadas de referência do seu bairro.');
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    // Determina latitude e longitude do criador
    let lat = null;
    let lng = null;
    if (coordenadasGps) {
      lat = coordenadasGps[0];
      lng = coordenadasGps[1];
    } else if (BAIRROS_COORDS[bairro]) {
      lat = BAIRROS_COORDS[bairro][0];
      lng = BAIRROS_COORDS[bairro][1];
    } else {
      lat = -19.4658;
      lng = -44.2467;
    }

    try {
      setLoading(true);
      let parsedDate;
      try {
        parsedDate = new Date(dataHoraPartida);
        if (isNaN(parsedDate.getTime())) {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          d.setHours(19, 0, 0, 0);
          parsedDate = d;
        }
      } catch {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(19, 0, 0, 0);
        parsedDate = d;
      }

      const pad = (n) => String(n).padStart(2, '0');
      const dataHoraLocal = `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth() + 1)}-${pad(parsedDate.getDate())}T${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}:00`;

      await api.partidas.criar({
        esporte,
        dataHora: dataHoraLocal,
        duracaoMinutos: Number(duracaoMinutos),
        minJogadores: Number(quorumMinimo),
        maxJogadores: Number(quorumMaximo),
        descricao: descricao.trim() ? `${titulo}: ${descricao.trim()}` : titulo,
        bairro,
        latitude: lat,
        longitude: lng,
      });

      setSucesso(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err) {
      setErro(err.message || 'Erro ao criar partida.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-7 border border-slate-700 shadow-2xl relative my-8">
        
        {/* Botão Fechar */}
        <button
          id="btn-fechar-nova-partida"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Matchmaking Inteligente de Sete Lagoas</span>
          </div>
          <h2 className="text-2xl font-black text-white">Criar Nova Partida Aberta</h2>
          <p className="text-xs text-slate-400 mt-1">
            Defina o esporte e horário. Conforme outros jogadores confirmarem presença, nosso algoritmo calculará o <strong>centróide geográfico do grupo</strong> e sugerirá as <strong>3 melhores quadras públicas</strong> para você escolher!
          </p>
        </div>

        {erro && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 font-bold animate-fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Partida criada com sucesso! Carregando as 3 melhores quadras de Sete Lagoas...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Seletor de Modalidade Esportiva */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              1. Selecione a Modalidade Esportiva
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(ESPORTES_CONFIG).map(([key, item]) => {
                const selecionado = esporte === key;
                return (
                  <button
                    key={key}
                    id={`btn-modalidade-${key.toLowerCase()}`}
                    type="button"
                    onClick={() => handleMudarEsporte(key)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col items-center text-center ${
                      selecionado
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-glow'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-xs font-bold leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{item.quorumMin}-{item.quorumMax} jogadores</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título da Partida */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              2. Título da Partida
            </label>
            <input
              id="input-partida-titulo"
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Pelada dos Amigos do Progresso"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Data, Horário e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                3. Data e Horário Previsto
              </label>
              <input
                id="input-partida-datahora"
                type="datetime-local"
                required
                value={dataHoraPartida}
                onChange={(e) => setDataHoraPartida(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Duração Estimada
              </label>
              <select
                id="select-partida-duracao"
                value={duracaoMinutos}
                onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value={60}>60 minutos (1 hora)</option>
                <option value={90}>90 minutos (1h 30m) - Recomendado</option>
                <option value={120}>120 minutos (2 horas - Limite)</option>
              </select>
            </div>
          </div>

          {/* Quórum Recomendado por Modalidade */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quórum da Sala ({ESPORTES_CONFIG[esporte].label})</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                Sugestão Automática Ajustável
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Quórum Mínimo (Necessário para jogo)
                </label>
                <input
                  type="number"
                  min="2"
                  max="30"
                  required
                  value={quorumMinimo}
                  onChange={(e) => setQuorumMinimo(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Quórum Máximo (Capacidade do grupo)
                </label>
                <input
                  type="number"
                  min={quorumMinimo}
                  max="40"
                  required
                  value={quorumMaximo}
                  onChange={(e) => setQuorumMaximo(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Seu Bairro e Localização do Criador */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              4. Seu Bairro de Saída (Para cálculo do Centróide)
            </label>
            <div className="flex gap-2">
              <select
                id="select-partida-bairro"
                value={bairro}
                onChange={(e) => {
                  setBairro(e.target.value);
                  setCoordenadasGps(null); // reseta gps explícito ao mudar bairro
                }}
                className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {BAIRROS_SETE_LAGOAS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleObterGps}
                disabled={obtendoGps}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
                  coordenadasGps
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Capturar coordenadas reais do GPS do seu dispositivo"
              >
                <Navigation className={`w-3.5 h-3.5 ${obtendoGps ? 'animate-spin' : ''}`} />
                <span>{coordenadasGps ? 'GPS Ativo ✓' : 'Usar GPS'}</span>
              </button>
            </div>
            
            {/* Aviso de Privacidade */}
            <p className="text-[11px] text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Privacidade garantida:</strong> Ao criar a sala, apenas o seu bairro é divulgado. Suas coordenadas exatas nunca são exibidas.
              </span>
            </p>
          </div>

          {/* Descrição Adicional */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Observações / Nível (Opcional)
            </label>
            <textarea
              id="input-partida-descricao"
              rows="2"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Jogo amador e descontraído, temos 2 bolas. Tragam colete se tiverem."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              id="btn-criar-partida-submit"
              type="submit"
              disabled={loading || sucesso}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Criando Partida...' : 'Criar Partida e Calcular Centróide'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
