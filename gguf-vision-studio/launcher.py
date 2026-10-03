#!/usr/bin/env python3
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

MODEL_URL = "https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-UD-Q4_K_XL.gguf"
MMPROJ_URL = "https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/mmproj-F16.gguf"
MODEL_FILE = "models/gemma-4-E4B-it-UD-Q4_K_XL.gguf"
MMPROJ_FILE = "models/mmproj-F16.gguf"

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
    parser.add_argument("--split", type=str, default="1,1", help="Proporção tensor-split para as GPUs")
    parser.add_argument("--ctx", type=int, default=8192, help="Tamanho do contexto (n_ctx)")
    args = parser.parse_args()

    ensure_dependencies()
    download_models()

    print("[3/5] Encerrando instâncias residuais na porta 8080...")
    subprocess.run(f"fuser -k {args.port}/tcp 2>/dev/null", shell=True)
    subprocess.run("killall cloudflared 2>/dev/null", shell=True)

    llama_bin = "./llama-server"
    if not os.path.exists(llama_bin):
        if os.path.exists("llama.cpp/build/bin/llama-server"):
            llama_bin = "llama.cpp/build/bin/llama-server"
        else:
            print("[!] Binário llama-server não encontrado localmente! Tentando compilar...")
            run_cmd("git clone --depth 1 https://github.com/ggerganov/llama.cpp.git")
            run_cmd("cmake -B llama.cpp/build -S llama.cpp -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES='75'")
            run_cmd("cmake --build llama.cpp/build --config Release -j$(nproc) --target llama-server")
            llama_bin = "llama.cpp/build/bin/llama-server"

    print(f"[4/5] Inicializando llama-server com Dual T4 (split: {args.split})...")
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

    print("\n" + "="*70)
    if public_url:
        print("✨ GGUF VISION STUDIO ONLINE!")
        print(f"🔗 URL Pública: {public_url}")
        print(f"🔗 OpenAI Chat Endpoint: {public_url}/v1/chat/completions")
        print(f"🔗 KoboldCPP Endpoint:   {public_url}/completion")
    else:
        print("[!] Atenção: Verifique os logs do túnel Cloudflare.")
    print("="*70 + "\n")

    def shutdown(sig, frame):
        print("\n[!] Finalizando servidores...")
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
