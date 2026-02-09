/**
 * Skill: v0_ui
 * Generate UI components with v0.dev AI
 */

export const tools = [
  {
    name: 'v0_create_chat',
    description:
      'Create a new v0 chat session to generate UI components. Returns chat ID for subsequent messages.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the chat session (e.g., "NFT Gallery Component")',
        },
        message: {
          type: 'string',
          description: 'Initial message/prompt for the UI generation',
        },
      },
      required: ['name', 'message'],
    },
  },
  {
    name: 'v0_send_message',
    description:
      'Send a message to v0 to generate or modify UI. Be specific about framework (React), styling (Tailwind), and requirements.',
    input_schema: {
      type: 'object',
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID from v0_create_chat',
        },
        message: {
          type: 'string',
          description: 'Detailed prompt describing the UI to generate. Include: component type, styling, functionality, responsive requirements.',
        },
      },
      required: ['chat_id', 'message'],
    },
  },
  {
    name: 'v0_get_chat',
    description:
      'Get chat details including generated code. Use after sending message to retrieve the component code.',
    input_schema: {
      type: 'object',
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID to retrieve',
        },
      },
      required: ['chat_id'],
    },
  },
  {
    name: 'v0_list_chats',
    description:
      'List all v0 chats. Useful to find previous UI generations that can be reused or forked.',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max number of chats to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'v0_fork_chat',
    description:
      'Fork an existing v0 chat to create variations. Good for A/B testing UI designs.',
    input_schema: {
      type: 'object',
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID to fork',
        },
        name: {
          type: 'string',
          description: 'Name for the forked chat',
        },
      },
      required: ['chat_id'],
    },
  },
];

async function v0Request(endpoint, method = 'GET', body = null) {
  const apiKey = process.env.V0_DEV_KEY;
  const baseUrl = 'https://api.v0.dev';

  if (!apiKey) {
    return { error: 'V0_DEV_KEY not configured. Add it to .env to use v0 UI generation.' };
  }

  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`v0 API error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('[v0] API error:', err.message);
    return { error: err.message };
  }
}

export function createExecutors(deps) {
  return {
    async v0_create_chat({ name, message }) {
      const result = await v0Request('/v1/chats', 'POST', { name, message });
      if (result.error) return `Error: ${result.error}`;
      return `Chat created!\nID: ${result.id}\nName: ${result.name}\n\nUse v0_send_message with this chat_id to generate UI.`;
    },

    async v0_send_message({ chat_id, message }) {
      const result = await v0Request(`/v1/chats/${chat_id}/messages`, 'POST', {
        content: message,
      });
      if (result.error) return `Error: ${result.error}`;

      // Wait a bit for generation
      await new Promise(r => setTimeout(r, 3000));

      return `Message sent to v0!\n\nv0 is generating the component. Use v0_get_chat({ chat_id: "${chat_id}" }) to retrieve the generated code.`;
    },

    async v0_get_chat({ chat_id }) {
      const result = await v0Request(`/v1/chats/${chat_id}`);
      if (result.error) return `Error: ${result.error}`;

      let output = `Chat: ${result.name || chat_id}\n`;
      output += `Status: ${result.status || 'unknown'}\n\n`;

      if (result.messages && result.messages.length > 0) {
        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage.code) {
          output += `Generated Code:\n\`\`\`jsx\n${lastMessage.code}\n\`\`\``;
        } else if (lastMessage.content) {
          output += `Last Message:\n${lastMessage.content}`;
        }
      }

      if (result.previewUrl) {
        output += `\n\nPreview: ${result.previewUrl}`;
      }

      return output;
    },

    async v0_list_chats({ limit = 10 }) {
      const result = await v0Request(`/v1/chats?limit=${limit}`);
      if (result.error) return `Error: ${result.error}`;

      if (!result.chats || result.chats.length === 0) {
        return 'No v0 chats found. Use v0_create_chat to start generating UI.';
      }

      let output = 'v0 Chats:\n\n';
      for (const chat of result.chats) {
        output += `• ${chat.name || 'Untitled'} (ID: ${chat.id})\n`;
        if (chat.updatedAt) {
          output += `  Updated: ${new Date(chat.updatedAt).toLocaleDateString()}\n`;
        }
      }
      return output;
    },

    async v0_fork_chat({ chat_id, name }) {
      const result = await v0Request(`/v1/chats/${chat_id}/fork`, 'POST', { name });
      if (result.error) return `Error: ${result.error}`;
      return `Chat forked!\nNew ID: ${result.id}\nName: ${result.name || name}\n\nYou can now modify this copy without affecting the original.`;
    },
  };
}
