import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Crop,
  Check,
  Move
} from 'lucide-react';

export default function FotoEnquadramentoModal({ imagemSrc, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Estados de manipulação
  const [zoom, setZoom] = useState(1);
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });
  const [rotacao, setRotacao] = useState(0); // 0, 90, 180, 270
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processando, setProcessando] = useState(false);

  // Tamanho do viewport do canvas na tela
  const VIEWPORT_SIZE = 340;

  // Carrega a imagem nativa
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imagemSrc;
    img.onload = () => {
      imageRef.current = img;
      // Reseta zoom e posição para centralizar a imagem
      setZoom(1);
      setPosicao({ x: 0, y: 0 });
      setRotacao(0);
      desenharCanvas();
    };
  }, [imagemSrc]);

  // Redesenha o canvas sempre que os estados mudarem
  useEffect(() => {
    desenharCanvas();
  }, [zoom, posicao, rotacao]);

  const desenharCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Ajusta resolução do canvas para o viewport
    canvas.width = VIEWPORT_SIZE;
    canvas.height = VIEWPORT_SIZE;

    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    // Salva o contexto para transformações
    ctx.save();

    // Move a origem para o centro do canvas
    ctx.translate(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2);
    ctx.rotate((rotacao * Math.PI) / 180);

    // Escala e calcula proporções para cobrir o círculo (cover)
    const aspect = img.width / img.height;
    let drawWidth, drawHeight;

    if (aspect > 1) {
      drawHeight = VIEWPORT_SIZE * zoom;
      drawWidth = drawHeight * aspect;
    } else {
      drawWidth = VIEWPORT_SIZE * zoom;
      drawHeight = drawWidth / aspect;
    }

    // Desenha a imagem centralizada + offset do usuário
    ctx.drawImage(
      img,
      -drawWidth / 2 + posicao.x,
      -drawHeight / 2 + posicao.y,
      drawWidth,
      drawHeight
    );

    ctx.restore();
  };

  // Handlers de mouse para arraste (Pan)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - posicao.x,
      y: e.clientY - posicao.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosicao({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handlers de touch para celular
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({
        x: touch.clientX - posicao.x,
        y: touch.clientY - posicao.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosicao({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Controle de scroll do mouse para zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  // Gira 90 graus no sentido horário
  const handleGirar = () => {
    setRotacao((prev) => (prev + 90) % 360);
    setPosicao({ x: 0, y: 0 });
  };

  // Reseta posição e zoom
  const handleResetar = () => {
    setZoom(1);
    setPosicao({ x: 0, y: 0 });
    setRotacao(0);
  };

  // Gera o arquivo final recortado e enquadrado
  const handleConfirmar = () => {
    if (!imageRef.current) return;
    setProcessando(true);

    try {
      // Cria um canvas em alta resolução para o avatar final (512x512)
      const exportSize = 512;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;
      const ctx = exportCanvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Salva contexto
      ctx.save();
      ctx.translate(exportSize / 2, exportSize / 2);
      ctx.rotate((rotacao * Math.PI) / 180);

      const scaleFactor = exportSize / VIEWPORT_SIZE;
      const img = imageRef.current;
      const aspect = img.width / img.height;
      let drawWidth, drawHeight;

      if (aspect > 1) {
        drawHeight = exportSize * zoom;
        drawWidth = drawHeight * aspect;
      } else {
        drawWidth = exportSize * zoom;
        drawHeight = drawWidth / aspect;
      }

      ctx.drawImage(
        img,
        -drawWidth / 2 + posicao.x * scaleFactor,
        -drawHeight / 2 + posicao.y * scaleFactor,
        drawWidth,
        drawHeight
      );

      ctx.restore();

      // Exporta como arquivo JPEG de alta qualidade
      exportCanvas.toBlob(
        (blob) => {
          if (!blob) {
            setProcessando(false);
            return;
          }
          const file = new File([blob], 'avatar_enquadrado.jpg', { type: 'image/jpeg' });
          onConfirm(file);
        },
        'image/jpeg',
        0.95
      );
    } catch {
      setProcessando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700 shadow-2xl relative flex flex-col">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Enquadrar Foto de Perfil</h3>
              <p className="text-xs text-slate-400">
                Arraste a imagem e ajuste o zoom para centralizar no círculo.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Interativo com Máscara Circular */}
        <div className="my-6 flex flex-col items-center">
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing border border-slate-800 select-none bg-slate-950"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Canvas que renderiza a imagem com transformações */}
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Máscara Circular SVG com vinheta externa */}
            <div className="absolute inset-0 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 340 340">
                <defs>
                  <mask id="circle-cutout">
                    <rect width="100%" height="100%" fill="white" />
                    <circle cx="170" cy="170" r="140" fill="black" />
                  </mask>
                </defs>
                {/* Área externa escura translúcida */}
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(2, 6, 23, 0.75)"
                  mask="url(#circle-cutout)"
                />
                {/* Borda circular esmeralda que demarca o avatar */}
                <circle
                  cx="170"
                  cy="170"
                  r="140"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  className="opacity-80"
                />
              </svg>
            </div>

            {/* Dica flutuante de arraste */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700/60 text-[11px] text-slate-300 shadow">
                <Move className="w-3 h-3 text-emerald-400" />
                <span>Clique e arraste para reposicionar</span>
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Controles de Zoom e Rotação */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
          
          {/* Slider de Zoom */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(prev - 0.2, 1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(prev + 0.2, 3))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-emerald-400 font-semibold w-12 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Botões de Ação Auxiliar: Girar e Resetar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleGirar}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Girar 90 graus no sentido horário"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Girar 90°</span>
              </button>
              <button
                type="button"
                onClick={handleResetar}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Resetar zoom e posição"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Centralizar</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Área do corte: 512x512 px (HD)
            </span>
          </div>
        </div>

        {/* Rodapé com Botões de Cancelar e Confirmar */}
        <div className="mt-5 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={processando}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={processando}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-glow transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{processando ? 'Recortando...' : 'Aplicar e Salvar Foto'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
