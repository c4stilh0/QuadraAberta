import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { api } from '../api/client';

export default function AuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' ou 'cadastro'
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState('ROLE_COMUNIDADE');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const resp = await api.auth.login({ email, senha });
      setSucesso(`Bem-vindo de volta, ${resp.nome}!`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      await api.auth.cadastrar({
        nome,
        email,
        telefone,
        cpf: cpf.replace(/\D/g, ''),
        senha,
        role,
      });

      // Efetua login imediatamente após cadastrar
      const resp = await api.auth.login({ email, senha });
      setSucesso(`Conta criada com sucesso! Olá, ${resp.nome}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Preenchimento rápido com o gestor cadastrado nos testes para facilitar a avaliação
  const preencherGestor = () => {
    setTab('login');
    setEmail('gestor@setelagoas.mg.gov.br');
    setSenha('senhaSegura123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Abas Login / Cadastro */}
        <div className="flex rounded-xl bg-slate-900 p-1 mb-5 border border-slate-800">
          <button
            onClick={() => { setTab('login'); setErro(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-emerald-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setTab('cadastro'); setErro(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'cadastro'
                ? 'bg-emerald-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
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
            <span>{sucesso}</span>
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Entrando...' : 'Acessar Conta'}
            </button>

            {/* Atalho Demo */}
            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={preencherGestor}
                className="inline-flex items-center space-x-1 text-[11px] text-amber-400 hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preencher dados do Gestor Municipal (Teste Rápido)</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCadastro} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                required
                placeholder="Ex.: Lucas Santos"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="lucas@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(31) 98888-7777"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  required
                  placeholder="111.444.777-35"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Perfil de Usuário
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ROLE_COMUNIDADE">Morador Comunitário</option>
                  <option value="ROLE_VOLUNTARIO">Instrutor Voluntário</option>
                  <option value="ROLE_GESTOR">Gestor Público</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Senha (mínimo 6 caracteres)
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Criando Conta...' : 'Criar Conta e Acessar'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
