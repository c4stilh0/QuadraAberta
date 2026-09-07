import React, { useState, useEffect } from 'react';
import { Wrench, PlusCircle, AlertCircle, CheckCircle2, Clock, Camera, Image as ImageIcon, Check } from 'lucide-react';
import { api } from '../api/client';

export default function ZeladoriaView({ user, quadras, onOpenNovoChamado }) {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [atualizandoId, setAtualizandoId] = useState(null);

  const carregarChamados = async () => {
    try {
      setLoading(true);
      const data = await api.chamados.listarTodos();
      setChamados(data || []);
    } catch {
      // Falha silenciosa ou lista vazia
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarChamados();
  }, []);

  const handleMudarStatus = async (chamadoId, novoStatus) => {
    try {
      setAtualizandoId(chamadoId);
      await api.chamados.atualizarStatus(chamadoId, novoStatus);
      await carregarChamados();
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    } finally {
      setAtualizandoId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ABERTO':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">Aberto</span>;
      case 'EM_ANALISE':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">Em Análise</span>;
      case 'EM_EXECUCAO':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">Em Execução</span>;
      case 'RESOLVIDO':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1"><Check className="w-3 h-3"/><span>Resolvido</span></span>;
      default:
        return null;
    }
  };

  const chamadosFiltrados = chamados.filter((c) => {
    if (!filtroCategoria) return true;
    return c.categoria === filtroCategoria;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Wrench className="w-6 h-6 text-amber-400" />
            <span>Zeladoria Participativa</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Moradores reportam problemas estruturais (iluminação, alambrado, piso) com fotos. Gestores e ONGs parceiras acompanham a resolução.
          </p>
        </div>

        <button
          onClick={onOpenNovoChamado}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-glow-amber transition-all hover:scale-[1.02]"
        >
          <Camera className="w-4 h-4" />
          <span>Reportar Problema</span>
        </button>
      </div>

      {/* Filtro de Categoria */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-6">
        <span className="text-xs font-semibold text-slate-400 shrink-0">Categorias:</span>
        {['', 'ILUMINACAO', 'ALAMBRADO', 'PISO', 'LIMPEZA', 'OUTROS'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltroCategoria(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              filtroCategoria === cat
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {cat === '' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Carregando chamados da comunidade...
        </div>
      ) : chamadosFiltrados.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center max-w-lg mx-auto">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Nenhum chamado pendente nesta categoria!</h3>
          <p className="text-xs text-slate-400 mt-1">
            Se encontrar refletores queimados, alambrados quebrados ou sujeira na sua quadra, abra um chamado com foto para conserto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {chamadosFiltrados.map((c) => (
            <div key={c.id} className="glass-card rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              
              {/* Foto do Chamado */}
              {c.fotoUrl ? (
                <div className="h-44 w-full bg-slate-900 relative overflow-hidden group">
                  <img
                    src={c.fotoUrl}
                    alt={c.categoria}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(c.status)}
                  </div>
                </div>
              ) : (
                <div className="h-28 w-full bg-slate-900/80 flex items-center justify-center text-slate-600 border-b border-slate-800 relative">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(c.status)}
                  </div>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-amber-400">{c.categoria}</span>
                    <span>{new Date(c.dataAbertura).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2">
                    {c.quadraNome}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {c.descricao}
                  </p>

                  <div className="text-[11px] text-slate-500">
                    Reportado por: <span className="text-slate-300">{c.autorNome}</span>
                  </div>
                </div>

                {/* Gestão para Usuário GESTOR */}
                {user?.role === 'ROLE_GESTOR' && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                      Atualizar Status (Gestor):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['EM_ANALISE', 'EM_EXECUCAO', 'RESOLVIDO'].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleMudarStatus(c.id, st)}
                          disabled={c.status === st || atualizandoId === c.id}
                          className={`text-[10px] py-1 px-2 rounded-lg font-medium transition-all ${
                            c.status === st
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
