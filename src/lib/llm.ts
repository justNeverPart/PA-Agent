interface LLMConfig {
  apiKey: string;
  apiUrl: string;
  provider: 'qwen' | 'kimi' | 'minimax';
  model: string;
}

function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || 'minimax') as 'qwen' | 'kimi' | 'minimax';

  let apiKey: string;
  let apiUrl: string;
  let model: string;

  switch (provider) {
    case 'minimax':
      apiKey = process.env.MINIMAX_API_KEY || '';
      apiUrl = process.env.MINIMAX_API_URL || 'https://api.minimax.chat/v1/text/chatcompletion_v2';
      model = 'MiniMax-Text-01';
      if (!apiKey && process.env.MINIMAX_API_KEY) {
        // MiniMax requires Group ID for API access
        // User should set MINIMAX_API_KEY to their key
      }
      break;
    case 'kimi':
      apiKey = process.env.KIMI_API_KEY || '';
      apiUrl = process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1/chat/completions';
      model = 'moonshot-v1-8k';
      break;
    case 'qwen':
    default:
      apiKey = process.env.Qwen_API_KEY || '';
      apiUrl = process.env.Qwen_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
      model = 'qwen-plus';
      break;
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(`Missing required environment variable: ${provider.toUpperCase()}_API_KEY`);
  }

  return { apiKey, apiUrl, provider, model };
}

export async function callLLM(prompt: string, conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>, temperature: number = 0.7): Promise<string> {
  const config = getLLMConfig();

  // Build messages array - MiniMax doesn't support system role, so we prepend system prompt as user message
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  if (config.provider === 'minimax') {
    // MiniMax: prepend system prompt as user message
    if (prompt) {
      messages.push({ role: 'user', content: prompt });
    }
    if (conversationHistory) {
      messages.push(...conversationHistory);
    }
  } else {
    // Standard: system prompt first, then conversation history
    messages.push({ role: 'system', content: prompt });
    if (conversationHistory) {
      messages.push(...conversationHistory);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature
    }),
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Handle MiniMax response format
  if (config.provider === 'minimax') {
    const choice = data.choices?.[0];
    if (choice?.message?.content) {
      return choice.message.content;
    }
  }

  // Handle standard OpenAI-compatible format
  return data.choices?.[0]?.message?.content || data.content || '';
}
