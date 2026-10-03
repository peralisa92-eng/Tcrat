import React, { useState } from 'react';
import {
  Eye,
  Radio,
  RefreshCw,
  Sliders,
  FileCode,
  Terminal,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ConnectionConfig } from '../types';

interface HeaderProps {
  connection: ConnectionConfig;
  setConnection: React.Dispatch<React.SetStateAction<ConnectionConfig>>;
  activeTab: 'chat' | 'calculator' | 'kaggle' | 'api' | 'repo';
  setActiveTab: (tab: 'chat' | 'calculator' | 'kaggle' | 'api' | 'repo') => void;
  onCheckHealth: () => void;
  isChecking: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connection,
  setConnection,
  activeTab,
  setActiveTab,
  onCheckHealth,
  isChecking
}) => {
  const [showUrlEdit, setShowUrlEdit] = useState(false);
  const [tempUrl, setTempUrl] = useState(connection.baseUrl);

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setConnection(prev => ({ ...prev, baseUrl: tempUrl.trim() }));
    setShowUrlEdit(false);
    onCheckHealth();
  };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white">
              <Eye className="w-5 h-5 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">
                  GGUF Vision Studio
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  2x T4 Kaggle
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multimodal Vision • mmproj-F16 • Cloudflare Tunnel • Kobold & OpenAI API
              </p>
            </div>
          </div>

          {/* Connection URL Bar */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex items-center bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 gap-2">
                <div className={`w-2 h-2 rounded-full ${connection.isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-500'}`} />
                <span className="font-mono text-slate-400 hidden md:inline">Endpoint:</span>
                <span className="font-mono text-slate-200 max-w-[180px] sm:max-w-[260px] truncate" title={connection.baseUrl}>
                  {connection.baseUrl || 'Modo Simulado / Não Definido'}
                </span>
                {connection.isOnline && connection.latencyMs !== null && (
                  <span className="text-emerald-400 font-mono text-[11px] hidden lg:inline">
                    {connection.latencyMs}ms
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowUrlEdit(!showUrlEdit)}
                  className="text-slate-400 hover:text-white ml-1 p-0.5 rounded hover:bg-slate-800 transition"
                  title="Alterar URL do Túnel"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* URL Dropdown Form */}
              {showUrlEdit && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" /> Conectar ao Túnel Cloudflare
                  </h4>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Cole o link <code className="text-cyan-300">https://*.trycloudflare.com</code> gerado pelo notebook no Kaggle ou use <code className="text-slate-300">http://127.0.0.1:8080</code> se estiver rodando localmente.
                  </p>
                  <form onSubmit={handleApplyUrl} className="space-y-3">
                    <input
                      type="text"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="https://exemplo.trycloudflare.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowUrlEdit(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition shadow"
                      >
                        Salvar e Testar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Test Connection Button */}
            <button
              onClick={onCheckHealth}
              disabled={isChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
              title="Testar ping do endpoint"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isChecking ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Testar Ping</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-2 border-t border-slate-800/80 pt-2 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Chat de Visão GGUF</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Dual T4 Split Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab('kaggle')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'kaggle'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Notebook Kaggle (.ipynb)</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>API &amp; Túnel Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('repo')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'repo'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Repositório GitHub (.zip)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
