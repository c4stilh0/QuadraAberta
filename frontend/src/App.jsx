import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuadraCard from './components/QuadraCard';
import ReservaModal from './components/ReservaModal';
import TurmasList from './components/TurmasList';
import NovaTurmaModal from './components/NovaTurmaModal';
import ZeladoriaView from './components/ZeladoriaView';
import NovoChamadoModal from './components/NovoChamadoModal';
import NovaQuadraModal from './components/NovaQuadraModal';
import MapaQuadras from './components/MapaQuadras';
import AuthModal from './components/AuthModal';
import PerfilView from './components/PerfilView';
import NovaPartidaModal, { ESPORTES_CONFIG, BAIRROS_SETE_LAGOAS } from './components/NovaPartidaModal';
import PartidaDetalhesModal from './components/PartidaDetalhesModal';
import PartidaCard from './components/PartidaCard';
import { 
  api, getCurrentUser, isTokenExpired, triggerAutoLogout, setupTokenWatcher, stopTokenWatcher 
} from './api/client';
import { 
  Calendar, Trash2, AlertCircle, LayoutGrid, Map as MapIcon, 
  RefreshCw, CheckCircle2, PlusCircle, Users, Trophy, Sparkles, ChevronRight, Flame,
  AlertTriangle, X
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('quadras'); // 'quadras' funciona agora como Partidas & Matchmaking
  const [user, setUser] = useState(() => getCurrentUser());
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(null);
  
  // Estado das Quadras
  const [quadras, setQuadras] = useState([]);
  const [loadingQuadras, setLoadingQuadras] = useState(true);
  const [filtroBairro, setFiltroBairro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  
  // Estado do Matchmaking e Partidas
  const [partidas, setPartidas] = useState([]);
  const [loadingPartidas, setLoadingPartidas] = useState(true);
  const [minhasPartidas, setMinhasPartidas] = useState([]);
  const [filtroEsporte, setFiltroEsporte] = useState('');
  const [filtroStatusPartida, setFiltroStatusPartida] = useState('');
  
  // Modo de visualização: 'mapa' (padrão) | 'partidas' | 'quadras'
  const [modoVisualizacao, setModoVisualizacao] = useState('mapa');
  const [sincronizando, setSincronizando] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  // Minhas Reservas (legado/suporte)
  const [minhasReservas, setMinhasReservas] = useState([]);

  // Modais
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [reservaQuadra, setReservaQuadra] = useState(null);
  const [novoChamadoOpen, setNovoChamadoOpen] = useState(false);
  const [chamadoQuadraPre, setChamadoQuadraPre] = useState(null);
  const [novaTurmaOpen, setNovaTurmaOpen] = useState(false);
  const [novaQuadraOpen, setNovaQuadraOpen] = useState(false);
  const [novaPartidaOpen, setNovaPartidaOpen] = useState(false);
  const [partidaDetalhes, setPartidaDetalhes] = useState(null);

  // Carrega Quadras Públicas de Sete Lagoas
  const carregarQuadras = useCallback(async () => {
    try {
      setLoadingQuadras(true);
      const data = await api.quadras.listar({
        bairro: filtroBairro,
        status: filtroStatus,
      });
      setQuadras(data || []);
    } catch {
      // Falha silenciosa
    } finally {
      setLoadingQuadras(false);
    }
  }, [filtroBairro, filtroStatus]);

  // Carrega Partidas Abertas (Matchmaking)
  const carregarPartidas = useCallback(async () => {
    try {
      setLoadingPartidas(true);
      const data = await api.partidas.listar({
        status: filtroStatusPartida,
        esporte: filtroEsporte,
      });
      setPartidas(data || []);
    } catch (err) {
      console.warn('Erro ao carregar partidas abertas:', err);
    } finally {
      setLoadingPartidas(false);
    }
  }, [filtroStatusPartida, filtroEsporte]);

  // Carrega Minhas Partidas Confirmadas
  const carregarMinhasPartidas = useCallback(async () => {
    if (!user) {
      setMinhasPartidas([]);
      return;
    }
    try {
      const data = await api.partidas.minhas();
      setMinhasPartidas(data || []);
    } catch {
      // Ignora erro
    }
  }, [user]);

  const carregarMinhasReservas = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.reservas.listarMinhas();
      setMinhasReservas(data || []);
    } catch {
      // Ignora erro
    }
  }, [user]);

  useEffect(() => {
    carregarQuadras();
  }, [carregarQuadras]);

  useEffect(() => {
    carregarPartidas();
  }, [carregarPartidas]);

  useEffect(() => {
    if (user) {
      carregarMinhasPartidas();
      carregarMinhasReservas();
    }
  }, [user, carregarMinhasPartidas, carregarMinhasReservas]);

  // Monitora a expiração da sessão do usuário e efetua logout automático
  useEffect(() => {
    const handleSessionExpired = (event) => {
      const msg = event?.detail?.message || 'Sua sessão expirou. Você foi desconectado automaticamente.';
      setUser(null);
      setMinhasReservas([]);
      setMinhasPartidas([]);
      setActiveTab((prev) => (prev === 'perfil' ? 'quadras' : prev));
      setSessionExpiredMsg(msg);
      setTimeout(() => setSessionExpiredMsg(null), 10000);
    };

    window.addEventListener('quadraaberta:session-expired', handleSessionExpired);

    if (user) {
      setupTokenWatcher(() => {
        handleSessionExpired({
          detail: { message: 'Sua sessão expirou por segurança. Faça login novamente para continuar.' }
        });
      });

      const handleFocusOrVisibility = () => {
        if (isTokenExpired()) {
          triggerAutoLogout('Sua sessão expirou enquanto você estava fora. Faça login novamente.');
        }
      };

      window.addEventListener('focus', handleFocusOrVisibility);
      document.addEventListener('visibilitychange', handleFocusOrVisibility);

      return () => {
        window.removeEventListener('quadraaberta:session-expired', handleSessionExpired);
        window.removeEventListener('focus', handleFocusOrVisibility);
        document.removeEventListener('visibilitychange', handleFocusOrVisibility);
        stopTokenWatcher();
      };
    }

    return () => {
      window.removeEventListener('quadraaberta:session-expired', handleSessionExpired);
      stopTokenWatcher();
    };
  }, [user]);

  // Atualiza detalhes da partida ativa se aberta no modal
  const handleAtualizarPartidaAtiva = async () => {
    await carregarPartidas();
    await carregarMinhasPartidas();
    if (partidaDetalhes) {
      try {
        const atualizada = await api.partidas.buscarPorId(partidaDetalhes.id);
        setPartidaDetalhes(atualizada);
      } catch {
        setPartidaDetalhes(null);
      }
    }
  };

  const handleLogout = () => {
    stopTokenWatcher();
    api.auth.logout();
    setUser(null);
    setMinhasReservas([]);
    setMinhasPartidas([]);
    setSessionExpiredMsg(null);
    if (activeTab === 'perfil') {
      setActiveTab('quadras');
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('quadraaberta_user', JSON.stringify(updatedUser));
  };

  const handleCancelarReserva = async (reservaId) => {
    if (!window.confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      await api.reservas.cancelar(reservaId);
      await carregarMinhasReservas();
    } catch (err) {
      alert(err.message);
    }
  };

  const abrirReserva = (quadra) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setReservaQuadra(quadra);
  };

  const abrirChamadoParaQuadra = (quadra) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setChamadoQuadraPre(quadra);
    setNovoChamadoOpen(true);
  };

  const abrirCriarPartida = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setNovaPartidaOpen(true);
  };

  const abrirDetalhesPartida = async (partidaOuId) => {
    const id = typeof partidaOuId === 'object' ? partidaOuId.id : partidaOuId;
    try {
      const p = await api.partidas.buscarPorId(id);
      setPartidaDetalhes(p);
    } catch {
      if (typeof partidaOuId === 'object') {
        setPartidaDetalhes(partidaOuId);
      }
    }
  };

  const handleSincronizarOsm = async () => {
    try {
      setSincronizando(true);
      setSyncFeedback(null);
      const res = await api.quadras.sincronizarOsm();
      setSyncFeedback(res.mensagem || 'Espaços esportivos de Sete Lagoas sincronizados com sucesso!');
      await carregarQuadras();
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err) {
      setSyncFeedback(err.message || 'Erro ao sincronizar espaços esportivos.');
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setSincronizando(false);
    }
  };

  // Filtragem local de quadras se necessário
  const quadrasFiltradas = quadras.filter((q) => {
    if (!filtroModalidade || filtroModalidade === 'Todas') return true;
    const mods = (q.modalidades || '').toLowerCase();
    const filtro = filtroModalidade.toLowerCase();
    return mods.includes(filtro);
  });

  // Lista de modalidades para filtro rápido de quadras
  const modalidadesLista = [
    'Todas',
    'Futsal',
    'Futebol',
    'Basquete',
    'Skate',
    'Areia',
    'Tênis',
    'Atletismo'
  ];

  const bairrosAtalhos = ['Todos', ...BAIRROS_SETE_LAGOAS.slice(0, 8)];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenNovaQuadra={() => setNovaQuadraOpen(true)}
      />

      {/* Hero Banner apenas na aba de partidas & matchmaking */}
      {activeTab === 'quadras' && (
        <Hero onCriarPartida={abrirCriarPartida} />
      )}

      <main className="flex-1">
        {activeTab === 'quadras' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* MINHAS PARTIDAS CONFIRMADAS (Se autenticado) */}
            {user && minhasPartidas.length > 0 && (
              <div className="mb-8 p-5 rounded-3xl glass-panel border border-purple-500/30 bg-purple-950/20 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-purple-400 animate-pulse" />
                    <h3 className="text-base font-bold text-white">Minhas Partidas Confirmadas</h3>
                  </div>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-bold border border-purple-500/40">
                    {minhasPartidas.length} {minhasPartidas.length === 1 ? 'partida ativa' : 'partidas ativas'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {minhasPartidas.map((p) => {
                    const isCriador = String(user.id) === String(p.criadorId);
                    const cfg = ESPORTES_CONFIG[p.esporte] || { icon: '⚽', label: p.esporte };

                    return (
                      <div
                        key={p.id}
                        onClick={() => abrirDetalhesPartida(p)}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer hover:scale-[1.01] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                              <span>{cfg.icon}</span>
                              <span>{cfg.label}</span>
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              p.status === 'QUADRA_DEFINIDA'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            }`}>
                              {p.status === 'QUADRA_DEFINIDA' ? 'Quadra Definida' : 'Buscando'}
                            </span>
                          </div>

                          <h4 className="font-bold text-white text-sm truncate mb-1">{p.titulo}</h4>
                          <p className="text-xs text-slate-400">
                            📅 {new Date(p.dataHoraPartida).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às{' '}
                            {new Date(p.dataHoraPartida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>

                          <div className="mt-2 text-xs text-slate-300 flex items-center justify-between">
                            <span>👥 {p.totalParticipantes}/{p.quorumMinimo} jogadores</span>
                            {isCriador && (
                              <span className="text-amber-400 text-[10px] font-bold">👑 Organizador</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-300 font-semibold">
                          <span>Ver 3 sugestões & gerenciar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cabeçalho da Seção de Partidas & Matchmaking */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Matchmaking & Quórum Coletivo</span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  Partidas Abertas em Sete Lagoas
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Descubra jogos perto de você ou crie o seu. O algoritmo calcula o <strong>centróide do time</strong> e ranqueia as <strong>3 melhores opções de quadras</strong>!
                </p>
              </div>

              {/* Botão Criar Partida + Alternadores de Modo */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-abrir-criar-partida"
                  onClick={abrirCriarPartida}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-black shadow-glow transition-all hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Criar Nova Partida</span>
                </button>

                {/* Sincronizar Sete Lagoas (Gestor) */}
                {user && user.role === 'ROLE_GESTOR' && (
                  <button
                    onClick={handleSincronizarOsm}
                    disabled={sincronizando}
                    title="Importar e atualizar todos os espaços esportivos de Sete Lagoas via OSM"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
                    <span>{sincronizando ? 'Sincronizando...' : 'Atualizar Espaços'}</span>
                  </button>
                )}

                {/* Alternador 3 Modos: Mapa / Partidas / Quadras */}
                <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setModoVisualizacao('mapa')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      modoVisualizacao === 'mapa'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Mapa de Encontros</span>
                  </button>

                  <button
                    onClick={() => setModoVisualizacao('partidas')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      modoVisualizacao === 'partidas'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Grade de Partidas ({partidas.length})</span>
                  </button>

                  <button
                    onClick={() => setModoVisualizacao('quadras')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      modoVisualizacao === 'quadras'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Quadras Públicas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Feedback de Sincronização */}
            {syncFeedback && (
              <div className="mb-4 p-3 rounded-xl bg-sky-950/40 border border-sky-500/40 text-xs text-sky-200 flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Barra de Filtros por Esporte e Status da Partida */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              
              {/* Chips de Esportes */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-slate-400 shrink-0">Modalidade:</span>
                <button
                  onClick={() => setFiltroEsporte('')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    !filtroEsporte
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Todas
                </button>
                {Object.entries(ESPORTES_CONFIG).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setFiltroEsporte(filtroEsporte === key ? '' : key)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center space-x-1 ${
                      filtroEsporte === key
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Filtro de Status da Partida */}
              <div className="flex items-center space-x-2 shrink-0">
                <select
                  value={filtroStatusPartida}
                  onChange={(e) => setFiltroStatusPartida(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Todos os status</option>
                  <option value="BUSCANDO_JOGADORES">Buscando Jogadores</option>
                  <option value="QUADRA_DEFINIDA">Quadra Escolhida</option>
                </select>
              </div>

            </div>

            {/* CONTEÚDO PRINCIPAL DE ACORDO COM O MODO SELECIONADO */}
            {modoVisualizacao === 'mapa' && (
              <MapaQuadras
                quadras={quadrasFiltradas}
                partidas={partidas}
                onReservar={abrirReserva}
                onVerChamados={abrirChamadoParaQuadra}
                onSelecionarPartida={(p) => abrirDetalhesPartida(p)}
                onCriarPartida={abrirCriarPartida}
              />
            )}

            {modoVisualizacao === 'partidas' && (
              loadingPartidas ? (
                <div className="py-20 text-center text-slate-400 text-sm">
                  Carregando partidas abertas...
                </div>
              ) : partidas.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto border border-slate-800">
                  <Flame className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-80" />
                  <h3 className="text-base font-bold text-white">Nenhuma partida aberta no momento</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Seja o primeiro a convocar a galera para jogar! Crie sua partida e deixe o algoritmo sugerir as 3 quadras mais próximas do grupo.
                  </p>
                  <button
                    onClick={abrirCriarPartida}
                    className="mt-5 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-glow transition-all hover:scale-105"
                  >
                    Criar a Primeira Partida
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {partidas.map((p) => (
                    <PartidaCard
                      key={p.id}
                      partida={p}
                      onVerDetalhes={(partida) => abrirDetalhesPartida(partida)}
                      user={user}
                    />
                  ))}
                </div>
              )
            )}

            {modoVisualizacao === 'quadras' && (
              loadingQuadras ? (
                <div className="py-20 text-center text-slate-400 text-sm">
                  Carregando quadras públicas...
                </div>
              ) : quadrasFiltradas.length === 0 ? (
                <div className="glass-panel rounded-2xl p-10 text-center max-w-md mx-auto">
                  <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-200">Nenhum espaço esportivo encontrado</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tente alterar o filtro de bairro ou modalidade.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quadrasFiltradas.map((q) => (
                    <QuadraCard
                      key={q.id}
                      quadra={q}
                      onReservar={abrirReserva}
                      onVerChamados={abrirChamadoParaQuadra}
                    />
                  ))}
                </div>
              )
            )}

          </div>
        )}

        {activeTab === 'turmas' && (
          <TurmasList
            user={user}
            onOpenNovaTurma={() => {
              if (!user) setAuthModalOpen(true);
              else setNovaTurmaOpen(true);
            }}
          />
        )}

        {activeTab === 'zeladoria' && (
          <ZeladoriaView
            user={user}
            onOpenNovoChamado={() => {
              if (!user) setAuthModalOpen(true);
              else {
                setChamadoQuadraPre(null);
                setNovoChamadoOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'perfil' && (
          <PerfilView
            user={user}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </main>

      {/* Rodapé */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 QuadraAberta — Matchmaking Inteligente de Quadras Públicas em Sete Lagoas/MG.</p>
          <p className="text-slate-400">
            Backend Spring Boot REST + PostgreSQL • Frontend React + Leaflet + Tailwind v3
          </p>
        </div>
      </footer>

      {/* MODAIS DO SISTEMA */}

      {/* Modal de Criação de Partida / Matchmaking */}
      {novaPartidaOpen && (
        <NovaPartidaModal
          onClose={() => setNovaPartidaOpen(false)}
          onSuccess={() => {
            carregarPartidas();
            carregarMinhasPartidas();
          }}
        />
      )}

      {/* Modal de Detalhes da Partida (Centróide, Participantes, Top 3 Quadras Sugeridas) */}
      {partidaDetalhes && (
        <PartidaDetalhesModal
          partida={partidaDetalhes}
          user={user}
          onClose={() => setPartidaDetalhes(null)}
          onAtualizar={handleAtualizarPartidaAtiva}
          onAbrirAuth={() => setAuthModalOpen(true)}
        />
      )}

      {/* Modal de Autenticação */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setUser(getCurrentUser());
            carregarMinhasPartidas();
            carregarMinhasReservas();
          }}
        />
      )}

      {/* Modal de Reserva Direta */}
      {reservaQuadra && (
        <ReservaModal
          quadra={reservaQuadra}
          user={user}
          onClose={() => setReservaQuadra(null)}
          onSuccess={() => {
            carregarMinhasReservas();
          }}
        />
      )}

      {/* Modal de Novo Chamado de Zeladoria */}
      {novoChamadoOpen && (
        <NovoChamadoModal
          quadras={quadras}
          quadraPreselecionada={chamadoQuadraPre}
          onClose={() => {
            setNovoChamadoOpen(false);
            setChamadoQuadraPre(null);
          }}
          onSuccess={() => {
            if (activeTab === 'zeladoria') {
              setActiveTab('zeladoria');
            }
          }}
        />
      )}

      {/* Modal de Nova Turma Social */}
      {novaTurmaOpen && (
        <NovaTurmaModal
          quadras={quadras}
          onClose={() => setNovaTurmaOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {/* Modal de Nova Quadra Pública (Gestor) */}
      {novaQuadraOpen && (
        <NovaQuadraModal
          onClose={() => setNovaQuadraOpen(false)}
          onSuccess={() => carregarQuadras()}
        />
      )}

      {/* Notificação Flutuante de Sessão Expirada */}
      {sessionExpiredMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-900/95 border border-amber-500/40 text-amber-200 shadow-2xl backdrop-blur-md flex items-start space-x-3 animate-slide-up">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-300 text-sm mb-1">Sessão Expirada</p>
            <p className="text-slate-300 leading-relaxed">{sessionExpiredMsg}</p>
            <div className="mt-3 flex items-center space-x-2">
              <button
                onClick={() => {
                  setSessionExpiredMsg(null);
                  setAuthModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all"
              >
                Entrar Novamente
              </button>
              <button
                onClick={() => setSessionExpiredMsg(null)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Dispensar
              </button>
            </div>
          </div>
          <button
            onClick={() => setSessionExpiredMsg(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
