/**
 * LLM Provider Abstraction
 *
 * Converts between Anthropic SDK format (used internally by the agent loop)
 * and OpenAI/Grok format (used by X.AI API). All format conversion happens
 * at the API boundary so the agent loop stays unchanged.
 *
 * Usage:
 *   const provider = createProvider('grok', { apiKey, model });
 *   const response = await provider.messages.create({ system, messages, tools, max_tokens });
 *   // Response is in Anthropic format: { content, stop_reason, usage }
 */

// ============================================
//  Anthropic Provider (passthrough)
// ============================================

class AnthropicProvider {
  constructor(client, config = {}) {
    this.client = client;
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.type = 'anthropic';
    this.messages = {
      create: async (params) => {
        // Use configured model if not specified in params
        const request = { ...params };
        if (!request.model) {
          request.model = this.model;
        }
        return this.client.messages.create(request);
      },
    };
  }
}

// ============================================
//  Grok Provider (Anthropic ↔ OpenAI conversion)
// ============================================

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

class GrokProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'grok-4-1-fast-reasoning';
    this.type = 'grok';

    if (!this.apiKey) {
      throw new Error('GrokProvider requires apiKey (XAI_API_KEY)');
    }

    this.messages = {
      create: async (params) => {
        return this._callGrok(params);
      },
    };
  }

  /**
   * Convert Anthropic-format request to OpenAI format, call Grok, convert response back
   */
  async _callGrok(params) {
    const openaiRequest = this._convertRequest(params);

    // Debug: log tool count and message count
    console.log(`[Grok] Request: ${openaiRequest.messages.length} messages, ${openaiRequest.tools?.length || 0} tools, model: ${openaiRequest.model}`);

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(openaiRequest),
    });

    if (!response.ok) {
      const errText = await response.text();
      const error = new Error(`Grok API error: ${response.status} - ${errText}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();

    // Debug: log raw response structure
    const choice = data.choices?.[0];
    const hasToolCalls = choice?.message?.tool_calls?.length > 0;
    console.log(`[Grok] Response: finish_reason=${choice?.finish_reason}, tool_calls=${hasToolCalls ? choice.message.tool_calls.length : 0}, content_length=${choice?.message?.content?.length || 0}`);
    if (hasToolCalls) {
      for (const tc of choice.message.tool_calls) {
        console.log(`[Grok]   tool_call: ${tc.function?.name}(${tc.function?.arguments?.slice(0, 80)}...)`);
      }
    }

    return this._convertResponse(data);
  }

  /**
   * Convert Anthropic-format request → OpenAI-format request
   */
  _convertRequest(params) {
    const openaiMessages = [];

    // 1. System prompt → system message
    if (params.system) {
      let systemText = '';
      if (typeof params.system === 'string') {
        systemText = params.system;
      } else if (Array.isArray(params.system)) {
        // Anthropic format: [{type: 'text', text: '...', cache_control: ...}]
        systemText = params.system
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('\n');
      }
      if (systemText) {
        openaiMessages.push({ role: 'system', content: systemText });
      }
    }

    // 2. Convert messages
    for (const msg of params.messages || []) {
      if (msg.role === 'user') {
        if (typeof msg.content === 'string') {
          openaiMessages.push({ role: 'user', content: msg.content });
        } else if (Array.isArray(msg.content)) {
          // Check if it contains tool_result blocks
          const toolResults = msg.content.filter(b => b.type === 'tool_result');
          const otherBlocks = msg.content.filter(b => b.type !== 'tool_result');

          // Convert tool_results to separate tool messages
          for (const tr of toolResults) {
            openaiMessages.push({
              role: 'tool',
              tool_call_id: tr.tool_use_id,
              content: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content),
            });
          }

          // Convert other content blocks (text, image) to user message
          if (otherBlocks.length > 0) {
            const parts = this._convertContentToOpenAI(otherBlocks);
            if (parts.length > 0) {
              openaiMessages.push({ role: 'user', content: parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts });
            }
          }
        }
      } else if (msg.role === 'assistant') {
        if (typeof msg.content === 'string') {
          openaiMessages.push({ role: 'assistant', content: msg.content });
        } else if (Array.isArray(msg.content)) {
          const textParts = msg.content.filter(b => b.type === 'text');
          const toolUses = msg.content.filter(b => b.type === 'tool_use');

          const assistantMsg = {
            role: 'assistant',
            content: textParts.map(b => b.text).join('\n') || null,
          };

          // Convert tool_use → tool_calls
          if (toolUses.length > 0) {
            assistantMsg.tool_calls = toolUses.map(tu => ({
              id: tu.id,
              type: 'function',
              function: {
                name: tu.name,
                arguments: JSON.stringify(tu.input || {}),
              },
            }));
          }

          openaiMessages.push(assistantMsg);
        }
      }
    }

    // 3. Convert tools
    let openaiTools;
    if (params.tools && params.tools.length > 0) {
      openaiTools = params.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description || '',
          parameters: this._stripCacheControl(tool.input_schema || { type: 'object', properties: {} }),
        },
      }));
    }

    const request = {
      model: params.model || this.model,
      messages: openaiMessages,
      max_tokens: params.max_tokens || 8192,
    };

    if (openaiTools) {
      request.tools = openaiTools;
    }

    return request;
  }

  /**
   * Convert Anthropic content blocks to OpenAI content parts
   */
  _convertContentToOpenAI(blocks) {
    const parts = [];
    for (const block of blocks) {
      if (block.type === 'text') {
        parts.push({ type: 'text', text: block.text });
      } else if (block.type === 'image') {
        // Anthropic image → OpenAI image_url
        if (block.source?.type === 'base64') {
          parts.push({
            type: 'image_url',
            image_url: {
              url: `data:${block.source.media_type};base64,${block.source.data}`,
            },
          });
        }
      }
    }
    return parts;
  }

  /**
   * Convert OpenAI-format response → Anthropic-format response
   */
  _convertResponse(data) {
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('No choices in Grok response');
    }

    const message = choice.message;
    const content = [];

    // Convert text content (skip reasoning_content if present)
    if (message.content) {
      content.push({ type: 'text', text: message.content });
    }

    // Convert tool_calls → tool_use blocks
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const tc of message.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(tc.function.arguments || '{}');
        } catch {
          args = {};
        }
        // v4.6: Fix Grok double-escaping — after JSON.parse, literal \n \t \\ remain
        // as two-char sequences instead of actual control characters
        args = this._unescapeLiterals(args);
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input: args,
        });
      }
    }

    // Determine stop_reason
    // Note: Grok/X.AI may use different finish_reason values than OpenAI
    // Be robust: detect tool_use by presence of tool_calls, not just finish_reason string
    const hasTools = message.tool_calls && message.tool_calls.length > 0;
    let stop_reason = 'end_turn';
    if (hasTools || choice.finish_reason === 'tool_calls') {
      stop_reason = 'tool_use';
    } else if (choice.finish_reason === 'length') {
      stop_reason = 'max_tokens';
    }

    // Convert usage
    const usage = {};
    if (data.usage) {
      usage.input_tokens = data.usage.prompt_tokens || 0;
      usage.output_tokens = data.usage.completion_tokens || 0;
      // No cache metrics for Grok
    }

    return {
      content,
      stop_reason,
      usage,
      model: data.model || this.model,
    };
  }

  /**
   * Recursively fix Grok's double-escaped strings in tool call arguments.
   * Grok often sends \\n instead of \n in JSON, so after JSON.parse we get
   * literal two-char "\n" instead of actual newline (0x0a).
   */
  _unescapeLiterals(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      // Only unescape if the string contains literal escape sequences
      // Check for literal \n (0x5c 0x6e) by looking for backslash followed by n/t/r
      if (obj.includes('\\n') || obj.includes('\\t') || obj.includes('\\r')) {
        return obj
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r');
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => this._unescapeLiterals(item));
    if (typeof obj === 'object') {
      const fixed = {};
      for (const [key, value] of Object.entries(obj)) {
        fixed[key] = this._unescapeLiterals(value);
      }
      return fixed;
    }
    return obj;
  }

  /**
   * Recursively strip cache_control fields from objects (Anthropic-only feature)
   */
  _stripCacheControl(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this._stripCacheControl(item));

    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'cache_control') continue;
      cleaned[key] = this._stripCacheControl(value);
    }
    return cleaned;
  }
}

// ============================================
//  Factory
// ============================================

/**
 * Create an LLM provider
 * @param {string} type - 'anthropic' or 'grok'
 * @param {object} config - { apiKey, model, client (for anthropic) }
 * @returns {object} Provider with .messages.create() matching Anthropic SDK interface
 */
export function createProvider(type, config = {}) {
  switch (type) {
    case 'anthropic':
      if (!config.client) {
        throw new Error('AnthropicProvider requires client (Anthropic SDK instance)');
      }
      return new AnthropicProvider(config.client, config);

    case 'grok':
      return new GrokProvider(config);

    default:
      throw new Error(`Unknown provider type: ${type}. Use 'anthropic' or 'grok'.`);
  }
}
