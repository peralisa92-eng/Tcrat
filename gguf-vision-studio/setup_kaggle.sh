#!/usr/bin/env bash
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
aria2c -x 16 -s 16 -k 1M -c "https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-UD-Q4_K_XL.gguf" -d models -o "gemma-4-E4B-it-UD-Q4_K_XL.gguf"
aria2c -x 16 -s 16 -k 1M -c "https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/mmproj-F16.gguf" -d models -o "mmproj-F16.gguf"

echo "=== [4/4] Compilando llama-server para arquitetura CUDA sm_75 (T4) ==="
if [ ! -f "./llama-server" ]; then
    if [ ! -d "llama.cpp" ]; then
        git clone --depth 1 https://github.com/ggerganov/llama.cpp.git
    fi
    cmake -B llama.cpp/build -S llama.cpp -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES="75"
    cmake --build llama.cpp/build --config Release -j$(nproc) --target llama-server
    cp llama.cpp/build/bin/llama-server ./llama-server
fi

echo "=== ✅ Tudo pronto! Agora execute: python3 launcher.py ==="
