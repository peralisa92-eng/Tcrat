# 👁️ GGUF Vision Studio

> **Suíte completa para inferência de modelos de Visão Multimodal GGUF com `mmproj-F16.gguf` acelerada em 2x GPU NVIDIA T4 no Kaggle e exposta via Cloudflare Tunnel para uso com KoboldCPP / OpenAI API / SillyTavern e Web UI.**

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

## 🔌 Endpoints Compatíveis

- **OpenAI Multimodal API:** `POST https://sua-url.trycloudflare.com/v1/chat/completions`  
  (Suporta blocos `image_url` em Base64 ou URL HTTP).
- **KoboldCPP API:** `POST https://sua-url.trycloudflare.com/completion`
- **Modelos Carregados:** `GET https://sua-url.trycloudflare.com/v1/models`
- **Health Check:** `GET https://sua-url.trycloudflare.com/health`

---

## ⚡ Como Rodar no Kaggle

1. No Kaggle, crie um novo **Notebook**.
2. No painel à direita:
   - **Accelerator:** Escolha **GPU T4 x2**.
   - **Internet:** Ative **Internet ON**.
3. Importe o arquivo `kaggle_notebook.ipynb` deste repositório.
4. Execute todas as células ("Run All").
5. Copie a URL do Cloudflare exibida no log e use no SillyTavern, na interface web ou em seus scripts Python!
