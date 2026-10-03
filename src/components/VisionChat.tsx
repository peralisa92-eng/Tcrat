import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Send,
  Trash2,
  Sparkles,
  SlidersHorizontal,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  X,
  FileText,
  ScanEye,
  Code2,
  Info
} from 'lucide-react';
import { ChatMessage, ConnectionConfig } from '../types';
import { sendVisionCompletion } from '../services/apiService';

interface VisionChatProps {
  connection: ConnectionConfig;
}

// Sample demo image for quick testing (SVG encoded data URL)
const SAMPLE_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="box" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <circle cx="500" cy="80" r="40" fill="#facc15" opacity="0.8"/>
  <polygon points="50,350 200,180 350,350" fill="#334155" opacity="0.9"/>
  <polygon points="250,350 420,130 580,350" fill="#1e293b" opacity="0.9"/>
  <rect x="220" y="240" width="160" height="100" rx="12" fill="url(#box)"/>
  <text x="300" y="295" font-family="sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">GGUF VISION</text>
  <text x="300" y="320" font-family="monospace" font-size="12" fill="#e0e7ff" text-anchor="middle">2x NVIDIA T4 GPU</text>
  <rect x="0" y="350" width="600" height="50" fill="#090d16"/>
  <text x="20" y="380" font-family="sans-serif" font-size="14" fill="#94a3b8">Kaggle Tensor-Split • mmproj-F16.gguf • Cloudflare</text>
</svg>
`);

export const VisionChat: React.FC<VisionChatProps> = ({ connection }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá! Bem-vindo ao **GGUF Vision Studio**.\n\nEste ambiente foi projetado para rodar modelos multimodais como \`${connection.modelName || 'gemma-4-E4B-it-UD-Q4_K_XL.gguf'}\` com o projetor de visão \`mmproj-F16.gguf\`.\n\n📸 **Como testar:**\n1. Arraste ou cole uma imagem na caixa abaixo (ou clique em **Usar Imagem de Teste**).\n2. Escreva o que você deseja analisar (ou use as sugestões rápidas).\n3. O modelo processará os patches visuais diretamente nos tensores das GPUs T4!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(600);
  const [systemPrompt, setSystemPrompt] = useState(
    'Você é um assistente de visão computacional de alta precisão. Responda detalhadamente e em bom português analisando os elementos visuais fornecidos.'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle clipboard paste of images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setImages((prev) => [...prev, event.target!.result as string]);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || prompt).trim();
    if (!textToSend && images.length === 0) return;

    const userMsgId = 'msg-' + Date.now();
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend || 'Analise a imagem enviada.',
      images: [...images],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentImages = [...images];
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setImages([]);
    setIsLoading(true);

    const assistantMsgId = 'reply-' + Date.now();
    const startTime = performance.now();

    // Create empty assistant placeholder
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    try {
      let finalContent = '';
      await sendVisionCompletion({
        baseUrl: connection.baseUrl,
        model: connection.modelName || 'gemma-4-E4B-it-UD-Q4_K_XL.gguf',
        prompt: textToSend || 'Descreva a imagem em detalhes.',
        images: currentImages,
        temperature,
        maxTokens,
        systemPrompt,
        onChunk: (chunk) => {
          finalContent = chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: chunk } : m))
          );
        }
      });

      const totalTimeSec = (performance.now() - startTime) / 1000;
      const estimatedWords = finalContent.split(/\s+/).length;
      const speed = totalTimeSec > 0 ? Math.round(estimatedWords * 1.3 / totalTimeSec) : 0;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, tokensPerSec: speed, tokensUsed: Math.round(estimatedWords * 1.3) }
            : m
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `⚠️ **Erro durante a inferência:**\n\n${err.message}\n\n*Dica: Verifique se o notebook no Kaggle ainda está rodando o llama-server e o túnel Cloudflare.*`
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Histórico limpo. Envie uma nova imagem para iniciar uma nova análise de visão.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickPrompts = [
    { label: 'Descrever Imagem', text: 'Descreva detalhadamente o que você vê nesta imagem em português.' },
    { label: 'Extrair Texto (OCR)', text: 'Extraia e transcreva todo e qualquer texto visível nesta imagem com precisão.' },
    { label: 'Análise de UI / Web', text: 'Analise o design desta interface: layout, hierarquia visual, componentes e paleta de cores.' },
    { label: 'Detecção de Objetos', text: 'Liste todos os objetos, pessoas e elementos visíveis nesta imagem em formato de tópicos.' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-6xl mx-auto px-4 py-3">
      {/* Top Controls & Status Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 font-mono border border-slate-700">
            <ScanEye className="w-3.5 h-3.5 text-cyan-400" />
            <span>mmproj-F16 Ativo</span>
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline font-mono text-slate-400">
            Modelo: <strong className="text-slate-300">{connection.modelName || 'gemma-4-E4B-it'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition border ${
              showSettings
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Parâmetros de Geração"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Parâmetros</span>
          </button>

          <button
            onClick={clearChat}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition"
            title="Limpar Conversa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>
      </div>

      {/* Collapsible Settings Drawer */}
      {showSettings && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 my-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in">
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Temperatura de Amostragem</span>
              <span className="font-mono text-cyan-400">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Valores baixos (0.1 - 0.3) são ideais para OCR e visão factual.</p>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Tokens Máximos</span>
              <span className="font-mono text-cyan-400">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="128"
              max="2048"
              step="64"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Comprimento máximo da resposta em tokens gerados.</p>
          </div>

          <div>
            <span className="text-slate-300 mb-1 block">Prompt de Sistema</span>
            <input
              type="text"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Instruções para o modelo..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-4xl ${
              msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`rounded-2xl p-4 text-sm leading-relaxed max-w-[88%] sm:max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-cyan-600/20 border border-cyan-500/40 text-slate-100 rounded-tr-sm shadow-md'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm shadow-lg'
              }`}
            >
              {/* Attached Images */}
              {msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.images.map((img, i) => (
                    <div
                      key={i}
                      className="relative group rounded-lg overflow-hidden border border-slate-700 cursor-pointer bg-slate-950"
                      onClick={() => setZoomedImage(img)}
                    >
                      <img
                        src={img}
                        alt="Imagem enviada"
                        className="h-28 sm:h-36 w-auto object-cover rounded-lg group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap font-sans text-slate-200">
                {msg.content || (
                  <span className="flex items-center gap-2 text-cyan-400 animate-pulse text-xs">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Processando imagem nas GPUs T4...
                  </span>
                )}
              </div>

              {/* Message Footer / Metadata */}
              <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span>{msg.timestamp}</span>
                  {msg.tokensPerSec && (
                    <span className="text-emerald-400 font-mono">
                      ~{msg.tokensPerSec} t/s ({msg.tokensUsed} tokens)
                    </span>
                  )}
                </div>

                {msg.content && (
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="hover:text-slate-300 p-1 rounded transition flex items-center gap-1"
                    title="Copiar texto"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 text-[10px]">Copiado</span>
                      </>
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached Images Staging Tray */}
      {images.length > 0 && (
        <div className="flex items-center gap-3 p-2 bg-slate-900 border border-slate-800 rounded-xl mb-2 overflow-x-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 pl-2">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> {images.length} imagem(ns) anexada(s):
          </span>
          {images.map((img, idx) => (
            <div key={idx} className="relative group shrink-0">
              <img
                src={img}
                alt="Preview"
                className="w-14 h-14 object-cover rounded-lg border border-slate-700 bg-slate-950"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-500 transition"
                title="Remover imagem"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setImages([])}
            className="text-xs text-red-400 hover:text-red-300 ml-auto pr-2"
          >
            Remover todas
          </button>
        </div>
      )}

      {/* Quick Prompts Chips */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar py-1">
        <span className="text-[11px] text-slate-500 font-mono shrink-0 hidden sm:inline">Sugestões:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setPrompt(qp.text);
              if (images.length > 0) {
                handleSendMessage(qp.text);
              }
            }}
            className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition"
          >
            {qp.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            setImages([SAMPLE_IMAGE]);
            setPrompt('Descreva em detalhes todos os elementos visuais, textos e tecnologia representados nesta imagem.');
          }}
          className="text-[11px] bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 px-2.5 py-1 rounded-full whitespace-nowrap transition ml-auto flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          <span>Usar Imagem de Exemplo</span>
        </button>
      </div>

      {/* Input Box Area */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/40 transition">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Pergunte sobre a imagem, solicite OCR ou peça uma descrição detalhada... (Shift+Enter para quebra de linha)"
          rows={2}
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none px-2"
        />

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1 px-1">
          {/* File Upload Controls */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Carregar Imagens do Computador"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Anexar Imagem</span>
            </button>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (ou cole com Ctrl+V)
            </span>
          </div>

          {/* Send Button */}
          <button
            type="button"
            disabled={isLoading || (!prompt.trim() && images.length === 0)}
            onClick={() => handleSendMessage()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl font-medium text-xs bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
          >
            <span>{isLoading ? 'Analisando...' : 'Enviar'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomedImage}
              alt="Zoom"
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-slate-700 shadow-2xl"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 right-2 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-800 border border-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
