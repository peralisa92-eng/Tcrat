export interface ConnectionConfig {
  baseUrl: string; // e.g. "https://xxxx.trycloudflare.com" or "http://localhost:8080"
  apiKey?: string;
  isOnline: boolean;
  modelName: string;
  latencyMs: number | null;
  lastChecked: string | null;
  serverType: 'llama-server' | 'koboldcpp' | 'simulated';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // base64 strings or URLs
  timestamp: string;
  tokensPerSec?: number;
  tokensUsed?: number;
}

export interface ModelPreset {
  id: string;
  name: string;
  description: string;
  modelUrl: string;
  modelFilename: string;
  mmprojUrl: string;
  mmprojFilename: string;
  quantization: string;
  contextSize: number;
  recommendedSplit: string;
  estimatedVramMb: number;
}

export interface RepoFile {
  path: string;
  name: string;
  language: string;
  description: string;
  content: string;
}
