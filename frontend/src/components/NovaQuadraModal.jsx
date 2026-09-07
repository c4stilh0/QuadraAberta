import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api/client';

export default function NovaQuadraModal({ onClose, onSuccess }) {
  const [nome, setNome] = useState('');
  const [bairro, setBairro] = useState('Belo Vale');
  const [logradouro, setLogradouro] = useState('');
  const [cep, setCep] = useState('35700-000');
  const [tipoPiso, setTipoPiso] = useState('CIMENTO');
  const [possuiIluminacao, setPossuiIluminacao] = useState(true);
  const [status, setStatus] = useState('DISPONIVEL');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      await api.quadras.criar({
        nome,
        bairro,
        logradouro,
        cep,
        tipoPiso,
        possuiIluminacao,
        status,
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
          <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
            Painel do Gestor Público
          </span>
          <h2 className="text-xl font-bold text-white mt-0.5 flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <span>Cadastrar Nova Quadra</span>
          </h2>
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
            <span>Quadra cadastrada com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome da Quadra
            </label>
            <input
              type="text"
              required
              placeholder="Ex.: Quadra Poliesportiva do Bairro Montreal"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bairro (Sete Lagoas)
              </label>
              <input
                type="text"
                required
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                CEP
              </label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Logradouro (Rua / Av / Praça)
            </label>
            <input
              type="text"
              required
              placeholder="Ex.: Praça da Bíblia, s/n"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Piso
              </label>
              <select
                value={tipoPiso}
                onChange={(e) => setTipoPiso(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="CIMENTO">Concreto Polido</option>
                <option value="SINTETICO">Grama Sintética</option>
                <option value="ASFALTO">Asfalto</option>
                <option value="AREIA">Areia</option>
                <option value="MADEIRA">Madeira</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="DISPONIVEL">Disponível</option>
                <option value="EM_MANUTENCAO">Em Manutenção</option>
                <option value="INTERDITADA">Interditada</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="possuiIluminacao"
              checked={possuiIluminacao}
              onChange={(e) => setPossuiIluminacao(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
            />
            <label htmlFor="possuiIluminacao" className="text-xs text-slate-300 cursor-pointer">
              Possui refletores para iluminação noturna
            </label>
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
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-glow-amber transition-all disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Cadastrar Quadra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
