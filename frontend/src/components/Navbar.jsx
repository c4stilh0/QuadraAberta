import React from 'react';
import { Trophy, Calendar, Users, Wrench, LogIn, LogOut, PlusCircle, User } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout, onOpenNovaQuadra }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'ROLE_GESTOR':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Gestor Público</span>;
      case 'ROLE_VOLUNTARIO':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Instrutor Voluntário</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">Morador Comunitário</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Cidade */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('quadras')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-glow">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                QuadraAberta
              </span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-emerald-400/80 -mt-1">
                Sete Lagoas e Região
              </span>
            </div>
          </div>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('quadras')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'quadras'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Quadras & Reservas</span>
            </button>

            <button
              onClick={() => setActiveTab('turmas')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'turmas'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Turmas Sociais</span>
            </button>

            <button
              onClick={() => setActiveTab('zeladoria')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'zeladoria'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Zeladoria Participativa</span>
            </button>

            {user && (
              <button
                onClick={() => setActiveTab('perfil')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'perfil'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Meu Perfil</span>
              </button>
            )}
          </nav>

          {/* Ações de Usuário & Gestor */}
          <div className="flex items-center space-x-3">
            {user?.role === 'ROLE_GESTOR' && (
              <button
                onClick={onOpenNovaQuadra}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nova Quadra</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('perfil')}
                  className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-800/60 transition-all text-left group"
                  title="Gerenciar Meu Perfil"
                >
                  <div className="w-8 h-8 rounded-full ring-2 ring-emerald-500/30 overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
                    {user.fotoUrl ? (
                      <img src={user.fotoUrl} alt={user.nome} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-emerald-400">
                        {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 transition-colors">
                      {user.nome}
                    </span>
                    {getRoleBadge(user.role)}
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  title="Sair da conta"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all hover:scale-[1.02]"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar / Cadastrar</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Navegação Mobile */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-2 bg-slate-950/80 backdrop-blur">
        <button
          onClick={() => setActiveTab('quadras')}
          className={`flex flex-col items-center py-1 px-3 text-xs ${
            activeTab === 'quadras' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4 mb-1" />
          <span>Quadras</span>
        </button>
        <button
          onClick={() => setActiveTab('turmas')}
          className={`flex flex-col items-center py-1 px-3 text-xs ${
            activeTab === 'turmas' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Users className="w-4 h-4 mb-1" />
          <span>Turmas</span>
        </button>
        <button
          onClick={() => setActiveTab('zeladoria')}
          className={`flex flex-col items-center py-1 px-3 text-xs ${
            activeTab === 'zeladoria' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Wrench className="w-4 h-4 mb-1" />
          <span>Zeladoria</span>
        </button>
        {user && (
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center py-1 px-3 text-xs ${
              activeTab === 'perfil' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <User className="w-4 h-4 mb-1" />
            <span>Perfil</span>
          </button>
        )}
      </div>
    </header>
  );
}
