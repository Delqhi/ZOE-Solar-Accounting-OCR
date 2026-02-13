import type { AIConfig } from './types';

export const AI_PROVIDERS = {
  NVIDIA: {
    enabled: true,
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'moonshotai/kimi-k2.5',
    apiKey: import.meta.env.VITE_NVIDIA_API_KEY || '',
    priority: 1,
    timeout: 30000,
    maxRetries: 3,
  },
  SILICONFLOW: {
    enabled: true,
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen2.5-VL-72B-Instruct',
    apiKey: import.meta.env.VITE_SILICONFLOW_API_KEY || '',
    priority: 2,
    timeout: 30000,
    maxRetries: 3,
  },
  MISTRAL: {
    enabled: true,
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'pixtral-12b-2409',
    apiKey: import.meta.env.VITE_MISTRAL_API_KEY || '',
    priority: 3,
    timeout: 30000,
    maxRetries: 2,
  },
  OPENCODE: {
    enabled: true,
    baseUrl: 'https://api.opencode.ai/v1',
    model: 'zen/big-pickle',
    apiKey: import.meta.env.VITE_OPENCODE_API_KEY || '',
    priority: 4,
    timeout: 45000,
    maxRetries: 2,
  },
} as const satisfies Record<string, AIConfig>;

export type ProviderName = keyof typeof AI_PROVIDERS;
