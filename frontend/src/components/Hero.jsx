import React from 'react';
import { ShieldCheck, Clock, Camera, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Esporte Comunitário e Cidadania em Sete Lagoas</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight sm:leading-tight">
          Quadras públicas acessíveis,{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            organizadas e bem cuidadas.
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Agende partidas avulsas sem brigas de horário, participe de projetos sociais voluntários e cuide do seu bairro reportando manutenções com envio de fotos.
        </p>

        {/* 3 Pilares do Sistema */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="glass-card p-4 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Antimonopólio & Concorrência</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Teto de 2 horas consecutivas e limite de 2 agendamentos ativos por morador para que todos possam jogar.
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Prioridade Social</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Aulas gratuitas de boxe, treino funcional e futsal promovidas por voluntários têm reserva prioritária garantida.
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Zeladoria Participativa</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Envie fotos de alambrados quebrados ou refletores queimados e acompanhe o conserto pela prefeitura e ONGs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
