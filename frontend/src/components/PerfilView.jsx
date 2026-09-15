import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  Save,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Dumbbell,
  HeartHandshake,
  Award,
  Loader2,
  Star,
  Zap,
  TrendingUp
} from 'lucide-react';
import { api } from '../api/client';
import FotoEnquadramentoModal from './FotoEnquadramentoModal';

export default function PerfilView({ user, onUpdateUser }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [imagemParaEnquadrar, setImagemParaEnquadrar] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [erro, setErro] = useState(null);

  // Form states
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [role, setRole] = useState('');
  const [objetivo, setObjetivo] = useState('PRATICAR_ESPORTES');
  const [reputacao, setReputacao] = useState(5.0);
  const [totalAvaliacoesReputacao, setTotalAvaliacoesReputacao] = useState(0);
  const [habilidadeDeclarada, setHabilidadeDeclarada] = useState('JOGADOR_CASUAL');
  const [habilidadeDeclaradaDescricao, setHabilidadeDeclaradaDescricao] = useState('Jogador Casual');
  const [habilidadeValidada, setHabilidadeValidada] = useState(null);
  const [habilidadeValidadaDescricao, setHabilidadeValidadaDescricao] = useState(null);
  const [totalAvaliacoesHabilidade, setTotalAvaliacoesHabilidade] = useState(0);
  const [nivelConfirmadoPelaComunidade, setNivelConfirmadoPelaComunidade] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      setLoading(true);
      setErro(null);
      const perfil = await api.usuarios.obterPerfil();
      setNome(perfil.nome || '');
      setTelefone(perfil.telefone || '');
      setEmail(perfil.email || '');
      setCpf(perfil.cpf || '');
      setFotoUrl(perfil.fotoUrl || '');
      setRole(perfil.role || '');
      setObjetivo(perfil.objetivo || 'PRATICAR_ESPORTES');
      setReputacao(perfil.reputacao != null ? perfil.reputacao : 5.0);
      setTotalAvaliacoesReputacao(perfil.totalAvaliacoesReputacao || 0);
      setHabilidadeDeclarada(perfil.habilidadeDeclarada || 'JOGADOR_CASUAL');
      setHabilidadeDeclaradaDescricao(perfil.habilidadeDeclaradaDescricao || 'Jogador Casual');
      setHabilidadeValidada(perfil.habilidadeValidada);
      setHabilidadeValidadaDescricao(perfil.habilidadeValidadaDescricao);
      setTotalAvaliacoesHabilidade(perfil.totalAvaliacoesHabilidade || 0);
      setNivelConfirmadoPelaComunidade(!!perfil.nivelConfirmadoPelaComunidade);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar dados do perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('O nome não pode ficar em branco.');
      return;
    }

    try {
      setSaving(true);
      setErro(null);
      setMensagemSucesso(null);

      const atualizado = await api.usuarios.atualizarPerfil({
        nome: nome.trim(),
        telefone: telefone.trim(),
        objetivo: objetivo,
        habilidadeDeclarada: habilidadeDeclarada
      });

      setRole(atualizado.role);
      setFotoUrl(atualizado.fotoUrl);
      setHabilidadeDeclarada(atualizado.habilidadeDeclarada);
      setHabilidadeDeclaradaDescricao(atualizado.habilidadeDeclaradaDescricao);
      setMensagemSucesso('Perfil atualizado com sucesso!');

      // Sincroniza estado global do usuário no App e Navbar
      if (onUpdateUser) {
        onUpdateUser({
          id: atualizado.id,
          nome: atualizado.nome,
          email: atualizado.email,
          role: atualizado.role,
          fotoUrl: atualizado.fotoUrl,
          objetivo: atualizado.objetivo
        });
      }

      setTimeout(() => setMensagemSucesso(null), 5000);
    } catch (err) {
      setErro(err.message || 'Não foi possível atualizar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de formato
    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione um arquivo de imagem válido (JPEG, PNG ou WebP).');
      return;
    }

    // Validação básica de tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErro('A imagem selecionada deve ter no máximo 10MB.');
      return;
    }

    // Limpa erros anteriores e abre o modal de enquadramento
    setErro(null);
    const objectUrl = URL.createObjectURL(file);
    setImagemParaEnquadrar(objectUrl);

    // Limpa input para permitir selecionar o mesmo arquivo novamente se desejar
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmarEnquadramento = async (croppedFile) => {
    setImagemParaEnquadrar(null);

    const formData = new FormData();
    formData.append('foto', croppedFile);
    formData.append('arquivo', croppedFile);

    try {
      setUploadingFoto(true);
      setErro(null);
      setMensagemSucesso(null);

      const res = await api.usuarios.atualizarFoto(formData);
      setFotoUrl(res.fotoUrl);
      setMensagemSucesso('Foto de perfil enquadrada e atualizada com sucesso!');

      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          fotoUrl: res.fotoUrl
        });
      }

      setTimeout(() => setMensagemSucesso(null), 5000);
    } catch (err) {
      setErro(err.message || 'Erro ao enviar foto para o servidor.');
    } finally {
      setUploadingFoto(false);
    }
  };

  const formatarCpf = (cpfRaw) => {
    if (!cpfRaw) return '—';
    const limpo = cpfRaw.replace(/\D/g, '');
    if (limpo.length === 11) {
      return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpfRaw;
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'ROLE_GESTOR':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Shield className="w-3.5 h-3.5" />
            <span>Gestor Público Municipal</span>
          </span>
        );
      case 'ROLE_VOLUNTARIO':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Instrutor Voluntário Credenciado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <User className="w-3.5 h-3.5" />
            <span>Morador Comunitário</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-400" />
        <p className="text-sm">Carregando seu perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      
      {/* Cabeçalho da Aba de Perfil */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-glow">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Meu Perfil
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Gerencie suas informações pessoais, foto e seu objetivo no ecossistema esportivo comunitário.
            </p>
          </div>
        </div>
      </div>

      {/* Alertas de Notificação */}
      {mensagemSucesso && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-sm text-emerald-200 flex items-center space-x-3 shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-sm text-rose-200 flex items-center space-x-3 shadow-lg shadow-rose-950/40">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Card de Avatar & Nível de Acesso */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col items-center text-center relative overflow-hidden">
          {/* Luz de fundo */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-emerald-600/10 to-transparent pointer-events-none" />

          {/* Avatar com botão de upload */}
          <div className="relative group mb-4 mt-2">
            <div className="w-32 h-32 rounded-full ring-4 ring-emerald-500/30 overflow-hidden bg-slate-900 flex items-center justify-center shadow-xl">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={nome || 'Usuário'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center text-3xl font-black text-emerald-400">
                  {nome ? nome.charAt(0).toUpperCase() : <User className="w-12 h-12 text-slate-500" />}
                </div>
              )}
            </div>

            {/* Botão de câmera/upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFoto}
              title="Alterar foto de perfil"
              className="absolute bottom-1 right-1 p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg border-2 border-slate-950 transition-all hover:scale-110 disabled:opacity-50"
            >
              {uploadingFoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={handleFotoChange}
            />
          </div>

          <h2 className="text-lg font-bold text-white mb-1">{nome || 'Seu Nome'}</h2>
          <p className="text-xs text-slate-400 mb-3">{email}</p>
          
          <div className="mb-4">
            {getRoleBadge(role)}
          </div>

          <div className="w-full pt-4 border-t border-slate-800/80 text-left text-xs text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Objetivo Atual:</span>
              <span className="font-semibold text-slate-200">
                {objetivo === 'PRATICAR_ESPORTES' && '⚽ Praticar Esportes'}
                {objetivo === 'PROMOVER_AULAS' && '🥊 Promover Aulas'}
                {objetivo === 'AMBOS' && '⭐ Ambos'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">CPF Registrado:</span>
              <span className="font-mono text-slate-300">{formatarCpf(cpf)}</span>
            </div>
          </div>

          {/* Card de Reputação Estilo Uber */}
          <div className="w-full mt-5 pt-4 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Reputação Fair Play</span>
                </span>
                <span className="text-[10px] text-slate-400">Estilo Uber</span>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-amber-400">
                  {reputacao.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">/ 5.0</span>
                <div className="flex items-center space-x-0.5 ml-auto text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= Math.round(reputacao)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-2">
                {totalAvaliacoesReputacao === 0
                  ? 'Nota máxima inicial (5.0). Mantenha seu bom comportamento nas partidas comunitárias!'
                  : `${totalAvaliacoesReputacao} avaliações anônimas recebidas dos colegas de quadra.`}
              </p>

              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center space-x-1.5 text-[10px] text-emerald-400 font-semibold">
                <Shield className="w-3 h-3" />
                <span>Amortecimento dinâmico de streak ativo</span>
              </div>
            </div>
          </div>

          {/* Card de Habilidade Comunitária */}
          <div className="w-full mt-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>Nível de Habilidade</span>
                </span>
                {nivelConfirmadoPelaComunidade && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✓ Validado
                  </span>
                )}
              </div>

              <div className="text-sm font-bold text-white mb-1">
                {habilidadeDeclaradaDescricao}
              </div>

              <div className="text-[11px] text-slate-400">
                {nivelConfirmadoPelaComunidade ? (
                  <span className="text-emerald-300 font-medium">
                    Confirmado pelos colegas de time com média de {habilidadeValidada?.toFixed(1)}/4.0 ({totalAvaliacoesHabilidade} votos).
                  </span>
                ) : totalAvaliacoesHabilidade > 0 ? (
                  <span>
                    Em validação pelos pares: média atual de {habilidadeValidada?.toFixed(1)}/4.0 ({totalAvaliacoesHabilidade} {totalAvaliacoesHabilidade === 1 ? 'voto' : 'votos'}).
                  </span>
                ) : (
                  <span>Aguardando avaliações dos colegas em partidas para validação de categoria.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Formulário de Dados e Escolha de Objetivo */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSalvar} className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Informações Pessoais</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome Completo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(31) 99999-9999"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* CPF (Somente leitura para segurança do cadastro) */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  CPF (Identificação Cidadã)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    disabled
                    value={formatarCpf(cpf)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              {/* E-mail (Somente leitura) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  E-mail de Login
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* SELEÇÃO DA AUTOAVALIAÇÃO DE HABILIDADE TÉCNICA (4 NÍVEIS) */}
            <div className="pt-4 border-t border-slate-800">
              <div className="mb-3">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-sky-400" />
                  <label className="block text-sm font-bold text-white">
                    Autoavaliação de Habilidade Esportiva
                  </label>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Como você se classifica tecnicamente? Outros jogadores validarão sua categoria de forma anônima após as partidas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* 1. Iniciante */}
                <div
                  onClick={() => setHabilidadeDeclarada('JOGADOR_INICIANTE')}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                    habilidadeDeclarada === 'JOGADOR_INICIANTE'
                      ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-950/40'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Jogador Iniciante</span>
                    {habilidadeDeclarada === 'JOGADOR_INICIANTE' && (
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Dando os primeiros passos, aprendendo os fundamentos e regras básicas da modalidade.
                  </p>
                </div>

                {/* 2. Casual */}
                <div
                  onClick={() => setHabilidadeDeclarada('JOGADOR_CASUAL')}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                    habilidadeDeclarada === 'JOGADOR_CASUAL'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Jogador Casual</span>
                    {habilidadeDeclarada === 'JOGADOR_CASUAL' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Joga por pura diversão e saúde, em ritmo leve e descontraído, sem compromisso competitivo.
                  </p>
                </div>

                {/* 3. Amador */}
                <div
                  onClick={() => setHabilidadeDeclarada('JOGADOR_AMADOR')}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                    habilidadeDeclarada === 'JOGADOR_AMADOR'
                      ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/40'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Jogador Amador</span>
                    {habilidadeDeclarada === 'JOGADOR_AMADOR' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Domina os fundamentos, possui boa intensidade física, noção tática e bom ritmo de jogo.
                  </p>
                </div>

                {/* 4. Profissional */}
                <div
                  onClick={() => setHabilidadeDeclarada('JOGADOR_PROFISSIONAL')}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                    habilidadeDeclarada === 'JOGADOR_PROFISSIONAL'
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/40'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Jogador Profissional</span>
                    {habilidadeDeclarada === 'JOGADOR_PROFISSIONAL' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Alto rendimento técnico, experiência federada, histórico em torneios ou atleta semiprofissional.
                  </p>
                </div>

              </div>
            </div>

            {/* SELEÇÃO DO OBJETIVO DO USUÁRIO */}
            <div className="pt-4 border-t border-slate-800">
              <div className="mb-3">
                <label className="block text-sm font-bold text-white mb-1">
                  Qual é o seu principal objetivo no QuadraAberta?
                </label>
                <p className="text-xs text-slate-400">
                  Indique sua atuação para personalizar sua experiência e liberar privilégios comunitários.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                
                {/* Opção 1: Praticar Esportes */}
                <div
                  onClick={() => setObjetivo('PRATICAR_ESPORTES')}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start space-x-3.5 ${
                    objetivo === 'PRATICAR_ESPORTES'
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/50'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    objetivo === 'PRATICAR_ESPORTES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        Praticar Esportes e Lazer
                      </span>
                      {objetivo === 'PRATICAR_ESPORTES' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Quero reservar horários nas quadras públicas para jogar com meus amigos e vizinhos com garantia antimonopólio.
                    </p>
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-800 text-slate-300">
                      Perfil: Morador Comunitário
                    </span>
                  </div>
                </div>

                {/* Opção 2: Promover Aulas Gratuitas */}
                <div
                  onClick={() => setObjetivo('PROMOVER_AULAS')}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start space-x-3.5 ${
                    objetivo === 'PROMOVER_AULAS'
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/50'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    objetivo === 'PROMOVER_AULAS' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">
                          Promover Aulas e Treinos Gratuitos
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Impacto Social
                        </span>
                      </div>
                      {objetivo === 'PROMOVER_AULAS' && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Sou educador físico, atleta ou líder esportivo e quero organizar escolinhas e treinos gratuitos para crianças, jovens e comunidade.
                    </p>
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-md font-semibold bg-purple-900/40 text-purple-200 border border-purple-700/30">
                      Habilita: Criador de Turmas Sociais (Instrutor Voluntário)
                    </span>
                  </div>
                </div>

                {/* Opção 3: Ambos */}
                <div
                  onClick={() => setObjetivo('AMBOS')}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start space-x-3.5 ${
                    objetivo === 'AMBOS'
                      ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-950/50'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    objetivo === 'AMBOS' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        Ambos (Praticar Esportes e Oferecer Aulas)
                      </span>
                      {objetivo === 'AMBOS' && (
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Quero jogar no tempo livre e também doar tempo para treinar turmas comunitárias nos espaços públicos.
                    </p>
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-md font-semibold bg-sky-900/40 text-sky-200 border border-sky-700/30">
                      Habilita: Praticante Ativo + Instrutor Voluntário
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Botão de Envio */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-glow transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando alterações...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Modal Interativo de Enquadramento e Recorte */}
      {imagemParaEnquadrar && (
        <FotoEnquadramentoModal
          imagemSrc={imagemParaEnquadrar}
          onConfirm={handleConfirmarEnquadramento}
          onCancel={() => setImagemParaEnquadrar(null)}
        />
      )}
    </div>
  );
}
