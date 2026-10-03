import React, { useState } from 'react';
import {
  FolderGit2,
  Download,
  Copy,
  Check,
  FileCode,
  FileText,
  Terminal,
  Code2,
  Folder,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Archive
} from 'lucide-react';
import JSZip from 'jszip';
import { getRepositoryFiles } from '../utils/repositoryFiles';
import { RepoFile } from '../types';

export const RepoExplorer: React.FC = () => {
  const files: RepoFile[] = getRepositoryFiles();
  const [selectedFile, setSelectedFile] = useState<RepoFile>(files[0]);
  const [copiedFileContent, setCopiedFileContent] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFileContent(true);
    setTimeout(() => setCopiedFileContent(false), 2000);
  };

  const handleDownloadSingleFile = (file: RepoFile) => {
    const mimeTypes: Record<string, string> = {
      json: 'application/json',
      markdown: 'text/markdown',
      python: 'text/x-python',
      bash: 'application/x-sh',
      text: 'text/plain',
      html: 'text/html'
    };
    const blob = new Blob([file.content], { type: mimeTypes[file.language] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('gguf-vision-studio');

      files.forEach((file) => {
        if (folder) {
          folder.file(file.path, file.content);
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gguf-vision-studio.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao gerar zip:', err);
      alert('Falha ao compactar arquivos do repositório.');
    } finally {
      setIsZipping(false);
    }
  };

  const getFileIcon = (lang: string) => {
    switch (lang) {
      case 'python':
        return <Code2 className="w-4 h-4 text-amber-400" />;
      case 'bash':
        return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'markdown':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'json':
        return <FileCode className="w-4 h-4 text-purple-400" />;
      default:
        return <FileCode className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FolderGit2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Repositório GitHub: gguf-vision-studio
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Todos os arquivos de código-fonte, scripts de orquestração, notebook do Kaggle e interface web leve estão prontos para envio ao GitHub.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/30 transition active:scale-95 disabled:opacity-50 shrink-0"
        >
          {isZipping ? (
            <span>Compactando arquivos...</span>
          ) : downloadSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Download Concluído!</span>
            </>
          ) : (
            <>
              <Archive className="w-4 h-4" />
              <span>Baixar Repositório Completo (.zip)</span>
            </>
          )}
        </button>
      </div>

      {/* Explorer Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* File Tree (Left) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>Arquivos do Projeto ({files.length})</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[560px] overflow-y-auto">
            {files.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-3 flex items-start gap-2.5 transition text-xs ${
                    isSelected
                      ? 'bg-cyan-500/10 border-l-4 border-cyan-400 text-white'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getFileIcon(file.language)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-medium truncate">{file.path}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {file.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* File Viewer (Right) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow flex flex-col">
          {/* File Header */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon(selectedFile.language)}
              <span className="font-mono text-xs text-white font-semibold">{selectedFile.path}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                {selectedFile.language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadSingleFile(selectedFile)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Baixar apenas este arquivo"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Baixar</span>
              </button>

              <button
                onClick={handleCopyContent}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Copiar código"
              >
                {copiedFileContent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* File Content Body */}
          <div className="p-4 bg-slate-950/70 overflow-auto max-h-[500px] flex-1 font-mono text-xs text-slate-200 leading-relaxed">
            <pre className="whitespace-pre-wrap">{selectedFile.content}</pre>
          </div>
        </div>
      </div>

      {/* GitHub Quick Push Guide */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" /> Como publicar este projeto no seu GitHub
        </h4>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-slate-500"># 1. Extraia o arquivo gguf-vision-studio.zip baixado acima e acesse a pasta</div>
          <div>cd gguf-vision-studio</div>
          <div className="text-slate-500 mt-2"># 2. Inicialize o repositório git e faça o primeiro commit</div>
          <div>git init</div>
          <div>git add .</div>
          <div>git commit -m &quot;feat: inicializacao do gguf-vision-studio com suporte dual t4&quot;</div>
          <div className="text-slate-500 mt-2"># 3. Vincule ao seu repositório no GitHub e envie</div>
          <div>git branch -M main</div>
          <div>git remote add origin https://github.com/SEU_USUARIO/gguf-vision-studio.git</div>
          <div>git push -u origin main</div>
        </div>
      </div>
    </div>
  );
};
