import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, MapPin, User, PlusCircle, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

export default function TurmasList({ user, onOpenNovaTurma }) {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregarTurmas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.turmas.listarTodas();
      setTurmas(data || []);
    } catch {
      setErro('Não foi possível carregar as turmas sociais.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTurmas();
  }, [carregarTurmas]);

  const formatarDia = (dia) => {
    switch (dia) {
      case 'SEGUNDA': return 'Segunda-feira';
      case 'TERCA': return 'Terça-feira';
      case 'QUARTA': return 'Quarta-feira';
      case 'QUINTA': return 'Quinta-feira';
      case 'SEXTA': return 'Sexta-feira';
      case 'SABADO': return 'Sábado';
      case 'DOMINGO': return 'Domingo';
      default: return dia;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-400" />
            <span>Turmas Sociais & Oficinas Esportivas</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Projetos comunitários contínuos liderados por voluntários. Acesso gratuito para jovens e moradores locais.
          </p>
        </div>

        {(user?.role === 'ROLE_VOLUNTARIO' || user?.role === 'ROLE_GESTOR') && (
          <button
            onClick={onOpenNovaTurma}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Turma Social</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Carregando turmas sociais...
        </div>
      ) : erro ? (
        <div className="p-4 rounded-xl bg-rose-500/15 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{erro}</span>
        </div>
      ) : turmas.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center max-w-lg mx-auto">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Nenhuma turma cadastrada ainda</h3>
          <p className="text-xs text-slate-400 mt-1">
            Instrutores voluntários podem registrar aulas de boxe, funcional, futsal e artes marciais para a comunidade.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {turmas.map((t) => (
            <div key={t.id} className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between hover:border-purple-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    {t.modalidade}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Até {t.capacidadeAlunos} alunos
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">
                  {formatarDia(t.diaSemana)}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t.horarioInicio.substring(0, 5)} às {t.horarioFim.substring(0, 5)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quadra: <strong className="text-slate-200">{t.quadraNome}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Instrutor: <strong className="text-slate-200">{t.instrutorNome}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] text-emerald-400 font-medium">● Vagas Gratuitas</span>
                <span className="text-[11px]">Reserva Prioritária Ativa</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
