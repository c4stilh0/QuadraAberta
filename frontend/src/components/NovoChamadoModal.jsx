import React, { useState } from 'react';
import { X, Camera, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { api } from '../api/client';

export default function NovoChamadoModal({ quadras, quadraPreselecionada, onClose, onSuccess }) {
  const [quadraId, setQuadraId] = useState(quadraPreselecionada?.id || quadras[0]?.id || '');
  const [categoria, setCategoria] = useState('ILUMINACAO');
  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('quadraId', quadraId);
      formData.append('categoria', categoria);
      formData.append('descricao', descricao);
      if (foto) {
        formData.append('foto', foto);
      }

      await api.chamados.criar(formData);
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
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
            Zeladoria Comunitária
          </span>
          <h2 className="text-xl font-bold text-white mt-0.5 flex items-center space-x-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <span>Reportar Problema ou Manutenção</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ajude a preservar a quadra do seu bairro. O chamado será acompanhado por gestores e voluntários.
          </p>
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
            <span>Chamado registrado com sucesso com envio de foto!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quadra
              </label>
              <select
                value={quadraId}
                onChange={(e) => setQuadraId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {quadras.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.nome} ({q.bairro})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoria do Defeito
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ILUMINACAO">Iluminação (Refletor queimado)</option>
                <option value="ALAMBRADO">Alambrado (Rede rompida/buraco)</option>
                <option value="PISO">Piso (Rachadura/desnível)</option>
                <option value="LIMPEZA">Limpeza & Entulho</option>
                <option value="OUTROS">Outros reparos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição do Problema
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva o que está danificado (mínimo 10 caracteres)..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 placeholder:text-slate-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Foto Comprobatória (Opcional - JPEG, PNG ou WEBP)
            </label>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 text-xs font-medium transition-all">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Escolher Foto</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </label>
              {foto && (
                <span className="text-xs text-slate-400 truncate max-w-[200px]">
                  {foto.name}
                </span>
              )}
            </div>

            {preview && (
              <div className="mt-2.5 h-28 w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                <img src={preview} alt="Prévia" className="h-full w-full object-cover" />
              </div>
            )}
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
              {loading ? 'Enviando foto ao Cloudinary...' : 'Enviar Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
