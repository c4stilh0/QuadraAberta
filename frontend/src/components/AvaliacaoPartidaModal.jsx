import React, { useState, useEffect } from 'react';
import { X, Star, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Award, UserCheck } from 'lucide-react';
import { api } from '../api/client';

const NIVEIS_HABILIDADE = [
  { valor: 'JOGADOR_INICIANTE', label: 'Iniciante', desc: 'Primeiros passos' },
  { valor: 'JOGADOR_CASUAL', label: 'Casual', desc: 'Ritmo recreativo' },
  { valor: 'JOGADOR_AMADOR', label: 'Amador', desc: 'Boa técnica/tática' },
  { valor: 'JOGADOR_PROFISSIONAL', label: 'Profissional', desc: 'Alto rendimento' },
];

export default function AvaliacaoPartidaModal({ partida, user, onClose, onAvaliacaoConcluida }) {
  const [colegas, setColegas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  // Armazena avaliações por usuarioId: { [usuarioId]: { notaReputacao: 5, nivelHabilidade: '...', comentario: '' } }
  const [avaliacoes, setAvaliacoes] = useState({});

  useEffect(() => {
    if (partida?.id) {
      carregarColegas();
    }
  }, [partida]);

  const carregarColegas = async () => {
    try {
      setLoading(true);
      setErro(null);
      const lista = await api.avaliacoes.listarColegas(partida.id);
      setColegas(lista || []);

      // Inicializa estado padrão para colegas ainda não avaliados
      const initAvaliacoes = {};
      (lista || []).forEach((c) => {
        if (!c.jaAvaliado) {
          initAvaliacoes[c.usuarioId] = {
            notaReputacao: 5,
            nivelHabilidade: 'JOGADOR_CASUAL',
            comentario: '',
          };
        }
      });
      setAvaliacoes(initAvaliacoes);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar participantes para avaliação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNota = (usuarioId, nota) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [usuarioId]: {
        ...prev[usuarioId],
        notaReputacao: nota,
      },
    }));
  };

  const handleSetHabilidade = (usuarioId, nivel) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [usuarioId]: {
        ...prev[usuarioId],
        nivelHabilidade: nivel,
      },
    }));
  };

  const handleSetComentario = (usuarioId, texto) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [usuarioId]: {
        ...prev[usuarioId],
        comentario: texto,
      },
    }));
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    const pendentes = colegas.filter((c) => !c.jaAvaliado);
    if (pendentes.length === 0) return;

    const payload = pendentes.map((c) => {
      const dados = avaliacoes[c.usuarioId] || { notaReputacao: 5, nivelHabilidade: 'JOGADOR_CASUAL' };
      return {
        avaliadoId: c.usuarioId,
        notaReputacao: dados.notaReputacao,
        nivelHabilidade: dados.nivelHabilidade,
        comentario: dados.comentario?.trim() || null,
      };
    });

    try {
      setEnviando(true);
      setErro(null);
      await api.avaliacoes.enviarAvaliacoes(partida.id, payload);
      setSucesso(true);
      if (onAvaliacaoConcluida) {
        onAvaliacaoConcluida();
      }
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setErro(err.message || 'Erro ao enviar avaliações.');
    } finally {
      setEnviando(false);
    }
  };

  const colegasPendentes = colegas.filter((c) => !c.jaAvaliado);
  const colegasAvaliados = colegas.filter((c) => c.jaAvaliado);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Avaliação 100% Anônima • Estilo Uber</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Avaliar Colegas da Partida
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reconheça o fair play e valide anonimamente o nível de habilidade técnica dos atletas com quem você jogou.
          </p>
        </div>

        {/* Alertas */}
        {sucesso && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-sm text-emerald-200 flex items-center space-x-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Avaliações registradas com sucesso! Obrigado por fortalecer a comunidade.</span>
          </div>
        )}

        {erro && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-sm text-rose-200 flex items-center space-x-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-amber-400" />
            <p className="text-xs">Carregando lista de colegas da partida...</p>
          </div>
        ) : colegas.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            Você é o único participante nesta partida até o momento. Aguarde mais pessoas confirmarem para avaliá-las!
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="space-y-6">
            
            {/* Lista de Colegas para Avaliar */}
            {colegasPendentes.length > 0 ? (
              <div className="space-y-4">
                {colegasPendentes.map((colega) => {
                  const estado = avaliacoes[colega.usuarioId] || {
                    notaReputacao: 5,
                    nivelHabilidade: 'JOGADOR_CASUAL',
                    comentario: '',
                  };

                  return (
                    <div
                      key={colega.usuarioId}
                      className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
                    >
                      {/* Topo do Colega: Avatar e Dados */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 text-emerald-400 font-black flex items-center justify-center overflow-hidden border border-slate-700">
                            {colega.fotoUrl ? (
                              <img src={colega.fotoUrl} alt={colega.nome} className="w-full h-full object-cover" />
                            ) : (
                              colega.nome ? colega.nome.charAt(0).toUpperCase() : 'J'
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{colega.nome}</h4>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                              <span>📍 {colega.bairro}</span>
                              <span>•</span>
                              <span className="text-amber-300 font-semibold">
                                ⭐️ {colega.reputacaoAtual ? colega.reputacaoAtual.toFixed(1) : '5.0'}
                              </span>
                              <span>•</span>
                              <span>{colega.habilidadeDeclarada}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 1. Nota de Reputação (Estrelas Estilo Uber) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-300">
                            Reputação e Fair Play:
                          </span>
                          <span className="text-xs font-bold text-amber-400">
                            {estado.notaReputacao === 5 && '⭐️⭐️⭐️⭐️⭐️ Excelente (5.0)'}
                            {estado.notaReputacao === 4 && '⭐️⭐️⭐️⭐️ Bom (4.0)'}
                            {estado.notaReputacao === 3 && '⭐️⭐️⭐️ Regular / Neutro (3.0)'}
                            {estado.notaReputacao === 2 && '⭐️⭐️ Conduta Ruim (2.0)'}
                            {estado.notaReputacao === 1 && '⭐️ Péssimo Fair Play (1.0)'}
                          </span>
                        </div>

                        {/* Botões de Estrelas */}
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((estrela) => (
                            <button
                              key={estrela}
                              type="button"
                              onClick={() => handleSetNota(colega.usuarioId, estrela)}
                              className={`p-2 rounded-xl transition-all transform hover:scale-110 ${
                                estrela <= estado.notaReputacao
                                  ? 'text-amber-400 bg-amber-400/10'
                                  : 'text-slate-600 hover:text-slate-400 bg-slate-900'
                              }`}
                            >
                              <Star className="w-5 h-5 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Validação da Habilidade Técnica */}
                      <div>
                        <span className="block text-xs font-semibold text-slate-300 mb-2">
                          Qual nível técnico melhor descreve este jogador?
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {NIVEIS_HABILIDADE.map((nivel) => {
                            const isSelected = estado.nivelHabilidade === nivel.valor;
                            return (
                              <button
                                key={nivel.valor}
                                type="button"
                                onClick={() => handleSetHabilidade(colega.usuarioId, nivel.valor)}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <span className="block text-xs font-bold text-white mb-0.5">
                                  {nivel.label}
                                </span>
                                <span className="block text-[10px] text-slate-400 leading-tight">
                                  {nivel.desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Comentário Opcional */}
                      <div>
                        <input
                          type="text"
                          maxLength={250}
                          placeholder="Observação ou elogio construtivo (opcional)..."
                          value={estado.comentario || ''}
                          onChange={(e) => handleSetComentario(colega.usuarioId, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Colegas Já Avaliados */}
            {colegasAvaliados.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Colegas já avaliados nesta partida:
                </span>
                <div className="space-y-2">
                  {colegasAvaliados.map((c) => (
                    <div
                      key={c.usuarioId}
                      className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-slate-300">{c.nome}</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        ✓ Avaliação enviada
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            {colegasPendentes.length > 0 ? (
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={enviando}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando reputação...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      <span>Enviar Avaliações Anônimas</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-all"
                >
                  Fechar
                </button>
              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
}
