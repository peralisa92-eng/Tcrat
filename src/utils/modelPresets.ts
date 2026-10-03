import { ModelPreset } from '../types';

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'gemma-4-ud-q4',
    name: 'Gemma 4 / Gemma Multimodal 4B (Recomendado pelo Usuário)',
    description: 'Modelo quantizado ultra-eficiente Q4_K_XL com projetor multimodal F16 de alta precisão para visão.',
    modelUrl: 'https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-UD-Q4_K_XL.gguf',
    modelFilename: 'gemma-4-E4B-it-UD-Q4_K_XL.gguf',
    mmprojUrl: 'https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/mmproj-F16.gguf',
    mmprojFilename: 'mmproj-F16.gguf',
    quantization: 'Q4_K_XL',
    contextSize: 8192,
    recommendedSplit: '1,1',
    estimatedVramMb: 4200
  },
  {
    id: 'minicpm-v-2_6',
    name: 'MiniCPM-V 2.6 (Visão e OCR Avançado)',
    description: 'Suporte a múltiplas imagens, alta resolução de OCR e análise densa de gráficos e documentos.',
    modelUrl: 'https://huggingface.co/openbmb/MiniCPM-V-2_6-gguf/resolve/main/ggml-model-Q4_K_M.gguf',
    modelFilename: 'minicpm-v-2_6-Q4_K_M.gguf',
    mmprojUrl: 'https://huggingface.co/openbmb/MiniCPM-V-2_6-gguf/resolve/main/mmproj-model-f16.gguf',
    mmprojFilename: 'mmproj-minicpm-f16.gguf',
    quantization: 'Q4_K_M',
    contextSize: 4096,
    recommendedSplit: '1,1',
    estimatedVramMb: 5800
  },
  {
    id: 'llava-1.6-mistral-7b',
    name: 'LLaVA 1.6 Mistral 7B Vision',
    description: 'Excelente raciocínio visual e compreensão de diagramas e cenas complexas.',
    modelUrl: 'https://huggingface.co/cjpais/llava-1.6-mistral-7b-gguf/resolve/main/llava-v1.6-mistral-7b.Q4_K_M.gguf',
    modelFilename: 'llava-v1.6-mistral-7b.Q4_K_M.gguf',
    mmprojUrl: 'https://huggingface.co/cjpais/llava-1.6-mistral-7b-gguf/resolve/main/mmproj-model-f16.gguf',
    mmprojFilename: 'mmproj-llava-f16.gguf',
    quantization: 'Q4_K_M',
    contextSize: 4096,
    recommendedSplit: '1,1',
    estimatedVramMb: 6900
  },
  {
    id: 'qwen2-vl-7b-instruct',
    name: 'Qwen2-VL 7B Vision & Document',
    description: 'Top de linha para leitura de textos longos, OCR de telas de código e documentos técnicos.',
    modelUrl: 'https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct-GGUF/resolve/main/qwen2-vl-7b-instruct-q4_k_m.gguf',
    modelFilename: 'qwen2-vl-7b-instruct-q4_k_m.gguf',
    mmprojUrl: 'https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct-GGUF/resolve/main/mmproj-f16.gguf',
    mmprojFilename: 'mmproj-qwen-f16.gguf',
    quantization: 'Q4_K_M',
    contextSize: 8192,
    recommendedSplit: '1,1',
    estimatedVramMb: 7600
  }
];
