import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Sparkles, Eye, EyeOff, KeyRound } from 'lucide-react';
import { api } from '../api/client';

export default function AuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'cadastro' | 'redefinir'
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState('ROLE_COMUNIDADE');
  const showDemoShortcuts =
    import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_LOGIN !== 'false');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(null);

    const emailLimpo = email.trim();
    if (!emailLimpo) {
      setErro('Por favor, informe seu e-mail.');
      return;
    }
    if (!senha) {
      setErro('Por favor, informe sua senha.');
      return;
    }

    setLoading(true);

    try {
      const resp = await api.auth.login({ email: emailLimpo, senha });
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
        email: email.trim(),
        telefone,
        cpf: cpf.replace(/\D/g, ''),
        senha,
        role,
      });

      // Efetua login imediatamente após cadastrar
      const resp = await api.auth.login({ email: email.trim(), senha });
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

  const handleRedefinirSenha = async (e) => {
    e.preventDefault();
    setErro(null);

    const emailLimpo = email.trim();
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!emailLimpo) {
      setErro('Por favor, informe o e-mail cadastrado.');
      return;
    }
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      setErro('Informe os 11 dígitos do CPF cadastrado para confirmar sua identidade.');
      return;
    }
    if (!novaSenha || novaSenha.length < 6) {
      setErro('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await api.auth.redefinirSenha({ email: emailLimpo, cpf: cpfLimpo, novaSenha });
      setSucesso('Senha redefinida com sucesso! Acessando sua conta...');
      
      // Conecta automaticamente com a nova senha escolhida
      await api.auth.login({ email: emailLimpo, senha: novaSenha });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 900);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Login direto com 1 clique para os perfis padrão de teste
  const entrarDireto = async (emailTeste, senhaTeste) => {
    setTab('login');
    setErro(null);
    setEmail(emailTeste);
    setSenha(senhaTeste);
    setLoading(true);

    try {
      const resp = await api.auth.login({ email: emailTeste, senha: senhaTeste });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Abas Login / Cadastro / Redefinir */}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => { setTab('redefinir'); setErro(null); setNovaSenha(''); }}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                  title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Entrando...' : 'Acessar Conta'}
            </button>

            {/* Atalhos com 1 Clique (apenas dev ou quando habilitado explicitamente) */}
            {showDemoShortcuts && (
              <div className="pt-3 border-t border-slate-800 space-y-2 text-center">
                <p className="text-[10px] text-slate-400 font-medium">
                  Acesso direto de teste com 1 clique (Senha: <strong className="text-slate-300 font-mono">senhaSegura123</strong>):
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => entrarDireto('gestor@setelagoas.mg.gov.br', 'senhaSegura123')}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] text-amber-300 font-semibold transition-all inline-flex items-center justify-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Entrar como Gestor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => entrarDireto('viniciuscastilho8@gmail.com', 'senhaSegura123')}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold transition-all inline-flex items-center justify-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Entrar como Morador</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : tab === 'cadastro' ? (
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
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Senha (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Crie sua senha segura"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Criando Conta...' : 'Criar Conta e Acessar'}
            </button>
          </form>
        ) : (
          /* Aba / Formulário de Redefinição de Senha */
          <form onSubmit={handleRedefinirSenha} className="space-y-3.5">
            <div className="flex items-center space-x-2 text-sm font-bold text-white mb-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Redefinir Senha de Acesso</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seu E-mail Cadastrado
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
                CPF Cadastrado (Verificação de Identidade)
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
                Nova Senha Desejada (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Digite sua nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                  title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-glow transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Atualizando senha...' : 'Salvar Nova Senha e Acessar'}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => { setTab('login'); setErro(null); }}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Voltar para a tela de login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
