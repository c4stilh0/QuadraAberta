import React, { useState } from 'react';
import { X, Clock, Calendar, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';

export default function ReservaModal({ quadra, user, onClose, onSuccess }) {
  const [data, setData] = useState(() => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    return amanha.toISOString().split('T')[0];
  });
  const [horaInicio, setHoraInicio] = useState('18:00');
  const [duracaoMinutos, setDuracaoMinutos] = useState(60);
  const [tipoReserva, setTipoReserva] = useState('PARTIDA_AVULSA');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const dataInicioStr = `${data}T${horaInicio}:00`;
      const inicioDate = new Date(dataInicioStr);
      const fimDate = new Date(inicioDate.getTime() + duracaoMinutos * 60000);
      
      const ano = fimDate.getFullYear();
      const mes = String(fimDate.getMonth() + 1).padStart(2, '0');
      const dia = String(fimDate.getDate()).padStart(2, '0');
      const hora = String(fimDate.getHours()).padStart(2, '0');
      const min = String(fimDate.getMinutes()).padStart(2, '0');
      const dataFimStr = `${ano}-${mes}-${dia}T${hora}:${min}:00`;

      const payload = {
        quadraId: quadra.id,
        dataInicio: dataInicioStr,
        dataFim: dataFimStr,
        tipoReserva: tipoReserva,
      };

      await api.reservas.criar(payload);
      setSucesso(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
            Novo Agendamento
          </span>
          <h2 className="text-xl font-bold text-white mt-0.5">
            {quadra.nome}
          </h2>
          <p className="text-xs text-slate-400">
            {quadra.bairro} — {quadra.logradouro}
          </p>
        </div>

        {/* Notificação de Regras Críticas */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 mb-5 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center text-amber-300 font-semibold space-x-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>Regras Comunitárias em Vigor:</span>
          </div>
          <ul className="list-disc list-inside text-slate-400 space-y-0.5 pl-1">
            <li>Teto máximo de <strong className="text-slate-200">2 horas consecutivas</strong> por reserva.</li>
            <li>Limite antimonopólio de <strong className="text-slate-200">2 reservas ativas futuras</strong> por morador.</li>
            <li>Turmas sociais regulares possuem prioridade sobre partidas avulsas.</li>
          </ul>
        </div>

        {erro && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Não foi possível reservar:</p>
              <p>{erro}</p>
            </div>
          </div>
        )}

        {sucesso && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Reserva confirmada com sucesso! Atualizando calendário...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Data do Jogo
            </label>
            <div className="relative">
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <Calendar className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Horário de Início
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <Clock className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Duração (Máx 2h)
              </label>
              <select
                value={duracaoMinutos}
                onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value={60}>1 hora (60 min)</option>
                <option value={90}>1 hora e meia (90 min)</option>
                <option value={120}>2 horas (Teto máximo)</option>
              </select>
            </div>
          </div>

          {user?.role === 'ROLE_VOLUNTARIO' || user?.role === 'ROLE_GESTOR' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Agendamento
              </label>
              <select
                value={tipoReserva}
                onChange={(e) => setTipoReserva(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="PARTIDA_AVULSA">Partida Avulsa (Comunitária)</option>
                <option value="AULA_SOCIAL">Aula de Projeto Social</option>
              </select>
            </div>
          ) : null}

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || sucesso}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all disabled:opacity-50"
            >
              {loading ? 'Validando disponibilidade...' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
