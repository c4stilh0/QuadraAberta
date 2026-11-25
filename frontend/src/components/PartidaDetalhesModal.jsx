import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Users, MapPin, Calendar, Clock, Trophy, CheckCircle2, 
  AlertCircle, ShieldCheck, ArrowRight, Navigation, Sparkles, LogOut, Check,
  Star, Award, MessageSquare, Send
} from 'lucide-react';
import { api } from '../api/client';
import { BAIRROS_SETE_LAGOAS, BAIRROS_COORDS, ESPORTES_CONFIG } from './NovaPartidaModal';
import AvaliacaoPartidaModal from './AvaliacaoPartidaModal';

export default function PartidaDetalhesModal({ 
  partida, 
  user, 
  onClose, 
  onAtualizar, 
  onPartidaCancelada,
  onAbrirAuth 
}) {
  const [activeModalTab, setActiveModalTab] = useState('detalhes'); // 'detalhes' | 'chat'
  const [bairroParticipante, setBairroParticipante] = useState('Progresso');
  const [gpsParticipante, setGpsParticipante] = useState(null);
  const [obtendoGps, setObtendoGps] = useState(false);
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [erroMsg, setErroMsg] = useState(null);
  const [mostrarModalAvaliacao, setMostrarModalAvaliacao] = useState(false);

  // Estados do Bate-Papo da Partida
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [erroChat, setErroChat] = useState(null);
  const chatBottomRef = useRef(null);

  const partidaId = partida?.id;

  // Carrega mensagens do chat e mantém polling ativo enquanto modal estiver aberto
  const carregarMensagens = useCallback(async (silencioso = false) => {
    if (!partidaId) return;
    try {
      const data = await api.partidas.listarMensagens(partidaId);
      setMensagens(data || []);
      if (!silencioso) {
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      if (!silencioso) {
        console.warn('Erro ao carregar mensagens:', err);
      }
    }
  }, [partidaId]);

  useEffect(() => {
    if (!partidaId) return;
    carregarMensagens(false);
    const interval = setInterval(() => {
      carregarMensagens(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [partidaId, carregarMensagens]);

  useEffect(() => {
    if (partidaId && activeModalTab === 'chat') {
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [partidaId, activeModalTab, mensagens.length]);

  if (!partida) return null;

  const isFinalizada = partida.status === 'FINALIZADA';
  const isCancelada = partida.status === 'CANCELADA';
  const isEncerrada = isFinalizada || isCancelada;

  const esporteCfg = ESPORTES_CONFIG[partida.esporte] || {
    label: partida.esporteDescricao || partida.esporte,
    icon: '⚽'
  };

  const isCriador = partida.souCriador ?? (user && String(user.id) === String(partida.criadorId));
  const isParticipante = partida.estouConfirmado ?? (user && partida.participantes?.some(
    p => String(p.usuarioId || p.id) === String(user.id)
  ));

  const minJog = partida.minJogadores || partida.quorumMinimo || 10;
  const maxJog = partida.maxJogadores || partida.quorumMaximo || 14;
  const totalParts = partida.totalParticipantes ?? (partida.participantes?.length || 1);

  const quorumAtingido = totalParts >= minJog;
  const porcentagemQuorum = Math.min(
    100, 
    Math.round((totalParts / maxJog) * 100)
  );

  const rawDataHora = partida.dataHora || partida.dataHoraPartida || new Date().toISOString();
  const dataFormatada = new Date(rawDataHora).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const horaFormatada = new Date(rawDataHora).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const sugestoes = partida.sugestoesQuadras || partida.top3QuadrasSugeridas || [];
  const quadraEscolhida = partida.quadraEscolhida || partida.quadraDefinida;
  const tituloPartida = partida.titulo || partida.descricao || `Partida de ${esporteCfg.label}`;

  const handleEnviarMensagem = async (textoParaEnviar) => {
    const texto = (typeof textoParaEnviar === 'string' ? textoParaEnviar : novaMensagem).trim();
    if (!texto) return;

    if (!user) {
      onAbrirAuth?.();
      return;
    }

    try {
      setEnviandoMensagem(true);
      setErroChat(null);
      const msgCriada = await api.partidas.enviarMensagem(partida.id, { conteudo: texto });
      setMensagens((prev) => [...prev, msgCriada]);
      setNovaMensagem('');
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setErroChat(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setEnviandoMensagem(false);
    }
  };

  const handleObterGps = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocalização não suportada no seu navegador.');
      return;
    }
    setObtendoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsParticipante([pos.coords.latitude, pos.coords.longitude]);
        setObtendoGps(false);
      },
      () => {
        setObtendoGps(false);
        alert('Não foi possível obter sua localização GPS. Usaremos as coordenadas do bairro selecionado.');
      },
      { timeout: 8000 }
    );
  };

  const handleConfirmarPresenca = async () => {
    if (!user) {
      onAbrirAuth?.();
      return;
    }

    setErroMsg(null);
    setFeedbackMsg(null);

    let lat = null;
    let lng = null;
    if (gpsParticipante) {
      lat = gpsParticipante[0];
      lng = gpsParticipante[1];
    } else if (BAIRROS_COORDS[bairroParticipante]) {
      lat = BAIRROS_COORDS[bairroParticipante][0];
      lng = BAIRROS_COORDS[bairroParticipante][1];
    }

    try {
      setLoadingAcao(true);
      await api.partidas.confirmar(partida.id, {
        bairro: bairroParticipante,
        latitude: lat,
        longitude: lng,
      });
      setFeedbackMsg('Presença confirmada! Centróide do grupo recalculado com sucesso.');
      onAtualizar?.();
    } catch (err) {
      setErroMsg(err.message || 'Erro ao confirmar presença.');
    } finally {
      setLoadingAcao(false);
    }
  };

  const handleSairPartida = async () => {
    if (!window.confirm('Tem certeza que deseja desistir desta partida? O centróide será recalculado.')) return;
    try {
      setLoadingAcao(true);
      setErroMsg(null);
      const res = await api.partidas.sair(partida.id);
      setFeedbackMsg('Você saiu da partida.');
      if (res?.status === 'CANCELADA' || isCriador) {
        if (onPartidaCancelada) {
          onPartidaCancelada(partida.id);
        } else {
          onAtualizar?.();
          onClose();
        }
      } else {
        if (onPartidaCancelada) {
          onPartidaCancelada(partida.id);
        } else {
          onAtualizar?.();
          onClose();
        }
      }
    } catch (err) {
      setErroMsg(err.message || 'Erro ao sair da partida.');
      setLoadingAcao(false);
    }
  };

  const handleEscolherQuadra = async (quadraId, nomeQuadra) => {
    if (!isCriador) return;
    if (!window.confirm(`Confirmar a quadra "${nomeQuadra}" como o local oficial da partida?`)) return;

    try {
      setLoadingAcao(true);
      setErroMsg(null);
      await api.partidas.escolherQuadra(partida.id, quadraId);
      setFeedbackMsg(`Quadra "${nomeQuadra}" fixada com sucesso para esta partida!`);
      onAtualizar?.();
    } catch (err) {
      setErroMsg(err.message || 'Erro ao definir quadra.');
    } finally {
      setLoadingAcao(false);
    }
  };

  const handleFinalizarPartida = async () => {
    if (!window.confirm('Marcar esta partida como finalizada? Após finalizar, o jogo sai da lista aberta e os participantes podem avaliar os colegas.')) return;
    try {
      setLoadingAcao(true);
      setErroMsg(null);
      await api.partidas.finalizar(partida.id);
      setFeedbackMsg('Partida finalizada! Agora você e os colegas podem registrar as avaliações.');
      onAtualizar?.();
    } catch (err) {
      setErroMsg(err.message || 'Erro ao finalizar partida.');
    } finally {
      setLoadingAcao(false);
    }
  };

  const handleCancelarPartida = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar esta partida para todos os participantes?')) return;
    try {
      setLoadingAcao(true);
      setErroMsg(null);
      await api.partidas.cancelar(partida.id);
      setFeedbackMsg('Partida cancelada com sucesso.');
      if (onPartidaCancelada) {
        onPartidaCancelada(partida.id);
      } else {
        onAtualizar?.();
        onClose();
      }
    } catch (err) {
      setErroMsg(err.message || 'Erro ao cancelar partida.');
      setLoadingAcao(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-5 sm:p-7 border border-slate-700 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Status Badge e Esporte */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-2xl mr-1">{esporteCfg.icon}</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-200">
            {esporteCfg.label}
          </span>

          {partida.status === 'QUADRA_DEFINIDA' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1 shadow-glow">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quadra Oficial Escolhida</span>
            </span>
          ) : partida.status === 'BUSCANDO_JOGADORES' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center space-x-1 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>Buscando Jogadores ({totalParts}/{minJog} mín)</span>
            </span>
          ) : partida.status === 'FINALIZADA' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>Partida Finalizada</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
              {partida.statusDescricao || partida.status}
            </span>
          )}

          {isCriador && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              👑 Você é o Organizador
            </span>
          )}
        </div>

        {/* Título e Horário */}
        <h2 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug">
          {tituloPartida}
        </h2>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white capitalize">{dataFormatada}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Às <strong>{horaFormatada}</strong> ({partida.duracaoMinutos} min de jogo)</span>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {feedbackMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {erroMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erroMsg}</span>
          </div>
        )}

        {/* Abas do Modal: Lobby & Centróide / Bate-Papo da Partida */}
        <div className="flex rounded-2xl bg-slate-900/90 p-1 mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveModalTab('detalhes')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeModalTab === 'detalhes'
                ? 'bg-emerald-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lobby & Centróide</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('chat')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeModalTab === 'chat'
                ? 'bg-emerald-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bate-Papo da Partida</span>
            {mensagens.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeModalTab === 'chat' ? 'bg-white text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {mensagens.length}
              </span>
            )}
          </button>
        </div>

        {activeModalTab === 'detalhes' && (
          <>
        {/* Bloco de Localização & Privacidade Geográfica */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Localização Geográfica do Grupo</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacidade Protegida</span>
            </span>
          </div>

          <div className="text-sm font-bold text-white">
            {totalParts <= 1 ? (
              <div className="flex items-baseline space-x-2">
                <span>📍 Bairro de Origem do Criador:</span>
                <span className="text-emerald-400 text-base">{partida.bairroCriador || partida.criadorBairro}</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-sky-400 text-base">🌐 Centróide Ponderado do Grupo:</span>
                  <span className="text-white text-sm">{partida.bairroExibicao || `Centróide de ${totalParts} Moradores`}</span>
                </div>
                {(partida.centroideLat || partida.latitudeCentroide) && (
                  <span className="text-[11px] font-normal text-slate-400">
                    Ponto Médio Geográfico Calculado
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {totalParts <= 1
              ? 'Atualmente exibindo apenas o bairro do criador. Conforme novos moradores confirmarem presença, o centróide do grupo será atualizado no mapa!'
              : 'O centróide é a média matemática exata dos pontos de todos os confirmados, mantendo as casas de cada morador em sigilo e priorizando o centro de gravidade do time.'}
          </p>
        </div>

        {/* Barra de Progresso do Quórum */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-300 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Quórum da Partida: {totalParts} de {minJog} mínimos</span>
            </span>
            <span className={`font-extrabold ${quorumAtingido ? 'text-emerald-400' : 'text-amber-400'}`}>
              {quorumAtingido ? '✓ Quórum Fechado!' : `Faltam ${Math.max(0, minJog - totalParts)} jogadores`}
            </span>
          </div>

          {/* Barra Visual */}
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                quorumAtingido 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-glow' 
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              }`}
              style={{ width: `${porcentagemQuorum}%` }}
            />
          </div>

          {/* Lista de Avatares dos Participantes */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Jogadores Confirmados ({partida.participantes?.length || 0}):
              </span>
              {isParticipante && (partida.participantes?.length > 1) && (
                <button
                  type="button"
                  id="btn-abrir-avaliacao"
                  onClick={() => setMostrarModalAvaliacao(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center space-x-1 shadow-sm"
                >
                  <Star className="w-3 h-3 fill-current" />
                  <span>Avaliar Colegas</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {partida.participantes?.map((p) => {
                const pNome = p.nome || p.usuarioNome || 'Jogador';
                const pFoto = p.fotoUrl || p.usuarioFotoUrl;
                const pRep = p.reputacao != null ? p.reputacao.toFixed(1) : '5.0';
                const pHab = p.habilidade || 'Casual';

                return (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[11px] overflow-hidden shrink-0">
                        {pFoto ? (
                          <img src={pFoto} alt={pNome} className="w-full h-full object-cover" />
                        ) : (
                          pNome.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-slate-200 truncate">{pNome}</span>
                          {p.criador && <span title="Criador da Partida">👑</span>}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          📍 {p.bairro}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center space-x-0.5">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{pRep}</span>
                      </span>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {pHab}
                        </span>
                        {p.nivelConfirmado && (
                          <span className="text-[9px] text-emerald-400 font-bold" title="Nível confirmado pela comunidade">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SEÇÃO PRINCIPAL: TOP 3 QUADRAS SUGERIDAS (REQUISITO FUNDAMENTAL) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-black text-white">
                  3 Melhores Quadras Sugeridas para Este Grupo
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ranqueadas automaticamente pela menor distância média coletiva de todos os participantes.
              </p>
            </div>
          </div>

          {sugestoes && sugestoes.length > 0 ? (
            <div className="space-y-3">
              {sugestoes.map((q, idx) => {
                const sugestaoId = q.quadraId ?? q.id;
                const isEscolhida = Boolean(
                  quadraEscolhida?.id &&
                  sugestaoId &&
                  String(quadraEscolhida.id) === String(sugestaoId)
                );

                return (
                  <div
                    key={sugestaoId ?? idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isEscolhida
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-glow'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start space-x-3">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isEscolhida 
                            ? 'bg-emerald-500 text-slate-950' 
                            : idx === 0 
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-sm text-white">{q.nome}</h4>
                            {isEscolhida && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Quadra Oficial Escolhida</span>
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-400 mt-0.5">
                            📍 {q.bairro} — {q.logradouro}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {q.distanciaMediaKm != null && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                ⚡ {q.distanciaMediaKm < 1 ? `${Math.round(q.distanciaMediaKm * 1000)}m` : `${q.distanciaMediaKm.toFixed(1)} km`} de distância média
                              </span>
                            )}
                            {q.tipoPiso && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300">
                                {q.tipoPiso}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300">
                              {q.possuiIluminacao ? '🌙 Noturno' : '☀️ Diurno'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botão de Escolha para o Criador da Partida */}
                      {isCriador && !isEncerrada && (
                        <div className="sm:self-center shrink-0 pt-2 sm:pt-0">
                          {isEscolhida ? (
                            <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                              <Trophy className="w-4 h-4" />
                              <span>Fixada por você</span>
                            </span>
                          ) : (
                            <button
                              id={`btn-escolher-quadra-${sugestaoId}`}
                              type="button"
                              onClick={() => handleEscolherQuadra(sugestaoId, q.nome)}
                              disabled={loadingAcao}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all flex items-center justify-center space-x-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Escolher Esta Quadra</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              Nenhuma quadra pública compatível encontrada para este esporte em Sete Lagoas no momento.
            </div>
          )}

          {isCriador && partida.status === 'BUSCANDO_JOGADORES' && (
            <p className="text-[11px] text-amber-400/90 mt-2 font-medium">
              💡 Como criador da partida, você pode escolher uma das 3 quadras sugeridas acima a qualquer momento para fixar o local oficial!
            </p>
          )}
        </div>

        {/* Observações da Partida */}
        {partida.descricao && (
          <div className="mb-6 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Observações do Organizador:
            </span>
            {partida.descricao}
          </div>
        )}

        {/* AÇÕES DE PARTICIPAÇÃO E ENTRADA */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="w-full sm:w-auto">
            {isEncerrada ? (
              <div className="text-xs font-semibold text-purple-300 flex items-center space-x-2">
                <Award className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  {isFinalizada
                    ? 'Partida encerrada. Use o botão "Avaliar Colegas" acima para registrar reputação.'
                    : 'Partida cancelada.'}
                </span>
              </div>
            ) : isParticipante ? (
              isCriador ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-finalizar-partida"
                    type="button"
                    onClick={handleFinalizarPartida}
                    disabled={loadingAcao}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/15 border border-purple-500/40 hover:bg-purple-500/25 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Finalizar Partida</span>
                  </button>
                  <button
                    id="btn-cancelar-partida"
                    type="button"
                    onClick={handleCancelarPartida}
                    disabled={loadingAcao}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cancelar Partida</span>
                  </button>
                </div>
              ) : (
                <button
                  id="btn-sair-partida"
                  type="button"
                  onClick={handleSairPartida}
                  disabled={loadingAcao}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center justify-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desistir da Partida</span>
                </button>
              )
            ) : (
              /* Formulário de confirmação de presença com bairro/GPS */
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold px-1">Seu Bairro:</span>
                  <select
                    id="select-bairro-participante"
                    value={bairroParticipante}
                    onChange={(e) => {
                      setBairroParticipante(e.target.value);
                      setGpsParticipante(null);
                    }}
                    className="bg-transparent text-xs text-white focus:outline-none py-1"
                  >
                    {BAIRROS_SETE_LAGOAS.map((b) => (
                      <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleObterGps}
                  disabled={obtendoGps}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center space-x-1 border transition-all ${
                    gpsParticipante
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Capturar GPS para cálculo preciso do centróide"
                >
                  <Navigation className={`w-3 h-3 ${obtendoGps ? 'animate-spin' : ''}`} />
                  <span>{gpsParticipante ? 'GPS ✓' : 'GPS'}</span>
                </button>

                <button
                  id="btn-confirmar-presenca"
                  type="button"
                  onClick={handleConfirmarPresenca}
                  disabled={loadingAcao}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Presença / Tô Dentro!</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            Fechar
          </button>
        </div>
        </>
        )}

        {/* Painel do Bate-Papo da Partida */}
        {activeModalTab === 'chat' && (
          <div className="flex flex-col space-y-3 animate-fade-in">
            {/* Cabeçalho do Bate-Papo */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-slate-200">Bate-Papo do Jogo</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {isParticipante || isCriador ? '🟢 Presença confirmada no jogo' : '🔒 Somente leitura (confirme presença)'}
              </span>
            </div>

            {/* Erro no Chat */}
            {erroChat && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroChat}</span>
              </div>
            )}

            {/* Feed de Mensagens com rolagem suave */}
            <div className="h-[360px] overflow-y-auto pr-1 space-y-3 bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
              {mensagens.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                    <MessageSquare className="w-6 h-6 text-emerald-400/80" />
                  </div>
                  <p className="text-sm font-bold text-slate-300 mb-1">Nenhuma mensagem ainda</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Seja o primeiro a mandar um oi, combinar quem leva a bola ou a cor dos coletes!
                  </p>
                </div>
              ) : (
                mensagens.map((msg) => {
                  const hora = msg.criadoEm
                    ? new Date(msg.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '';

                  if (msg.tipo === 'SISTEMA') {
                    return (
                      <div key={msg.id} className="flex items-center justify-center my-2">
                        <span className="text-[11px] px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400 flex items-center space-x-1.5 shadow-sm text-center">
                          <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{msg.conteudo}</span>
                          <span className="text-[9px] text-slate-500 ml-1 font-mono">{hora}</span>
                        </span>
                      </div>
                    );
                  }

                  if (msg.souEu) {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl rounded-tr-none px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
                          <p className="text-xs break-words leading-relaxed">{msg.conteudo}</p>
                          <span className="text-[9px] text-emerald-200/80 block text-right mt-1 font-mono">{hora}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex items-start space-x-2.5 max-w-[85%]">
                      <div className="w-7 h-7 rounded-full bg-slate-800 ring-1 ring-slate-700 overflow-hidden flex items-center justify-center shrink-0 mt-0.5 shadow">
                        {msg.fotoUrl ? (
                          <img src={msg.fotoUrl} alt={msg.nomeUsuario} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[11px] font-bold text-slate-300">
                            {msg.nomeUsuario ? msg.nomeUsuario.charAt(0).toUpperCase() : '?'}
                          </span>
                        )}
                      </div>
                      <div className="rounded-2xl rounded-tl-none px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 shadow-sm flex-1">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <span className="text-[11px] font-bold text-slate-300">{msg.nomeUsuario}</span>
                          {msg.isCriador && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              👑 Organizador
                            </span>
                          )}
                        </div>
                        <p className="text-xs break-words leading-relaxed text-slate-200">{msg.conteudo}</p>
                        <span className="text-[9px] text-slate-500 block text-right mt-1 font-mono">{hora}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Atalhos Rápidos de 1 Clique */}
            {(isParticipante || isCriador) && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Atalhos Rápidos:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '⚽ Levo a bola!',
                    '🎽 Levo os coletes!',
                    '⏱️ Chego 10min antes!',
                    '🧤 Jogo no gol!',
                    '🚗 Alguém precisa de carona?'
                  ].map((atalho) => (
                    <button
                      key={atalho}
                      type="button"
                      onClick={() => handleEnviarMensagem(atalho)}
                      disabled={enviandoMensagem}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      {atalho}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caixa de Entrada e Envio */}
            {(isParticipante || isCriador) ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEnviarMensagem();
                }}
                className="flex items-center space-x-2 pt-2"
              >
                <input
                  type="text"
                  maxLength={500}
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  placeholder="Escreva uma mensagem para a partida..."
                  disabled={enviandoMensagem}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!novaMensagem.trim() || enviandoMensagem}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{enviandoMensagem ? 'Enviando...' : 'Enviar'}</span>
                </button>
              </form>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  Quer combinar os detalhes do jogo?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('detalhes')}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    Confirme sua presença no lobby
                  </button>{' '}
                  para liberar o envio de mensagens!
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal de Avaliação Anônima dos Colegas de Partida */}
      {mostrarModalAvaliacao && (
        <AvaliacaoPartidaModal
          partida={partida}
          user={user}
          onClose={() => setMostrarModalAvaliacao(false)}
          onAvaliacaoConcluida={() => {
            onAtualizar?.();
          }}
        />
      )}
    </div>
  );
}
