import { RepoFile } from '../types';

export const USER_MODEL_URL = 'https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-UD-Q4_K_XL.gguf';
export const USER_MMPROJ_URL = 'https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/mmproj-F16.gguf';

export const MODEL_FILENAME = 'gemma-4-E4B-it-UD-Q4_K_XL.gguf';
export const MMPROJ_FILENAME = 'mmproj-F16.gguf';

export const USER_GITHUB_REPO = 'https://github.com/peralisa92-eng/Tcrat.git';

export function getJupyterNotebookContent(
  modelUrl: string = USER_MODEL_URL,
  mmprojUrl: string = USER_MMPROJ_URL,
  modelName: string = MODEL_FILENAME,
  mmprojName: string = MMPROJ_FILENAME,
  tensorSplit: string = '1,1',
  nCtx: number = 8192
): string {
  const notebook = {
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '# 🚀 GGUF Vision Studio - Dual T4 GPU (Kaggle) + Cloudflare Tunnel\\n',
          'Este notebook roda modelos **GGUF Multimodais (Visão)** com projetor `mmproj-F16.gguf` no **Kaggle** com **2x NVIDIA T4 (32GB VRAM total)** dividido via `--tensor-split 1,1` e expõe uma API pública segura via **Cloudflare Tunnel** compatível com KoboldCPP / OpenAI / SillyTavern e a interface Web GGUF Vision Studio.\\n',
          '\\n',
          '### ⚙️ Configurações Ativas:\\n',
          `- **Modelo Base:** \`${modelName}\`\\n`,
          `- **Projetor Visão:** \`${mmprojName}\`\\n`,
          `- **Tensor Split (Dual T4):** \`${tensorSplit}\` (50% GPU 0 / 50% GPU 1)\\n`,
          `- **Contexto (n_ctx):** \`${nCtx}\` tokens\\n`,
          '- **GPU Offload:** `-ngl 99` (100% das camadas aceleradas nas GPUs)\\n',
          '\\n',
          '> **Atenção:** No menu superior do Kaggle, certifique-se de configurar **Accelerator: GPU T4 x2** e **Internet: ON**!'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# 1. Verificar GPUs T4 disponíveis e CUDA\\n',
          '!nvidia-smi\\n',
          '\\n',
          'import torch\\n',
          'print(f"CUDA disponível: {torch.cuda.is_available()}")\\n',
          'print(f"Total GPUs: {torch.cuda.device_count()}")\\n',
          'for i in range(torch.cuda.device_count()):\\n',
          '    print(f"GPU {i}: {torch.cuda.get_device_name(i)} - {torch.cuda.get_device_properties(i).total_memory / 1e9:.2f} GB")'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# 2. Instalar Cloudflared Tunnel e utilitários de alta velocidade\\n',
          'import os, subprocess\\n',
          '\\n',
          'print("⏳ Baixando Cloudflared Tunnel...")\\n',
          '!wget -q -nc https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared\\n',
          '!chmod +x cloudflared\\n',
          '!./cloudflared --version\\n',
          '\\n',
          'print("⏳ Instalando utilitários e dependências...")\\n',
          '!apt-get update -qq && apt-get install -y -qq aria2 psmisc libgomp1 cmake build-essential\\n',
          '!pip install -q huggingface_hub requests'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# 3. Instalar llama-server com aceleração CUDA garantida\\n',
          'import os, shutil, subprocess, urllib.request, json\\n',
          '\\n',
          'print("⏳ Instalando llama-server oficial pré-compilado com suporte a CUDA...")\\n',
          '# Método 1: Script oficial de instalação do ggml-org que detecta CUDA automaticamente\\n',
          '!curl -sSfL https://raw.githubusercontent.com/ggml-org/llama.cpp/master/scripts/install.sh | bash\\n',
          '\\n',
          '# Copiar o binário para ./llama-server a partir dos caminhos padrão\\n',
          'candidates = [\\n',
          '    shutil.which("llama-server"),\\n',
          '    os.path.expanduser("~/.local/bin/llama-server"),\\n',
          '    "/usr/local/bin/llama-server",\\n',
          '    "/usr/bin/llama-server"\\n',
          ']\\n',
          'for c in candidates:\\n',
          '    if c and os.path.exists(c):\\n',
          '        shutil.copy(c, "./llama-server")\\n',
          '        os.chmod("./llama-server", 0o755)\\n',
          '        print(f"✅ llama-server configurado com sucesso a partir de: {c}")\\n',
          '        break\\n',
          '\\n',
          '# Método 2: Se ainda não tiver ./llama-server, buscar via GitHub Releases API do ggml-org\\n',
          'if not os.path.exists("./llama-server"):\\n',
          '    print("⏳ Buscando release recente do ggml-org/llama.cpp...")\\n',
          '    try:\\n',
          '        req = urllib.request.Request("https://api.github.com/repos/ggml-org/llama.cpp/releases/latest", headers={"User-Agent": "Mozilla/5.0"})\\n',
          '        with urllib.request.urlopen(req, timeout=12) as resp:\\n',
          '            rel = json.loads(resp.read().decode())\\n',
          '            for asset in rel.get("assets", []):\\n',
          '                name = asset.get("name", "").lower()\\n',
          '                if "ubuntu" in name and ("tar.gz" in name or "zip" in name) and not "arm" in name:\\n',
          '                    url = asset.get("browser_download_url")\\n',
          '                    target_file = asset.get("name")\\n',
          '                    print(f"📥 Baixando asset: {target_file} ...")\\n',
          '                    subprocess.run(f"aria2c -x 8 -s 8 -k 1M -c \'{url}\' -o \'{target_file}\'", shell=True)\\n',
          '                    if target_file.endswith(".tar.gz") or target_file.endswith(".tgz"):\\n',
          '                        subprocess.run(f"tar -xzf \'{target_file}\'", shell=True)\\n',
          '                    elif target_file.endswith(".zip"):\\n',
          '                        subprocess.run(f"unzip -q -o \'{target_file}\'", shell=True)\\n',
          '                    break\\n',
          '    except Exception as e:\\n',
          '        print("Aviso ao buscar releases:", e)\\n',
          '\\n',
          '# Localizar recursivamente se foi extraído em subpasta\\n',
          'if not os.path.exists("./llama-server"):\\n',
          '    for root, _, files in os.walk("."):\\n',
          '        if "llama-server" in files:\\n',
          '            found = os.path.join(root, "llama-server")\\n',
          '            if os.path.isfile(found):\\n',
          '                shutil.copy(found, "./llama-server")\\n',
          '                os.chmod("./llama-server", 0o755)\\n',
          '                print(f"✅ llama-server encontrado em: {found}")\\n',
          '                break\\n',
          '\\n',
          '# Método 3: Fallback de compilação direta com CMake CUDA sm_75\\n',
          'if not os.path.exists("./llama-server"):\\n',
          '    print("🔨 Compilando llama-server diretamente com CUDA (sm_75 para Dual T4)...")\\n',
          '    !git clone --depth 1 https://github.com/ggml-org/llama.cpp.git\\n',
          '    !cmake -B llama.cpp/build -S llama.cpp -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES="75" -DCMAKE_BUILD_TYPE=Release\\n',
          '    !cmake --build llama.cpp/build --config Release -j$(nproc) --target llama-server\\n',
          '    !cp llama.cpp/build/bin/llama-server ./llama-server\\n',
          '    !chmod +x ./llama-server\\n',
          '\\n',
          '# Validação final\\n',
          'if os.path.exists("./llama-server"):\\n',
          '    !chmod +x ./llama-server\\n',
          '    !./llama-server --version || true\\n',
          '    print("🎉 SUCESSO: ./llama-server está pronto e pronto para execução!")\\n',
          'else:\\n',
          '    raise FileNotFoundError("Erro: Não foi possível obter o binário llama-server. Verifique a saída acima.")'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# 4. Baixar modelo GGUF e projetor multimodal (mmproj-F16.gguf) com alta velocidade (aria2c)\\n',
          'import os\\n',
          'os.makedirs("models", exist_ok=True)\\n',
          '\\n',
          `MODEL_URL = "${modelUrl}"\\n`,
          `MMPROJ_URL = "${mmprojUrl}"\\n`,
          `MODEL_PATH = "models/${modelName}"\\n`,
          `MMPROJ_PATH = "models/${mmprojName}"\\n`,
          '\\n',
          'if not os.path.exists(MODEL_PATH):\\n',
          '    print(f"📥 Baixando modelo principal: {MODEL_PATH} ...")\\n',
          '    !aria2c -x 16 -s 16 -k 1M -c "{MODEL_URL}" -d models -o "{MODEL_PATH.split(\'/\')[-1]}"\\n',
          'else:\\n',
          '    print(f"✅ Modelo já existente: {MODEL_PATH}")\\n',
          '\\n',
          'if not os.path.exists(MMPROJ_PATH):\\n',
          '    print(f"📥 Baixando projetor multimodal mmproj: {MMPROJ_PATH} ...")\\n',
          '    !aria2c -x 16 -s 16 -k 1M -c "{MMPROJ_URL}" -d models -o "{MMPROJ_PATH.split(\'/\')[-1]}"\\n',
          'else:\\n',
          '    print(f"✅ mmproj já existente: {MMPROJ_PATH}")\\n',
          '\\n',
          '!ls -lh models/'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# 5. Iniciar Servidor llama.cpp com Dual T4 Split + Cloudflare Tunnel\\n',
          'import subprocess, time, re, sys, os, shutil\\n',
          '\\n',
          '# Matar processos anteriores se houver\\n',
          '!fuser -k 8080/tcp 2>/dev/null || true\\n',
          '!killall cloudflared 2>/dev/null || true\\n',
          '\\n',
          '# Encontrar binário do llama-server garantido\\n',
          'server_bin = None\\n',
          'for candidate in ["./llama-server", shutil.which("llama-server"), os.path.expanduser("~/.local/bin/llama-server"), "/usr/local/bin/llama-server"]:\\n',
          '    if candidate and os.path.exists(candidate) and os.access(candidate, os.X_OK):\\n',
          '        server_bin = candidate\\n',
          '        break\\n',
          '\\n',
          'if not server_bin:\\n',
          '    raise FileNotFoundError("Binário llama-server não foi encontrado! Por favor, execute a Célula 3 primeiro.")\\n',
          '\\n',
          'print(f"🚀 Usando binário do llama-server: {server_bin}")\\n',
          '\\n',
          '# Comando para rodar o llama-server com divisão nas duas GPUs T4 (CUDA 0 e 1)\\n',
          'server_cmd = [\\n',
          '    server_bin,\\n',
          '    "-m", f"models/{MODEL_PATH.split(\'/\')[-1]}",\\n',
          '    "--mmproj", f"models/{MMPROJ_PATH.split(\'/\')[-1]}",\\n',
          '    "-ngl", "99",               # Offload total para as GPUs\\n',
          '    "--split-mode", "row",       # Divisão de camadas por linha/tensor\\n',
          `    "--tensor-split", "${tensorSplit}",     # Balanceamento 50/50 entre GPU 0 e GPU 1\\n`,
          `    "-c", "${nCtx}",             # Tamanho da janela de contexto\\n`,
          '    "-fa",                       # Flash Attention ativada\\n',
          '    "--host", "0.0.0.0",\\n',
          '    "--port", "8080",\\n',
          '    "--parallel", "1",\\n',
          '    "-np", "1"\\n',
          ']\\n',
          '\\n',
          'print("🚀 Iniciando llama-server em segundo plano...")\\n',
          'llama_proc = subprocess.Popen(server_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)\\n',
          '\\n',
          '# Aguardar servidor inicializar\\n',
          'time.sleep(6)\\n',
          '\\n',
          'print("🌐 Iniciando Cloudflare Tunnel...")\\n',
          'tunnel_proc = subprocess.Popen(["./cloudflared", "tunnel", "--url", "http://127.0.0.1:8080"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)\\n',
          '\\n',
          'cloudflare_url = None\\n',
          'start_time = time.time()\\n',
          'while time.time() - start_time < 35:\\n',
          '    line = tunnel_proc.stdout.readline()\\n',
          '    if line:\\n',
          '        match = re.search(r"https://[a-zA-Z0-9-]+\\.trycloudflare\\.com", line)\\n',
          '        if match:\\n',
          '            cloudflare_url = match.group(0)\\n',
          '            break\\n',
          '    time.sleep(0.1)\\n',
          '\\n',
          'if cloudflare_url:\\n',
          '    print("\\n" + "="*70)\\n',
          '    print(f"🎉 SEU TÚNEL CLOUDFLARE ESTÁ ONLINE!")\\n',
          '    print(f"🔗 URL Pública da API: {cloudflare_url}")\\n',
          '    print(f"🔗 Endpoint OpenAI:    {cloudflare_url}/v1/chat/completions")\\n',
          '    print(f"🔗 Endpoint Kobold:    {cloudflare_url}/completion")\\n',
          '    print(f"🔗 Endpoint Modelos:   {cloudflare_url}/v1/models")\\n',
          '    print("="*70 + "\\n")\\n',
          '    print("Copie a URL acima e cole na interface web GGUF Vision Studio ou no SillyTavern!")\\n',
          'else:\\n',
          '    print("⚠️ Não foi possível capturar a URL do Cloudflare automaticamente. Verifique os logs abaixo.")\\n',
          '\\n',
          '# Manter o notebook executando e exibindo logs\\n',
          'try:\\n',
          '    while True:\\n',
          '        out = llama_proc.stdout.readline()\\n',
          '        if out:\\n',
          '            print(out.strip())\\n',
          '        time.sleep(0.1)\\n',
          'except KeyboardInterrupt:\\n',
          '    print("\\n🛑 Encerrando servidor e túnel...")\\n',
          '    llama_proc.terminate()\\n',
          '    tunnel_proc.terminate()'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# 6. Teste de Visão (Opcional - execute em outra célula para testar envio de imagem)\n',
          'import requests, base64\n',
          '\n',
          '# Baixar imagem de exemplo\n',
          '!wget -q -nc https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/420px-PNG_transparency_demonstration_1.png -O test.png\n',
          '\n',
          'with open("test.png", "rb") as f:\n',
          '    img_b64 = base64.b64encode(f.read()).decode("utf-8")\n',
          '\n',
          'payload = {\n',
          '    "model": "gemma-4-E4B-it",\n',
          '    "messages": [\n',
          '        {\n',
          '            "role": "user",\n',
          '            "content": [\n',
          '                {"type": "text", "text": "Descreva o que você vê nesta imagem em português."},\n',
          '                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}}\n',
          '            ]\n',
          '        }\n',
          '    ],\n',
          '    "max_tokens": 300,\n',
          '    "temperature": 0.2\n',
          '}\n',
          '\n',
          'res = requests.post("http://127.0.0.1:8080/v1/chat/completions", json=payload)\n',
          'print("Status:", res.status_code)\n',
          'if res.status_code == 200:\n',
          '    print("Resposta do Modelo:")\n',
          '    print(res.json()["choices"][0]["message"]["content"])\n',
          'else:\n',
          '    print(res.text)'
        ]
      }
    ],
    metadata: {
      accelerator: 'GPU',
      colab: {
        provenance: []
      },
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      },
      language_info: {
        codemirror_mode: {
          name: 'ipython',
          version: 3
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'python',
        nbconvert_exporter: 'python',
        pygments_lexer: 'ipython3',
        version: '3.10.12'
      }
    },
    nbformat: 4,
    nbformat_minor: 0
  };

  return JSON.stringify(notebook, null, 2);
}

export function getRepositoryFiles(
  modelUrl: string = USER_MODEL_URL,
  mmprojUrl: string = USER_MMPROJ_URL,
  modelName: string = MODEL_FILENAME,
  mmprojName: string = MMPROJ_FILENAME,
  tensorSplit: string = '1,1',
  nCtx: number = 8192
): RepoFile[] {
  const notebookContent = getJupyterNotebookContent(modelUrl, mmprojUrl, modelName, mmprojName, tensorSplit, nCtx);

  const readmeContent = `# 👁️ GGUF Vision Studio

> **Suíte completa para inferência de modelos de Visão Multimodal GGUF com \`mmproj-F16.gguf\` acelerada em 2x GPU NVIDIA T4 no Kaggle e exposta via Cloudflare Tunnel para uso com KoboldCPP / OpenAI API / SillyTavern e Web UI.**

---

## 📌 Visão Geral

Este repositório contém todo o ecossistema necessário para rodar modelos de Inteligência Artificial com **Visão Computacional (VLM / Multimodal)** em hardware gratuito ou dedicado:

- **Modelos Alvo:**
  - Base LLM: \`${modelName}\`
  - Multimodal Projector: \`${mmprojName}\`
- **Aceleração Multi-GPU:** Split automático em **2x GPUs NVIDIA T4 (16GB + 16GB = 32GB VRAM)** no Kaggle usando \`--tensor-split ${tensorSplit}\` e \`--split-mode row\`.
- **Túnel Cloudflare Zero-Config:** Gera um link público seguro (\`https://*.trycloudflare.com\`) sem necessidade de portas abertas, ngrok token ou IP fixo.
- **Compatibilidade Total de APIs:**
  - **OpenAI Compatible:** \`/v1/chat/completions\` (com suporte a imagens em \`image_url\` base64).
  - **KoboldCPP Compatible:** \`/completion\` e \`/extra/generate/check\`.
  - **SillyTavern, TypingMind, Open-WebUI & Mobile Apps**.
- **Interface Web Própria:** Chat interativo com arrastar-e-soltar de imagens, preview, controle de temperatura e parâmetros de visão.

---

## 📁 Estrutura do Repositório

\`\`\`
gguf-vision-studio/
├── .gitignore               # Arquivos ignorados (pesos gguf, logs, caches)
├── README.md                # Documentação detalhada em Português e Inglês
├── kaggle_notebook.ipynb    # Notebook pronto para rodar direto no Kaggle (2x T4)
├── launcher.py              # Script autônomo Python com detector de URL do Cloudflare
├── setup_kaggle.sh          # Script de instalação rápida de binários e dependências
├── api_client_example.py    # Exemplo de cliente Python consumindo a API com imagem
├── requirements.txt         # Pacotes Python necessários
└── ui/
    └── index.html           # Interface web leve standalone para conexão rápida
\`\`\`

---

## ⚡ Como Rodar no Kaggle (Passo a Passo)

1. Crie uma conta no [Kaggle](https://www.kaggle.com/) e inicie um novo **Notebook**.
2. No menu lateral direito:
   - **Accelerator:** Selecione **GPU T4 x2**.
   - **Internet:** Ative a opção **Internet On**.
3. Importe o arquivo \`kaggle_notebook.ipynb\` do repositório ou cole o conteúdo do script \`setup_kaggle.sh\`.
4. Execute as células. O script irá:
   - Baixar o binário CUDA do \`llama-server\` (ou compilar para arquitetura \`sm_75\`).
   - Baixar \`${modelName}\` e \`${mmprojName}\` via \`aria2c\` em velocidade máxima.
   - Iniciar o servidor dividindo a memória entre as duas GPUs T4 (\`--tensor-split 1,1\`).
   - Iniciar o túnel Cloudflare e imprimir a URL pública no terminal:
     \`\`\`
     ======================================================================
     🎉 SEU TÚNEL CLOUDFLARE ESTÁ ONLINE!
     🔗 URL Pública da API: https://meu-tunel-aleatorio.trycloudflare.com
     🔗 Endpoint OpenAI:    https://meu-tunel-aleatorio.trycloudflare.com/v1/chat/completions
     ======================================================================
     \`\`\`
5. Cole a URL pública na interface do **GGUF Vision Studio** ou no seu cliente favorito!

---

## 💻 Consumindo a API Externa (Python)

Você pode enviar imagens diretamente para o seu túnel Cloudflare a partir de qualquer computador:

\`\`\`python
import base64
import requests

API_URL = "https://SEU-TUNEL.trycloudflare.com/v1/chat/completions"

# Codificar a imagem em base64
with open("minha_foto.jpg", "rb") as img_file:
    b64_image = base64.b64encode(img_file.read()).decode("utf-8")

payload = {
    "model": "gemma-vision",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "O que tem nesta imagem? Seja detalhado."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}}
            ]
        }
    ],
    "max_tokens": 512,
    "temperature": 0.2
}

response = requests.post(API_URL, json=payload)
print(response.json()["choices"][0]["message"]["content"])
\`\`\`

---

## 🛠️ Parâmetros do Llama-Server para Dual T4

\`\`\`bash
./llama-server \\
  -m models/${modelName} \\
  --mmproj models/${mmprojName} \\
  -ngl 99 \\
  --split-mode row \\
  --tensor-split ${tensorSplit} \\
  -c ${nCtx} \\
  -fa \\
  --host 0.0.0.0 \\
  --port 8080
\`\`\`

- \`-ngl 99\`: Transfere 100% dos blocos do modelo para VRAM.
- \`--tensor-split ${tensorSplit}\`: Aloca 50% dos tensores na GPU 0 e 50% na GPU 1, permitindo modelos maiores e grande janela de contexto.
- \`--split-mode row\`: Divide operações matriciais em paralelo nas duas placas.
- \`-fa\`: Ativa Flash Attention para economizar VRAM e acelerar o processamento de imagens de alta resolução.

---

## 📄 Licença
Código sob licença MIT. Os pesos dos modelos pertencem aos seus respectivos autores (Google DeepMind / Unsloth).
`;

  const launcherPyContent = `#!/usr/bin/env python3
"""
GGUF Vision Studio - Dual GPU Launcher with Cloudflare Tunnel
Automatic process orchestrator for Kaggle 2x NVIDIA T4.
"""

import os
import sys
import time
import re
import subprocess
import signal
import argparse

MODEL_URL = "${modelUrl}"
MMPROJ_URL = "${mmprojUrl}"
MODEL_FILE = "models/${modelName}"
MMPROJ_FILE = "models/${mmprojName}"

def run_cmd(cmd, check=True):
    print(f"[*] Executando: {cmd}")
    res = subprocess.run(cmd, shell=True, text=True)
    if check and res.returncode != 0:
        print(f"[!] Erro ao executar: {cmd}")
        sys.exit(res.returncode)

def ensure_dependencies():
    print("[1/5] Verificando dependências do sistema...")
    os.makedirs("models", exist_ok=True)
    if not os.path.exists("cloudflared"):
        print("[*] Baixando binário Cloudflared...")
        run_cmd("wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared")
        run_cmd("chmod +x cloudflared")
    
    # Baixar aria2 para download acelerado se disponível
    subprocess.run("apt-get update -qq && apt-get install -y -qq aria2 psmisc", shell=True)

def download_models():
    print("[2/5] Verificando pesos GGUF e projetor multimodal...")
    if not os.path.exists(MODEL_FILE):
        print(f"[*] Baixando modelo base: {MODEL_FILE}")
        run_cmd(f"aria2c -x 16 -s 16 -k 1M -c '{MODEL_URL}' -d models -o '{os.path.basename(MODEL_FILE)}'")
    else:
        print(f"[✓] Modelo encontrado: {MODEL_FILE}")

    if not os.path.exists(MMPROJ_FILE):
        print(f"[*] Baixando projetor multimodal: {MMPROJ_FILE}")
        run_cmd(f"aria2c -x 16 -s 16 -k 1M -c '{MMPROJ_URL}' -d models -o '{os.path.basename(MMPROJ_FILE)}'")
    else:
        print(f"[✓] Projetor mmproj encontrado: {MMPROJ_FILE}")

def main():
    parser = argparse.ArgumentParser(description="GGUF Vision Studio Dual-T4 Server")
    parser.add_argument("--port", type=int, default=8080, help="Porta local HTTP")
    parser.add_argument("--split", type=str, default="${tensorSplit}", help="Proporção tensor-split para as GPUs")
    parser.add_argument("--ctx", type=int, default=${nCtx}, help="Tamanho do contexto (n_ctx)")
    args = parser.parse_args()

    ensure_dependencies()
    download_models()

    print("[3/5] Encerrando instâncias residuais na porta 8080...")
    subprocess.run(f"fuser -k {args.port}/tcp 2>/dev/null", shell=True)
    subprocess.run("killall cloudflared 2>/dev/null", shell=True)

    def find_llama_server():
        candidates = [
            "./llama-server",
            shutil.which("llama-server"),
            os.path.expanduser("~/.local/bin/llama-server"),
            "/usr/local/bin/llama-server",
            "./llama.cpp/build/bin/llama-server"
        ]
        for c in candidates:
            if c and os.path.exists(c) and os.access(c, os.X_OK):
                return c
        return None

    llama_bin = find_llama_server()
    if not llama_bin:
        print("[*] Instalando llama-server oficial pré-compilado para CUDA...")
        run_cmd("curl -sSfL https://raw.githubusercontent.com/ggml-org/llama.cpp/master/scripts/install.sh | bash", check=False)
        llama_bin = find_llama_server()

    if not llama_bin:
        print("[!] Compilando llama-server com CUDA (sm_75 para Dual T4)...")
        if not os.path.exists("llama.cpp"):
            run_cmd("git clone --depth 1 https://github.com/ggml-org/llama.cpp.git")
        run_cmd("cmake -B llama.cpp/build -S llama.cpp -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES='75' -DCMAKE_BUILD_TYPE=Release")
        run_cmd("cmake --build llama.cpp/build --config Release -j$(nproc) --target llama-server")
        if os.path.exists("llama.cpp/build/bin/llama-server"):
            shutil.copy("llama.cpp/build/bin/llama-server", "./llama-server")
            os.chmod("./llama-server", 0o755)
            llama_bin = "./llama-server"

    if not llama_bin:
        print("[!] Falha crítica: llama-server não pôde ser encontrado!")
        sys.exit(1)

    print(f"[4/5] Inicializando {llama_bin} com Dual T4 (split: {args.split})...")
    server_cmd = [
        llama_bin,
        "-m", MODEL_FILE,
        "--mmproj", MMPROJ_FILE,
        "-ngl", "99",
        "--split-mode", "row",
        "--tensor-split", args.split,
        "-c", str(args.ctx),
        "-fa",
        "--host", "0.0.0.0",
        "--port", str(args.port)
    ]

    server_proc = subprocess.Popen(server_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    time.sleep(4)

    print("[5/5] Iniciando túnel Cloudflare...")
    tunnel_cmd = ["./cloudflared", "tunnel", "--url", f"http://127.0.0.1:{args.port}"]
    tunnel_proc = subprocess.Popen(tunnel_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

    public_url = None
    start = time.time()
    while time.time() - start < 35:
        line = tunnel_proc.stdout.readline()
        if line:
            m = re.search(r"https://[a-zA-Z0-9-]+\\.trycloudflare\\.com", line)
            if m:
                public_url = m.group(0)
                break
        time.sleep(0.1)

    print("\\n" + "="*70)
    if public_url:
        print(f"✨ GGUF VISION STUDIO ONLINE!")
        print(f"🔗 URL Pública: {public_url}")
        print(f"🔗 OpenAI Chat Endpoint: {public_url}/v1/chat/completions")
        print(f"🔗 KoboldCPP Endpoint:   {public_url}/completion")
    else:
        print("[!] Atenção: Verifique os logs do túnel Cloudflare.")
    print("="*70 + "\\n")

    def shutdown(sig, frame):
        print("\\n[!] Finalizando servidores...")
        server_proc.terminate()
        tunnel_proc.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    while True:
        line = server_proc.stdout.readline()
        if line:
            print(line.strip())
        time.sleep(0.05)

if __name__ == "__main__":
    main()
`;

  const setupKaggleSh = `#!/usr/bin/env bash
# ==============================================================================
# GGUF Vision Studio - Dual T4 Kaggle Setup Script
# ==============================================================================
set -e

echo "=== [1/4] Verificando ambiente e GPUs ==="
nvidia-smi

echo "=== [2/4] Instalando dependências e Cloudflared ==="
apt-get update -qq
apt-get install -y -qq aria2 psmisc cmake build-essential
wget -q -nc https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
chmod +x cloudflared

echo "=== [3/4] Baixando modelo GGUF e mmproj ==="
mkdir -p models
aria2c -x 16 -s 16 -k 1M -c "${modelUrl}" -d models -o "${modelName}"
aria2c -x 16 -s 16 -k 1M -c "${mmprojUrl}" -d models -o "${mmprojName}"

echo "=== [4/4] Instalando llama-server oficial pré-compilado para CUDA ==="
if [ ! -f "./llama-server" ]; then
    curl -sSfL https://raw.githubusercontent.com/ggml-org/llama.cpp/master/scripts/install.sh | bash || true
    if [ -f "$HOME/.local/bin/llama-server" ]; then
        cp "$HOME/.local/bin/llama-server" ./llama-server
    elif [ -f "/usr/local/bin/llama-server" ]; then
        cp "/usr/local/bin/llama-server" ./llama-server
    fi
fi

if [ ! -f "./llama-server" ]; then
    echo "Compilando llama-server para CUDA sm_75..."
    if [ ! -d "llama.cpp" ]; then
        git clone --depth 1 https://github.com/ggml-org/llama.cpp.git
    fi
    cmake -B llama.cpp/build -S llama.cpp -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES="75" -DCMAKE_BUILD_TYPE=Release
    cmake --build llama.cpp/build --config Release -j$(nproc) --target llama-server
    cp llama.cpp/build/bin/llama-server ./llama-server
fi
chmod +x ./llama-server

echo "=== ✅ Tudo pronto! Agora execute: python3 launcher.py ==="
`;

  const apiClientExamplePy = `#!/usr/bin/env python3
"""
Exemplo de cliente Python para consumir o endpoint de Visão do GGUF Studio
através da URL do Cloudflare Tunnel.
"""

import sys
import base64
import requests

# Substitua pela sua URL gerada pelo Cloudflare
CLOUDFLARE_URL = "https://seu-tunel.trycloudflare.com"

def analyze_image(image_path: str, prompt: str = "Descreva esta imagem em detalhes em português."):
    # 1. Carregar e codificar imagem para base64
    with open(image_path, "rb") as f:
        encoded_image = base64.b64encode(f.read()).decode("utf-8")
    
    endpoint = f"{CLOUDFLARE_URL.rstrip('/')}/v1/chat/completions"
    
    payload = {
        "model": "${modelName}",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded_image}"
                        }
                    }
                ]
            }
        ],
        "temperature": 0.2,
        "max_tokens": 512,
        "stream": False
    }
    
    print(f"[*] Enviando imagem para {endpoint}...")
    resp = requests.post(endpoint, json=payload, timeout=120)
    
    if resp.status_code == 200:
        result = resp.json()
        content = result["choices"][0]["message"]["content"]
        print("\\n=== Resposta do Modelo de Visão ===")
        print(content)
        return content
    else:
        print(f"[!] Erro ({resp.status_code}): {resp.text}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python api_client_example.py <caminho_da_imagem> [pergunta]")
        print("Exemplo: python api_client_example.py foto.jpg 'O que está escrito no cartaz?'")
        sys.exit(1)
        
    img = sys.argv[1]
    prompt = sys.argv[2] if len(sys.argv) > 2 else "Descreva detalhadamente o que você vê nesta imagem."
    analyze_image(img, prompt)
`;

  const requirementsTxt = `fastapi>=0.110.0
uvicorn>=0.29.0
requests>=2.31.0
httpx>=0.27.0
huggingface_hub>=0.22.0
pillow>=10.2.0
`;

  const gitignoreContent = `# Model weights and binaries
*.gguf
models/
llama-server
cloudflared
llama.cpp/
llama_bin/
*.zip

# Python & System
__pycache__/
*.pyc
.ipynb_checkpoints/
venv/
.env

# Logs and outputs
*.log
*.tmp
test.png
`;

  const uiIndexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GGUF Vision Studio WebUI</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    input, button, textarea { font-family: inherit; border-radius: 8px; border: 1px solid #334155; }
    input, textarea { width: 100%; background: #1e293b; color: white; padding: 10px; margin-bottom: 12px; box-sizing: border-box; }
    button { background: #3b82f6; color: white; border: none; padding: 10px 20px; font-weight: 600; cursor: pointer; }
    button:hover { background: #2563eb; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155; }
    #preview { max-width: 100%; max-height: 300px; border-radius: 8px; display: none; margin-bottom: 12px; }
    #output { white-space: pre-wrap; background: #0b1120; padding: 14px; border-radius: 8px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <h1>👁️ GGUF Vision Studio Lite WebUI</h1>
    <div class="card">
      <label>URL do Túnel Cloudflare:</label>
      <input type="text" id="tunnelUrl" placeholder="https://exemplo.trycloudflare.com" />
      <button onclick="checkHealth()">Testar Conexão</button>
      <span id="healthStatus" style="margin-left: 10px;"></span>
    </div>
    <div class="card">
      <label>Selecionar Imagem:</label>
      <input type="file" id="imageInput" accept="image/*" onchange="previewImg(event)" />
      <img id="preview" />
      <label>Pergunta ou Prompt de Visão:</label>
      <textarea id="promptInput" rows="3">Descreva detalhadamente o que você vê nesta imagem em português.</textarea>
      <button id="sendBtn" onclick="analyzeImage()">Enviar para o Modelo GGUF</button>
    </div>
    <div class="card">
      <h3>Resposta:</h3>
      <div id="output">Aguardando envio...</div>
    </div>
  </div>

  <script>
    let currentBase64 = null;
    function previewImg(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        currentBase64 = reader.result;
        const img = document.getElementById('preview');
        img.src = currentBase64;
        img.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }

    async function checkHealth() {
      const url = document.getElementById('tunnelUrl').value.trim();
      const status = document.getElementById('healthStatus');
      status.textContent = 'Verificando...';
      try {
        const res = await fetch(\`\${url}/health\`, { mode: 'cors' });
        if (res.ok) status.textContent = '🟢 Online!';
        else status.textContent = '🟠 Conectado com status: ' + res.status;
      } catch (err) {
        status.textContent = '🔴 Erro de conexão ou CORS';
      }
    }

    async function analyzeImage() {
      const url = document.getElementById('tunnelUrl').value.trim();
      const prompt = document.getElementById('promptInput').value;
      const output = document.getElementById('output');
      const btn = document.getElementById('sendBtn');
      if (!url) return alert('Por favor, informe a URL do túnel Cloudflare');
      if (!currentBase64) return alert('Selecione uma imagem');
      
      btn.disabled = true;
      output.textContent = 'Processando visão nas GPUs T4...';
      try {
        const res = await fetch(\`\${url}/v1/chat/completions\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: '${modelName}',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: currentBase64 } }
              ]
            }],
            max_tokens: 512,
            temperature: 0.2
          })
        });
        const data = await res.json();
        output.textContent = data.choices[0].message.content;
      } catch (e) {
        output.textContent = 'Erro ao processar: ' + e.message;
      } finally {
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>
`;

  return [
    {
      path: 'README.md',
      name: 'README.md',
      language: 'markdown',
      description: 'Documentação completa com arquitetura, guia de 2x T4 Kaggle e API.',
      content: readmeContent
    },
    {
      path: 'kaggle_notebook.ipynb',
      name: 'kaggle_notebook.ipynb',
      language: 'json',
      description: 'Jupyter Notebook oficial pronto para importar e rodar no Kaggle com 2x T4.',
      content: notebookContent
    },
    {
      path: 'launcher.py',
      name: 'launcher.py',
      language: 'python',
      description: 'Script autônomo Python que gerencia llama-server e túnel Cloudflare.',
      content: launcherPyContent
    },
    {
      path: 'setup_kaggle.sh',
      name: 'setup_kaggle.sh',
      language: 'bash',
      description: 'Script de inicialização rápida e compilação CUDA sm_75 para T4.',
      content: setupKaggleSh
    },
    {
      path: 'api_client_example.py',
      name: 'api_client_example.py',
      language: 'python',
      description: 'Exemplo de cliente Python com envio de imagem em Base64.',
      content: apiClientExamplePy
    },
    {
      path: 'requirements.txt',
      name: 'requirements.txt',
      language: 'text',
      description: 'Dependências Python mínimas para orquestração e testes.',
      content: requirementsTxt
    },
    {
      path: '.gitignore',
      name: '.gitignore',
      language: 'text',
      description: 'Regras de ignore para modelos pesados .gguf e artefatos de build.',
      content: gitignoreContent
    },
    {
      path: 'ui/index.html',
      name: 'index.html (Lite UI)',
      language: 'html',
      description: 'Interface web standalone leve em HTML/JS puro para testar o túnel.',
      content: uiIndexHtml
    }
  ];
}
