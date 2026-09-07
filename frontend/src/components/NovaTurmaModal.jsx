import React, { useState } from 'react';
import { X, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api/client';

export default function NovaTurmaModal({ quadras, onClose, onSuccess }) {
  const [quadraId, setQuadraId] = useState(quadras[0]?.id || '');
  const [modalidade, setModalidade] = useState('');
  const [diaSemana, setDiaSemana] = useState('SABADO');
  const [horarioInicio, setHorarioInicio] = useState('09:00');
  const [horarioFim, setHorarioFim] = useState('11:00');
  const [capacidadeAlunos, setCapacidadeAlunos] = useState(20);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      await api.turmas.criar({
        quadraId: Number(quadraId),
        modalidade,
        diaSemana,
        horarioInicio: `${horarioInicio}:00`,
        horarioFim: `${horarioFim}:00`,
        capacidadeAlunos: Number(capacidadeAlunos),
      });

      setSucesso(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs uppercase font-bold tracking-wider text-purple-400">
            Ação Comunitária
          </span>
          <h2 className="text-xl font-bold text-white mt-0.5 flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Cadastrar Turma Social</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Esta turma terá reserva de horário prioritária na grade da quadra pública.
          </p>
        </div>

        {erro && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Turma cadastrada com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Quadra Poliesportiva
            </label>
            <select
              value={quadraId}
              onChange={(e) => setQuadraId(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {quadras.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.nome} ({q.bairro})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Modalidade ou Projeto
            </label>
            <input
              type="text"
              required
              placeholder="Ex.: Aulas de Boxe Comunitário, Futsal Sub-15"
              value={modalidade}
              onChange={(e) => setModalidade(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dia da Semana
              </label>
              <select
                value={diaSemana}
                onChange={(e) => setDiaSemana(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="SEGUNDA">Segunda-feira</option>
                <option value="TERCA">Terça-feira</option>
                <option value="QUARTA">Quarta-feira</option>
                <option value="QUINTA">Quinta-feira</option>
                <option value="SEXTA">Sexta-feira</option>
                <option value="SABADO">Sábado</option>
                <option value="DOMINGO">Domingo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Capacidade de Alunos
              </label>
              <input
                type="number"
                min="1"
                required
                value={capacidadeAlunos}
                onChange={(e) => setCapacidadeAlunos(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Horário de Início
              </label>
              <input
                type="time"
                required
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Horário de Término
              </label>
              <input
                type="time"
                required
                value={horarioFim}
                onChange={(e) => setHorarioFim(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || sucesso}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Criar Turma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
