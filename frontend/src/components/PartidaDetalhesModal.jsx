import React, { useState } from 'react';
import { 
  X, Users, MapPin, Calendar, Clock, Trophy, CheckCircle2, 
  AlertCircle, ShieldCheck, ArrowRight, Navigation, Sparkles, LogOut, Check,
  Star, Award
} from 'lucide-react';
import { api } from '../api/client';
import { BAIRROS_SETE_LAGOAS, BAIRROS_COORDS, ESPORTES_CONFIG } from './NovaPartidaModal';
import AvaliacaoPartidaModal from './AvaliacaoPartidaModal';

export default function PartidaDetalhesModal({ 
  partida, 
  user, 
  onClose, 
  onAtualizar, 
  onAbrirAuth 
}) {
  const [bairroParticipante, setBairroParticipante] = useState('Progresso');
  const [gpsParticipante, setGpsParticipante] = useState(null);
  const [obtendoGps, setObtendoGps] = useState(false);
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [erroMsg, setErroMsg] = useState(null);
  const [mostrarModalAvaliacao, setMostrarModalAvaliacao] = useState(false);

  if (!partida) return null;

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
      await api.partidas.sair(partida.id);
      setFeedbackMsg('Você saiu da partida.');
      onAtualizar?.();
    } catch (err) {
      setErroMsg(err.message || 'Erro ao sair da partida.');
    } finally {
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

  const handleCancelarPartida = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar esta partida para todos os participantes?')) return;
    try {
      setLoadingAcao(true);
      setErroMsg(null);
      await api.partidas.cancelar(partida.id);
      setFeedbackMsg('Partida cancelada com sucesso.');
      setTimeout(() => {
        onAtualizar?.();
        onClose();
      }, 1000);
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
                const isEscolhida = quadraEscolhida?.id === q.id;

                return (
                  <div
                    key={q.id}
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
                      {isCriador && (
                        <div className="sm:self-center shrink-0 pt-2 sm:pt-0">
                          {isEscolhida ? (
                            <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                              <Trophy className="w-4 h-4" />
                              <span>Fixada por você</span>
                            </span>
                          ) : (
                            <button
                              id={`btn-escolher-quadra-${q.id}`}
                              type="button"
                              onClick={() => handleEscolherQuadra(q.id, q.nome)}
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
            {isParticipante ? (
              isCriador ? (
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
