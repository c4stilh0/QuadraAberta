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
import { api, getCurrentUser } from './api/client';
import { Calendar, Trash2, AlertCircle, LayoutGrid, Map as MapIcon, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('quadras');
  const [user, setUser] = useState(() => getCurrentUser());
  const [quadras, setQuadras] = useState([]);
  const [loadingQuadras, setLoadingQuadras] = useState(true);
  const [filtroBairro, setFiltroBairro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [modoVisualizacao, setModoVisualizacao] = useState('mapa'); // 'mapa' | 'cards'
  const [sincronizando, setSincronizando] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  // Minhas Reservas
  const [minhasReservas, setMinhasReservas] = useState([]);

  // Modais
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [reservaQuadra, setReservaQuadra] = useState(null);
  const [novoChamadoOpen, setNovoChamadoOpen] = useState(false);
  const [chamadoQuadraPre, setChamadoQuadraPre] = useState(null);
  const [novaTurmaOpen, setNovaTurmaOpen] = useState(false);
  const [novaQuadraOpen, setNovaQuadraOpen] = useState(false);

  const carregarQuadras = useCallback(async () => {
    try {
      setLoadingQuadras(true);
      const data = await api.quadras.listar({
        bairro: filtroBairro,
        status: filtroStatus,
      });
      setQuadras(data || []);
    } catch {
      // Ignora erro
    } finally {
      setLoadingQuadras(false);
    }
  }, [filtroBairro, filtroStatus]);

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
    if (activeTab === 'quadras' && user) {
      carregarMinhasReservas();
    }
  }, [activeTab, user, carregarMinhasReservas]);

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setMinhasReservas([]);
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

  // Lista de bairros populares de Sete Lagoas para atalhos
  const bairrosSeteLagoas = [
    'Todos',
    'Belo Vale',
    'Progresso',
    'Montreal',
    'Boa Vista',
    'Cidade de Deus',
    'Verde Vale',
    'Itapuã',
    'São João',
    'Interlagos',
    'Esperança',
    'Canaã'
  ];

  // Lista de modalidades para filtro rápido
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

  const quadrasFiltradas = quadras.filter((q) => {
    if (!filtroModalidade || filtroModalidade === 'Todas') return true;
    const mods = (q.modalidades || '').toLowerCase();
    const filtro = filtroModalidade.toLowerCase();
    return mods.includes(filtro);
  });

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

      {/* Hero Banner apenas na aba de quadras */}
      {activeTab === 'quadras' && <Hero />}

      <main className="flex-1">
        {activeTab === 'quadras' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Minhas Reservas (Se autenticado) */}
            {user && minhasReservas.length > 0 && (
              <div className="mb-10 p-5 rounded-3xl glass-panel border border-emerald-500/30 bg-emerald-950/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Meus Agendamentos Ativos</h3>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
                    {minhasReservas.filter(r => r.status === 'CONFIRMADA').length} de 2 vagas antimonopólio
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {minhasReservas.map((r) => (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                        r.status === 'CONFIRMADA'
                          ? 'bg-slate-900/90 border-emerald-500/30'
                          : 'bg-slate-900/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-slate-100 block text-sm mb-0.5">
                          {r.quadraNome}
                        </span>
                        <span className="text-slate-400 block">
                          {new Date(r.dataInicio).toLocaleDateString('pt-BR')} das{' '}
                          {new Date(r.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às{' '}
                          {new Date(r.dataFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          r.status === 'CONFIRMADA' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {r.status}
                        </span>
                      </div>

                      {r.status === 'CONFIRMADA' && (
                        <button
                          onClick={() => handleCancelarReserva(r.id)}
                          title="Cancelar Agendamento"
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cabeçalho da Lista de Quadras */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Quadras Poliesportivas Comunitárias
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Encontre e reserve seu horário nas quadras públicas de Sete Lagoas e região.
                </p>
              </div>

              {/* Controles de visualização e Filtro de Status */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Botão de Sincronização Automática (Exclusivo Gestor) */}
                {user && user.role === 'ROLE_GESTOR' && (
                  <button
                    onClick={handleSincronizarOsm}
                    disabled={sincronizando}
                    title="Importar e atualizar todos os espaços esportivos e quadras de Sete Lagoas"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
                    <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar Sete Lagoas'}</span>
                  </button>
                )}

                {/* Alternador Cards / Mapa */}
                <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setModoVisualizacao('cards')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      modoVisualizacao === 'cards'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                  <button
                    onClick={() => setModoVisualizacao('mapa')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      modoVisualizacao === 'mapa'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Mapa Interativo</span>
                  </button>
                </div>

                {/* Filtro de Status */}
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Todos os status</option>
                  <option value="DISPONIVEL">Disponíveis</option>
                  <option value="EM_MANUTENCAO">Em Manutenção</option>
                  <option value="INTERDITADA">Interditadas</option>
                </select>
              </div>
            </div>

            {/* Alerta de feedback de sincronização */}
            {syncFeedback && (
              <div className="mb-4 p-3 rounded-xl bg-sky-950/40 border border-sky-500/40 text-xs text-sky-200 flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Chips de Bairros */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-3">
              <span className="text-xs font-semibold text-slate-400 shrink-0">Bairro:</span>
              {bairrosSeteLagoas.map((b) => (
                <button
                  key={b}
                  onClick={() => setFiltroBairro(b === 'Todos' ? '' : b)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    (b === 'Todos' && !filtroBairro) || filtroBairro === b
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Chips de Modalidades Esportivas */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-6">
              <span className="text-xs font-semibold text-slate-400 shrink-0">Esporte:</span>
              {modalidadesLista.map((m) => (
                <button
                  key={m}
                  onClick={() => setFiltroModalidade(m === 'Todas' ? '' : m)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    (m === 'Todas' && !filtroModalidade) || filtroModalidade === m
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Grade ou Mapa de Quadras */}
            {loadingQuadras ? (
              <div className="py-20 text-center text-slate-400 text-sm">
                Carregando quadras...
              </div>
            ) : quadrasFiltradas.length === 0 ? (
              <div className="glass-panel rounded-2xl p-10 text-center max-w-md mx-auto">
                <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-200">Nenhum espaço esportivo encontrado</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tente alterar o filtro de bairro, esporte ou status.
                </p>
              </div>
            ) : modoVisualizacao === 'mapa' ? (
              <MapaQuadras
                quadras={quadrasFiltradas}
                onReservar={abrirReserva}
                onVerChamados={abrirChamadoParaQuadra}
              />
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
          <p>© 2026 QuadraAberta — Gestão Democrática de Quadras Públicas em Sete Lagoas/MG.</p>
          <p className="text-slate-400">
            Backend Spring Boot REST + PostgreSQL • Frontend React + Vite + Tailwind v3
          </p>
        </div>
      </footer>

      {/* Modais */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setUser(getCurrentUser());
            carregarMinhasReservas();
          }}
        />
      )}

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
              // Recarrega chamados
              setActiveTab('zeladoria');
            }
          }}
        />
      )}

      {novaTurmaOpen && (
        <NovaTurmaModal
          quadras={quadras}
          onClose={() => setNovaTurmaOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {novaQuadraOpen && (
        <NovaQuadraModal
          onClose={() => setNovaQuadraOpen(false)}
          onSuccess={() => carregarQuadras()}
        />
      )}
    </div>
  );
}
