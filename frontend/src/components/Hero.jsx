import React from 'react';
import { ShieldCheck, MapPin, Users, Sparkles, Trophy } from 'lucide-react';

export default function Hero({ onCriarPartida }) {
  return (
    <div className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Novo Matchmaking Esportivo Comunitário em Sete Lagoas</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
          Crie seu jogo, reúna a galera e ache a{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            quadra ideal pelo centróide do grupo.
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Defina o esporte e horário. Conforme outros moradores confirmam presença, o sistema calcula o ponto de equilíbrio de todos e <strong>sugere as 3 melhores quadras de Sete Lagoas</strong> para o organizador escolher!
        </p>

        {onCriarPartida && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={onCriarPartida}
              className="px-6 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-glow transition-all hover:scale-105 flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Criar Partida & Buscar Jogadores</span>
            </button>
          </div>
        )}

        {/* 3 Pilares do Matchmaking */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="glass-card p-4 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Matchmaking & Quórum</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Quórum inteligente para futsal, basquete, vôlei e mais. O time se forma sozinho sem grupo caótico de WhatsApp.
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Top 3 Quadras pelo Centróide</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Cálculo de Haversine em tempo real pondera os bairros de todos e sugere os 3 melhores locais públicos para o criador fixar.
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Privacidade Preservada</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Apenas o bairro e o centróide coletivo são divulgados na sala pública, mantendo as casas dos moradores 100% protegidas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
