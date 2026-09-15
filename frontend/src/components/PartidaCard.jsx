import React from 'react';
import { Calendar, Clock, MapPin, Users, Trophy, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ESPORTES_CONFIG } from './NovaPartidaModal';

export default function PartidaCard({ partida, onVerDetalhes, user }) {
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
  });

  const horaFormatada = new Date(rawDataHora).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const quadraDefinida = partida.quadraEscolhida || partida.quadraDefinida;
  const tituloPartida = partida.titulo || partida.descricao || `Partida de ${esporteCfg.label}`;

  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.01] flex flex-col justify-between shadow-xl relative overflow-hidden group">
      
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />

      <div>
        {/* Topo do Card: Ícone do Esporte + Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{esporteCfg.icon}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {esporteCfg.label}
            </span>
          </div>

          {partida.status === 'QUADRA_DEFINIDA' ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1 shadow-glow">
              <Trophy className="w-3 h-3 text-emerald-400" />
              <span>Quadra Fixada</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              <span>Buscando Jogadores</span>
            </span>
          )}
        </div>

        {/* Título da Partida */}
        <h3 className="text-base font-bold text-white mb-2 leading-snug line-clamp-2">
          {tituloPartida}
        </h3>

        {/* Data e Horário */}
        <div className="flex items-center space-x-4 text-xs text-slate-300 mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">{dataFormatada}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{horaFormatada} ({partida.duracaoMinutos}m)</span>
          </div>
        </div>

        {/* Localização / Privacidade */}
        <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-4 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-sky-400" />
              <span>{totalParts <= 1 ? 'Bairro do Criador' : 'Centróide do Grupo'}</span>
            </span>
            <ShieldCheck className="w-3 h-3 text-emerald-400" title="Privacidade preservada" />
          </div>
          <p className="font-semibold text-slate-200 truncate">
            {partida.bairroExibicao || partida.bairroCriador || partida.criadorBairro}
          </p>

          {quadraDefinida && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-emerald-300 flex items-center space-x-1">
              <Trophy className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">Local: <strong>{quadraDefinida.nome}</strong></span>
            </div>
          )}
        </div>

        {/* Barra de Quórum */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center space-x-1 text-[11px]">
              <Users className="w-3 h-3 text-slate-400" />
              <span>{totalParts} de {minJog} necessários</span>
            </span>
            <span className={`text-[11px] font-bold ${quorumAtingido ? 'text-emerald-400' : 'text-amber-400'}`}>
              {quorumAtingido ? 'Quórum atingido' : `Faltam ${Math.max(0, minJog - totalParts)}`}
            </span>
          </div>

          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                quorumAtingido 
                  ? 'bg-emerald-500 shadow-glow' 
                  : 'bg-amber-500'
              }`}
              style={{ width: `${porcentagemQuorum}%` }}
            />
          </div>
        </div>

        {/* Indicador se o usuário atual já participa */}
        {isParticipante && (
          <div className="mb-3 text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
            <span>✓ Você está confirmado nesta partida</span>
            {isCriador && <span className="text-amber-400">(Organizador)</span>}
          </div>
        )}
      </div>

      {/* Botão para ver detalhes e sugestões */}
      <button
        type="button"
        onClick={() => onVerDetalhes(partida)}
        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-600 text-white hover:shadow-glow transition-all flex items-center justify-center space-x-1.5 group-hover:border-emerald-500/50"
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
        <span>Ver 3 Quadras Sugeridas & Entrar</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

    </div>
  );
}
