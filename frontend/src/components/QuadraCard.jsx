import React from 'react';
import { MapPin, Sun, Moon, CalendarPlus, AlertTriangle } from 'lucide-react';

export default function QuadraCard({ quadra, onReservar, onVerChamados }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'DISPONIVEL':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-medium">Disponível</span>;
      case 'EM_MANUTENCAO':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-medium">Em Manutenção</span>;
      default:
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2.5 py-1 rounded-full font-medium">Interditada</span>;
    }
  };

  const getPisoFormatado = (piso) => {
    switch (piso) {
      case 'SINTETICO': return 'Grama Sintética';
      case 'CIMENTO': return 'Concreto Polido';
      case 'ASFALTO': return 'Asfalto Esportivo';
      case 'AREIA': return 'Quadra de Areia';
      case 'MADEIRA': return 'Madeira Flutuante';
      default: return 'Piso Comunitário';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
            {quadra.nome}
          </h3>
          {getStatusBadge(quadra.status)}
        </div>

        <div className="flex items-center text-slate-400 text-xs mb-3 space-x-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{quadra.bairro} — {quadra.logradouro}</span>
        </div>

        {quadra.modalidades && (
          <div className="mb-3 text-[11px] font-semibold text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2.5 py-1 rounded-xl flex items-center space-x-1.5">
            <span>⚡ {quadra.modalidades}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-slate-800/80 text-slate-300 border border-slate-700/50 text-[11px] px-2 py-0.5 rounded-lg">
            {getPisoFormatado(quadra.tipoPiso)}
          </span>

          {quadra.possuiIluminacao ? (
            <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] px-2 py-0.5 rounded-lg flex items-center space-x-1">
              <Moon className="w-3 h-3 text-amber-400" />
              <span>Iluminação Noturna</span>
            </span>
          ) : (
            <span className="bg-slate-800/50 text-slate-400 border border-slate-700/30 text-[11px] px-2 py-0.5 rounded-lg flex items-center space-x-1">
              <Sun className="w-3 h-3 text-slate-400" />
              <span>Apenas Diurno</span>
            </span>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
        <button
          onClick={() => onReservar(quadra)}
          disabled={quadra.status !== 'DISPONIVEL'}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            quadra.status === 'DISPONIVEL'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow hover:scale-[1.02]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Agendar</span>
        </button>

        <button
          onClick={() => onVerChamados(quadra)}
          title="Ver zeladoria / reportar defeito"
          className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/30 transition-all"
        >
          <AlertTriangle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
