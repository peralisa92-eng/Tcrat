import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  HardDrive,
  Activity,
  AlertTriangle,
  Info,
  Terminal
} from 'lucide-react';
import { MODEL_PRESETS } from '../utils/modelPresets';

export const GpuCalculator: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState(MODEL_PRESETS[0]);
  const [gpuSplitRatio, setGpuSplitRatio] = useState<number>(50); // 50% on GPU 0, 50% on GPU 1
  const [contextSize, setContextSize] = useState<number>(8192);
  const [useFlashAttn, setUseFlashAttn] = useState<boolean>(true);
  const [offloadLayers, setOffloadLayers] = useState<number>(99);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  // Kaggle T4 specs
  const TOTAL_GPU0_MB = 15360; // 15GB usable on T4
  const TOTAL_GPU1_MB = 15360;

  // Base model weight size
  const baseModelMb = selectedPreset.estimatedVramMb;
  // mmproj weight size
  const mmprojMb = 850;
  // KV Cache calculation: (2 * layers * heads * dim * contextSize) / 1024 / 1024
  const kvCacheFactor = useFlashAttn ? 0.00012 : 0.00022;
  const kvCacheMb = Math.round(contextSize * kvCacheFactor * 1024);

  // Scratch / CUDA runtime buffer
  const cudaOverheadMb = 650;

  // Total VRAM required
  const totalRequiredMb = baseModelMb + mmprojMb + kvCacheMb + cudaOverheadMb;

  // Memory distribution
  const ratio0 = gpuSplitRatio / 100;
  const ratio1 = (100 - gpuSplitRatio) / 100;

  // With --split-mode row and --tensor-split:
  const gpu0UsedMb = Math.round(baseModelMb * ratio0 + mmprojMb * 0.7 + (kvCacheMb / 2) + cudaOverheadMb);
  const gpu1UsedMb = Math.round(baseModelMb * ratio1 + mmprojMb * 0.3 + (kvCacheMb / 2) + cudaOverheadMb);

  const gpu0Percent = Math.min(100, Math.round((gpu0UsedMb / TOTAL_GPU0_MB) * 100));
  const gpu1Percent = Math.min(100, Math.round((gpu1UsedMb / TOTAL_GPU1_MB) * 100));

  const tensorSplitArg = `${(gpuSplitRatio / 50).toFixed(1).replace('.0', '')},${((100 - gpuSplitRatio) / 50).toFixed(1).replace('.0', '')}`;

  const generatedCommand = `./llama-server \\
  -m models/${selectedPreset.modelFilename} \\
  --mmproj models/${selectedPreset.mmprojFilename} \\
  -ngl ${offloadLayers} \\
  --split-mode row \\
  --tensor-split ${tensorSplitArg === '1,1' ? '1,1' : tensorSplitArg} \\
  -c ${contextSize} \\
  ${useFlashAttn ? '-fa \\' : ''}
  --host 0.0.0.0 \\
  --port 8080`;

  const copyCommand = () => {
    navigator.clipboard.writeText(generatedCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Calculadora de Tensor-Split para 2x GPU NVIDIA T4 (Kaggle)
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          O Kaggle disponibiliza <strong>2 placas NVIDIA Tesla T4 de 16GB cada (32GB total)</strong>. Esta ferramenta calcula a divisão ideal de tensores e memória VRAM para que o modelo GGUF e o projetor de visão operem com máxima aceleração e zero gargalo na CPU.
        </p>
      </div>

      {/* Model & Parameter Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Preset Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:col-span-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
            Modelo Multimodal
          </label>
          <select
            value={selectedPreset.id}
            onChange={(e) => {
              const p = MODEL_PRESETS.find((m) => m.id === e.target.value);
              if (p) setSelectedPreset(p);
            }}
            className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500"
          >
            {MODEL_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {selectedPreset.description}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] space-y-1 text-slate-400">
            <div>
              Arquivo Modelo: <code className="text-cyan-300 font-mono text-[10px]">{selectedPreset.modelFilename}</code>
            </div>
            <div>
              Arquivo Visão: <code className="text-indigo-300 font-mono text-[10px]">{selectedPreset.mmprojFilename}</code>
            </div>
          </div>
        </div>

        {/* Sliders & Toggles */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:col-span-2 space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Divisão de Tensores (GPU 0 vs GPU 1)</span>
              <span className="font-mono text-cyan-400 font-bold">
                {gpuSplitRatio}% GPU 0 / {100 - gpuSplitRatio}% GPU 1 (arg: <code className="text-white">--tensor-split {tensorSplitArg}</code>)
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={gpuSplitRatio}
              onChange={(e) => setGpuSplitRatio(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Mais carga na GPU 0</span>
              <span className="text-cyan-400 font-bold">50% / 50% (Recomendado Kaggle T4)</span>
              <span>Mais carga na GPU 1</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Contexto Máximo (n_ctx)</span>
                <span className="font-mono text-cyan-400 font-bold">{contextSize.toLocaleString()} tokens</span>
              </div>
              <input
                type="range"
                min="2048"
                max="32768"
                step="2048"
                value={contextSize}
                onChange={(e) => setContextSize(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                8192 tokens suportam múltiplas imagens de alta resolução na mesma conversa.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Camadas GPU (-ngl)</span>
                <span className="font-mono text-cyan-400 font-bold">{offloadLayers} (Total)</span>
              </div>
              <input
                type="range"
                min="10"
                max="99"
                step="1"
                value={offloadLayers}
                onChange={(e) => setOffloadLayers(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Valor 99 descarrega 100% dos cálculos para CUDA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={useFlashAttn}
                onChange={(e) => setUseFlashAttn(e.target.checked)}
                className="rounded accent-cyan-500"
              />
              <span>Ativar Flash Attention (<code className="text-cyan-400">-fa</code>)</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Economiza até 50% de VRAM no KV Cache durante a análise de imagens densas.
            </span>
          </div>
        </div>
      </div>

      {/* Visual GPU VRAM Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GPU 0 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">GPU 0 (NVIDIA Tesla T4 #0)</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {gpu0UsedMb.toLocaleString()} MB / {TOTAL_GPU0_MB.toLocaleString()} MB ({gpu0Percent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                gpu0Percent > 90
                  ? 'bg-red-500'
                  : gpu0Percent > 75
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
              }`}
              style={{ width: `${gpu0Percent}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] text-slate-400">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              <span className="block text-slate-500">Tensores LLM</span>
              <strong className="text-slate-200">{Math.round(baseModelMb * ratio0)} MB</strong>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              <span className="block text-slate-500">Vision mmproj</span>
              <strong className="text-cyan-300">{Math.round(mmprojMb * 0.7)} MB</strong>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              <span className="block text-slate-500">VRAM Livre</span>
              <strong className="text-emerald-400">{Math.max(0, TOTAL_GPU0_MB - gpu0UsedMb)} MB</strong>
            </div>
          </div>
        </div>

        {/* GPU 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white text-sm">GPU 1 (NVIDIA Tesla T4 #1)</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {gpu1UsedMb.toLocaleString()} MB / {TOTAL_GPU1_MB.toLocaleString()} MB ({gpu1Percent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                gpu1Percent > 90
                  ? 'bg-red-500'
                  : gpu1Percent > 75
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${gpu1Percent}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] text-slate-400">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              <span className="block text-slate-500">Tensores LLM</span>
              <strong className="text-slate-200">{Math.round(baseModelMb * ratio1)} MB</strong>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              <span className="block text-slate-500">KV Cache</span>
              <strong className="text-indigo-300">{Math.round(kvCacheMb / 2)} MB</strong>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              <span className="block text-slate-500">VRAM Livre</span>
              <strong className="text-emerald-400">{Math.max(0, TOTAL_GPU1_MB - gpu1UsedMb)} MB</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Generated CLI Command Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Comando Gerado para Executar no Kaggle</span>
          </div>
          <button
            onClick={copyCommand}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {copiedCmd ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Comando</span>
              </>
            )}
          </button>
        </div>
        <pre className="font-mono text-xs text-cyan-300 bg-slate-900/90 p-3 rounded-lg overflow-x-auto border border-slate-800/90 leading-relaxed">
          {generatedCommand}
        </pre>
      </div>

      {/* Technical Highlights */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
        <h4 className="font-semibold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" /> Por que a divisão Dual T4 no Kaggle é imbatível?
        </h4>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>
            <strong>32GB VRAM Total:</strong> O modelo quantizado ({selectedPreset.quantization}) ocupa apenas ~4GB a 7GB de memória, sobrando mais de 20GB livres para janelas de contexto gigantescas (8k, 16k ou até 32k tokens) e múltiplos arquivos de imagem simultâneos.
          </li>
          <li>
            <strong>Row-Wise Split:</strong> O parâmetro <code className="text-slate-200">--split-mode row</code> divide as matrizes de atenção e feed-forward diretamente nas duas GPUs, permitindo throughput de inferência de 25 a 35 tokens por segundo.
          </li>
          <li>
            <strong>Zero Custo:</strong> O Kaggle oferece até 30 horas semanais de GPU Dual T4 gratuitamente para contas verificadas.
          </li>
        </ul>
      </div>
    </div>
  );
};
