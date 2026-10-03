# 👁️ GGUF Vision Studio

> **Suíte completa para inferência de modelos de Visão Multimodal GGUF com `mmproj-F16.gguf` acelerada em 2x GPU NVIDIA T4 no Kaggle e exposta via Cloudflare Tunnel para uso com KoboldCPP / OpenAI API / SillyTavern e Web UI.**
> Repositório oficial: [https://github.com/peralisa92-eng/Tcrat](https://github.com/peralisa92-eng/Tcrat)

---

## 📌 Modelos Recomendados & Testados

- **Modelo Base (LLM):**  
  `https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-UD-Q4_K_XL.gguf`
- **Projetor de Visão Multimodal:**  
  `https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/mmproj-F16.gguf`

---

## 🚀 Arquitetura Multi-GPU (Dual T4 Kaggle)

O Kaggle disponibiliza **2x NVIDIA Tesla T4 (16GB VRAM cada, totalizando 32GB)**.  
O `llama-server` roda com divisão por tensores/linhas:

```bash
./llama-server \
  -m models/gemma-4-E4B-it-UD-Q4_K_XL.gguf \
  --mmproj models/mmproj-F16.gguf \
  -ngl 99 \
  --split-mode row \
  --tensor-split 1,1 \
  -c 8192 \
  -fa \
  --host 0.0.0.0 \
  --port 8080
```

- `--tensor-split 1,1`: Aloca 50% dos tensores na GPU 0 e 50% na GPU 1.
- `--split-mode row`: Executa operações de atenção em paralelo entre as duas placas.
- `-fa`: Flash Attention ativada para diminuir uso de VRAM no KV Cache durante imagens de alta resolução.
- `-ngl 99`: Descarrega 100% dos cálculos para CUDA (zero gargalo de CPU).

---

## 🌐 Túnel Cloudflare (Sem Port-Forwarding)

O script executa o binário oficial do Cloudflare:
```bash
./cloudflared tunnel --url http://127.0.0.1:8080
```
Gerando instantaneamente uma URL pública protegida por SSL:
`https://random-name.trycloudflare.com`

---

## ⚡ Como Subir para o GitHub (Repositório Tcrat)

```bash
git init
git add .
git commit -m "feat: inicialização do gguf-vision-studio com suporte dual t4"
git branch -M main
git remote add origin https://github.com/peralisa92-eng/Tcrat.git
git push -u origin main
```
