import React, { useState } from 'react';
import {
  Code,
  Send,
  Copy,
  Check,
  Globe,
  Terminal,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ConnectionConfig } from '../types';

interface ApiPlaygroundProps {
  connection: ConnectionConfig;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({ connection }) => {
  const [activeLang, setActiveLang] = useState<'python' | 'curl' | 'javascript' | 'sillytavern'>('python');
  const [copiedCode, setCopiedCode] = useState(false);

  // In-browser test runner state
  const [testEndpoint, setTestEndpoint] = useState<'/v1/chat/completions' | '/completion' | '/v1/models'>('/v1/chat/completions');
  const [testPrompt, setTestPrompt] = useState('Descreva brevemente esta imagem em português.');
  const [testResponse, setTestResponse] = useState<string>('');
  const [testStatus, setTestStatus] = useState<number | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

  const tunnelUrl = connection.baseUrl.replace(/\/+$/, '') || 'https://sua-url.trycloudflare.com';

  const snippets = {
    python: `import base64
import requests

API_BASE = "${tunnelUrl}"

def run_vision():
    # 1. Carregar imagem em base64
    with open("minha_foto.jpg", "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "model": "${connection.modelName || 'gemma-4-E4B-it-UD-Q4_K_XL.gguf'}",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Descreva o que há na imagem em detalhes em português."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}}
                ]
            }
        ],
        "temperature": 0.2,
        "max_tokens": 512
    }

    response = requests.post(f"{API_BASE}/v1/chat/completions", json=payload)
    print("Status:", response.status_code)
    data = response.json()
    print("\\nResposta do Modelo:")
    print(data["choices"][0]["message"]["content"])

if __name__ == "__main__":
    run_vision()
`,
    curl: `curl -X POST "${tunnelUrl}/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${connection.modelName || 'gemma-4-E4B-it-UD-Q4_K_XL.gguf'}",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "Qual é o conteúdo desta imagem?"},
          {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="}}
        ]
      }
    ],
    "temperature": 0.2,
    "max_tokens": 300
  }'
`,
    javascript: `// Exemplo em Node.js ou Navegador
import fs from 'fs';

async function queryVisionModel() {
  const imageBase64 = fs.readFileSync('imagem.jpg').toString('base64');

  const response = await fetch("${tunnelUrl}/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "${connection.modelName || 'gemma-4-E4B-it-UD-Q4_K_XL.gguf'}",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Descreva a imagem em português." },
            { type: "image_url", image_url: { url: \`data:image/jpeg;base64,\${imageBase64}\` } }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 500
    })
  });

  const data = await response.json();
  console.log(data.choices[0].message.content);
}

queryVisionModel();
`,
    sillytavern: `=== Como Conectar no SillyTavern / TypingMind / Open-WebUI ===

1. No SillyTavern, abra a aba de Conexão de API (Ícone de Plug 🔌).
2. Em "API", selecione: "Chat Completion" (ou "Text Completion").
3. Em "API Source", selecione: "OpenAI" ou "KoboldCPP".
4. No campo "Custom Endpoint" (OpenAI Server URL):
   Cole: ${tunnelUrl}/v1
5. Em "API Key", digite qualquer valor fictício (ex: "sk-t4-vision" ou deixe vazio).
6. Clique em "Connect" / "Test Connection".
7. O modelo "${connection.modelName || 'gemma-4-E4B-it'}" aparecerá listado.
8. Para enviar imagens, basta usar o botão de clipe/anexo de imagem no chat do SillyTavern!
`
  };

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[activeLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const executeLiveTest = async () => {
    setIsSending(true);
    setTestResponse('Enviando requisição via túnel Cloudflare...');
    setTestStatus(null);
    const start = performance.now();

    try {
      let endpointUrl = `${tunnelUrl}${testEndpoint}`;
      let body: any = null;

      if (testEndpoint === '/v1/chat/completions') {
        body = JSON.stringify({
          model: connection.modelName || 'gemma-4-E4B-it-UD-Q4_K_XL.gguf',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: testPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
                  }
                }
              ]
            }
          ],
          max_tokens: 150,
          temperature: 0.2
        });
      } else if (testEndpoint === '/completion') {
        body = JSON.stringify({
          prompt: `User: ${testPrompt}\nAssistant:`,
          n_predict: 150,
          temperature: 0.2
        });
      }

      const res = await fetch(endpointUrl, {
        method: testEndpoint === '/v1/models' ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
      });

      const latency = Math.round(performance.now() - start);
      setTestLatency(latency);
      setTestStatus(res.status);

      const json = await res.json();
      setTestResponse(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setTestStatus(0);
      setTestResponse(`Erro ao conectar ao endpoint: ${err.message}\n\nCertifique-se de que o túnel Cloudflare está online e acessível no Kaggle.`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Globe className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            API &amp; Túnel Cloudflare (KoboldCPP &amp; OpenAI Compatible)
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          O servidor <code className="text-cyan-300">llama-server</code> expõe uma API de nível industrial 100% compatível com as especificações do OpenAI e KoboldCPP. Qualquer cliente externo pode enviar imagens e prompts para o seu notebook do Kaggle através do link do Cloudflare.
        </p>
      </div>

      {/* Endpoints Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 font-semibold text-xs text-slate-200">
          Endpoints Disponíveis no seu Túnel
        </div>
        <div className="divide-y divide-slate-800/80 text-xs">
          <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                POST
              </span>
              <span className="text-white">/v1/chat/completions</span>
            </div>
            <div className="text-slate-400">
              Formato OpenAI Multimodal. Suporta <code className="text-cyan-300">image_url</code> em Base64 ou URL HTTP.
            </div>
          </div>

          <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                POST
              </span>
              <span className="text-white">/completion</span>
            </div>
            <div className="text-slate-400">
              Formato nativo KoboldCPP / llama.cpp com streaming e raw prompt tokens.
            </div>
          </div>

          <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-bold">
                GET
              </span>
              <span className="text-white">/v1/models</span>
            </div>
            <div className="text-slate-400">
              Lista o modelo carregado na VRAM das GPUs T4 ({connection.modelName || 'gemma-4-E4B-it'}).
            </div>
          </div>

          <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-bold">
                GET
              </span>
              <span className="text-white">/health</span>
            </div>
            <div className="text-slate-400">
              Status do servidor (retorna <code className="text-slate-300">&#123;"status": "ok"&#125;</code> quando pronto).
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippets Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeLang === 'python' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python (Requests &amp; Base64)
            </button>
            <button
              onClick={() => setActiveLang('curl')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeLang === 'curl' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              cURL (Terminal)
            </button>
            <button
              onClick={() => setActiveLang('javascript')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeLang === 'javascript' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Node.js / JS
            </button>
            <button
              onClick={() => setActiveLang('sillytavern')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeLang === 'sillytavern' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              SillyTavern / WebUI
            </button>
          </div>

          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Snippet</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-200 bg-slate-950/80 overflow-x-auto leading-relaxed max-h-[380px]">
          {snippets[activeLang]}
        </pre>
      </div>

      {/* In-Browser Live API Tester */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Testador de Endpoint em Tempo Real</h3>
          </div>
          <span className="text-xs text-slate-400">
            Alvo: <code className="text-cyan-300">{tunnelUrl}</code>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Endpoint:</label>
            <select
              value={testEndpoint}
              onChange={(e: any) => setTestEndpoint(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="/v1/chat/completions">POST /v1/chat/completions (Vision)</option>
              <option value="/completion">POST /completion (Kobold)</option>
              <option value="/v1/models">GET /v1/models</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400 block mb-1">Prompt de Teste:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
              <button
                onClick={executeLiveTest}
                disabled={isSending}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Testando...' : 'Enviar Request'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Output Box */}
        {testResponse && (
          <div className="mt-3 bg-slate-950 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 border-b border-slate-800/80 pb-1">
              <span>Resposta HTTP</span>
              <div className="flex items-center gap-3">
                {testStatus !== null && (
                  <span className={testStatus === 200 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    Status: {testStatus === 0 ? 'Falha de Rede / CORS' : testStatus}
                  </span>
                )}
                {testLatency && <span>Latência: {testLatency}ms</span>}
              </div>
            </div>
            <pre className="text-xs font-mono text-slate-300 max-h-52 overflow-y-auto whitespace-pre-wrap">
              {testResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
