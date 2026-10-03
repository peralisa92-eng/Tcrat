export interface VisionRequestOptions {
  baseUrl: string;
  model: string;
  prompt: string;
  images: string[]; // base64 strings
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  onChunk?: (chunk: string) => void;
}

export async function checkServerHealth(baseUrl: string): Promise<{
  online: boolean;
  modelName: string;
  latencyMs: number;
  serverType: 'llama-server' | 'koboldcpp' | 'simulated';
  details?: any;
}> {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const startTime = performance.now();

  try {
    // Try /v1/models first (OpenAI standard supported by llama-server)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${cleanUrl}/v1/models`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    }).catch(async () => {
      // Fallback try /health
      return await fetch(`${cleanUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
    });

    clearTimeout(timeout);

    const latencyMs = Math.round(performance.now() - startTime);

    if (res && res.ok) {
      let modelName = 'gemma-4-E4B-it-UD-Q4_K_XL.gguf';
      let serverType: 'llama-server' | 'koboldcpp' = 'llama-server';

      try {
        const data = await res.json();
        if (data.data && Array.isArray(data.data) && data.data[0]?.id) {
          modelName = data.data[0].id;
        } else if (data.result) {
          serverType = 'koboldcpp';
        }
      } catch (_) {
        // ignore parse error, status was ok
      }

      return {
        online: true,
        modelName,
        latencyMs,
        serverType
      };
    }
  } catch (err) {
    // If connection failed (e.g. offline, CORS blocked)
  }

  return {
    online: false,
    modelName: 'Offline / Não Conectado',
    latencyMs: 0,
    serverType: 'simulated'
  };
}

export async function sendVisionCompletion(options: VisionRequestOptions): Promise<string> {
  const { baseUrl, model, prompt, images, temperature = 0.2, maxTokens = 600, systemPrompt, onChunk } = options;
  const cleanUrl = baseUrl.replace(/\/+$/, '');

  const contentArray: any[] = [];
  contentArray.push({ type: 'text', text: prompt });

  for (const img of images) {
    contentArray.push({
      type: 'image_url',
      image_url: {
        url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
      }
    });
  }

  const messages: any[] = [];
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt.trim() });
  }
  messages.push({ role: 'user', content: contentArray });

  // If URL is explicitly local simulation or empty
  if (!cleanUrl || cleanUrl.includes('exemplo.trycloudflare.com') || cleanUrl === 'simulate') {
    return simulateVisionResponse(prompt, images, onChunk);
  }

  try {
    const response = await fetch(`${cleanUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gemma-4-E4B-it-UD-Q4_K_XL.gguf',
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ${response.status}: ${errText.slice(0, 200)}`);
    }

    const json = await response.json();
    const reply = json.choices?.[0]?.message?.content || 'Resposta recebida sem conteúdo de texto.';
    if (onChunk) onChunk(reply);
    return reply;
  } catch (err: any) {
    console.warn('Falha na requisição direta ao endpoint:', err);
    throw new Error(
      `Não foi possível alcançar o servidor em "${cleanUrl}". Verifique se o túnel Cloudflare está ativo no Kaggle e se não há bloqueio de CORS. Erro: ${err.message}`
    );
  }
}

async function simulateVisionResponse(
  prompt: string,
  images: string[],
  onChunk?: (chunk: string) => void
): Promise<string> {
  const sampleResponse = `[MODO DE DEMONSTRAÇÃO / SIMULAÇÃO DE VISÃO GGUF]

🔍 **Análise Visual do Modelo (${images.length} imagem(ns) carregada(s)):**

1. **Visão Geral:** O projetor multimodal \`mmproj-F16.gguf\` converteu os patches visuais da imagem em tensores de embedding com dimensão compatível com o modelo \`gemma-4-E4B-it-UD-Q4_K_XL.gguf\`.
2. **Elementos Detectados:**
   - Detecção de regiões e formas geométricas predominantes.
   - Texturas e contraste balanceados.
   - Linguagem natural alinhada ao prompt: "${prompt}".
3. **Hardware Alvo:**
   - GPU 0 (NVIDIA T4 16GB): camadas 0 a 16 + mmproj vision tower.
   - GPU 1 (NVIDIA T4 16GB): camadas 17 a 32 + KV cache (8192 tokens).
   - Velocidade estimada de inferência: ~28-35 tokens/segundo.

💡 *Dica:* Para respostas reais do modelo, inicie o notebook fornecido no Kaggle com **2x GPU T4**, copie o link do túnel Cloudflare (ex: \`https://*.trycloudflare.com\`) e conecte na barra superior!`;

  // Simulate streaming
  const words = sampleResponse.split(' ');
  let accumulated = '';
  for (let i = 0; i < words.length; i++) {
    accumulated += (i > 0 ? ' ' : '') + words[i];
    if (onChunk) onChunk(accumulated);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  return sampleResponse;
}
