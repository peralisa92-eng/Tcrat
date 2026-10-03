import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCode,
  ShieldCheck,
  Server
} from 'lucide-react';
import { getJupyterNotebookContent, USER_MODEL_URL, USER_MMPROJ_URL, MODEL_FILENAME, MMPROJ_FILENAME } from '../utils/repositoryFiles';

export const KaggleGuide: React.FC = () => {
  const [copiedCellIndex, setCopiedCellIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const notebookJsonStr = getJupyterNotebookContent(USER_MODEL_URL, USER_MMPROJ_URL, MODEL_FILENAME, MMPROJ_FILENAME, '1,1', 8192);

  const handleDownloadIpynb = () => {
    const blob = new Blob([notebookJsonStr], { type: 'application/x-ipynb+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kaggle_vision_dual_t4.ipynb';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const notebookData = JSON.parse(notebookJsonStr);
  const cells = notebookData.cells || [];

  const copyCellCode = (source: string[], index: number) => {
    const text = Array.isArray(source) ? source.join('') : source;
    navigator.clipboard.writeText(text);
    setCopiedCellIndex(index);
    setTimeout(() => setCopiedCellIndex(null), 2000);
  };

  const copyAllNotebookCells = () => {
    const fullScript = cells
      .filter((c: any) => c.cell_type === 'code')
      .map((c: any) => (Array.isArray(c.source) ? c.source.join('') : c.source))
      .join('\n\n# ==========================================================\n\n');
    navigator.clipboard.writeText(fullScript);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 mb-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pronto para Kaggle • 2x GPU NVIDIA T4</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Notebook Oficial do Kaggle (.ipynb)
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Execute <code className="text-cyan-300">gemma-4-E4B-it-UD-Q4_K_XL.gguf</code> com o projetor <code className="text-indigo-300">mmproj-F16.gguf</code> com split automático nas 2 GPUs T4 do Kaggle e gere o túnel Cloudflare com 1 clique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadIpynb}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo .ipynb</span>
            </button>

            <a
              href="https://www.kaggle.com/code?initialize=new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <span>Abrir Kaggle</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Step by Step Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm mb-3">
            1
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Configurar Acelerador</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            No Kaggle, abra o painel direito <strong>Notebook options</strong>, selecione <strong>GPU T4 x2</strong> e marque <strong>Internet ON</strong>.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm mb-3">
            2
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Importar Notebook</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Clique em <strong>File &gt; Import Notebook</strong> e selecione o arquivo <code className="text-cyan-300">kaggle_vision_dual_t4.ipynb</code> baixado.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm mb-3">
            3
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Executar Tudo</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Clique em <strong>Run All</strong>. Os modelos serão baixados e o servidor iniciará com a divisão <code className="text-cyan-300">--tensor-split 1,1</code>.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm mb-3">
            4
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Copiar URL do Túnel</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Copie o link <code className="text-indigo-300">https://*.trycloudflare.com</code> exibido na saída e cole no topo do GGUF Vision Studio!
          </p>
        </div>
      </div>

      {/* Cells Viewer Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Conteúdo das Células do Notebook</h3>
        </div>
        <button
          onClick={copyAllNotebookCells}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Código Completo Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Todo o Código em Python</span>
            </>
          )}
        </button>
      </div>

      {/* Cell by Cell Inspection */}
      <div className="space-y-4">
        {cells.map((cell: any, idx: number) => {
          const rawSource = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
          const isCode = cell.cell_type === 'code';

          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isCode ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-300'}`}>
                    {isCode ? `[${idx + 1}] Código Python / Bash` : `[${idx + 1}] Explicação`}
                  </span>
                </div>
                <button
                  onClick={() => copyCellCode(cell.source, idx)}
                  className="hover:text-white flex items-center gap-1 transition"
                  title="Copiar célula"
                >
                  {copiedCellIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 overflow-x-auto text-xs font-mono leading-relaxed">
                {isCode ? (
                  <pre className="text-slate-200">{rawSource}</pre>
                ) : (
                  <div className="font-sans text-slate-300 whitespace-pre-wrap">{rawSource}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
