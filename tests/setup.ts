import { vi } from 'vitest';

process.env.Qwen_API_KEY = 'test-api-key';
process.env.Qwen_API_URL = 'https://test.example.com';
process.env.LLM_PROVIDER = 'qwen';

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).slice(2, 9)
}));