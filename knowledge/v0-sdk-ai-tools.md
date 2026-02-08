# @v0-sdk/ai-tools - AI SDK Tools for v0 Platform

> Use v0 to generate UI components, manage projects, and deploy applications.

## Installation

```bash
npm install @v0-sdk/ai-tools ai zod@^3.23.8
```

**Requirements:**
- AI SDK 5.0.0+
- Zod 3.23.8+
- Node.js 22+

## Configuration

Set `V0_DEV_KEY` environment variable:

```javascript
// In SolanaHacker agent, use the v0_ui skill:
await load_skill({ skill_name: "v0_ui" });

// The skill reads from process.env.V0_DEV_KEY automatically
```

## Tool Categories

### Chat Operations (8 tools)
For generating and managing UI via v0 chat:

| Tool | Description |
|------|-------------|
| `createChat` | Start a new v0 chat session |
| `sendMessage` | Send message to generate/modify UI |
| `updateChat` | Update chat properties |
| `deleteChat` | Delete a chat |
| `favoriteChat` | Mark chat as favorite |
| `forkChat` | Fork an existing chat |
| `listChats` | List all chats |
| `getChat` | Get chat details |

### Project Management (10 tools)
For managing v0 projects:

| Tool | Description |
|------|-------------|
| `createProject` | Create new v0 project |
| `getProject` | Get project details |
| `updateProject` | Update project settings |
| `deleteProject` | Delete a project |
| `listProjects` | List all projects |
| `assignChatToProject` | Assign chat to project |
| `getProjectEnvVars` | Get environment variables |
| `setProjectEnvVar` | Set environment variable |
| `deleteProjectEnvVar` | Delete environment variable |
| `getProjectFiles` | Get project files |

### Deployments (6 tools)

| Tool | Description |
|------|-------------|
| `createDeployment` | Deploy to Vercel |
| `getDeployment` | Get deployment status |
| `deleteDeployment` | Delete deployment |
| `listDeployments` | List all deployments |
| `getDeploymentLogs` | Get deployment logs |
| `getDeploymentErrors` | Get deployment errors |

### User Information (5 tools)

| Tool | Description |
|------|-------------|
| `getUserInfo` | Get user details |
| `getUserBilling` | Get billing info |
| `getUserPlan` | Get plan details |
| `getUserPermissions` | Get permissions |
| `getRateLimits` | Get API rate limits |

### Webhooks (5 tools)

| Tool | Description |
|------|-------------|
| `createWebhook` | Create webhook |
| `getWebhook` | Get webhook details |
| `updateWebhook` | Update webhook |
| `deleteWebhook` | Delete webhook |
| `listWebhooks` | List all webhooks |

## Usage Patterns

### Get All Tools (Flat)

```javascript
import { v0Tools } from '@v0-sdk/ai-tools';

const tools = v0Tools({ apiKey: process.env.V0_API_KEY });
// Returns all 34 tools in flat structure
```

### Get Tools by Category

```javascript
import { v0ToolsByCategory } from '@v0-sdk/ai-tools';

const { chatTools, projectTools, deploymentTools } = v0ToolsByCategory({
  apiKey: process.env.V0_API_KEY
});
```

### Get Specific Category

```javascript
import { createChatTools, createProjectTools } from '@v0-sdk/ai-tools';

const chatTools = createChatTools({ apiKey: process.env.V0_API_KEY });
```

## Example: Generate UI Component

```javascript
// 1. Create a chat
const chat = await tools.createChat({
  name: "NFT Gallery Component"
});

// 2. Send prompt to generate UI
const result = await tools.sendMessage({
  chatId: chat.id,
  message: "Create a responsive NFT gallery grid with card hover effects, showing image, title, price in SOL, and a 'Buy' button. Use Tailwind CSS."
});

// 3. Get the generated code
const chatDetails = await tools.getChat({ chatId: chat.id });
// chatDetails contains the generated React component code
```

## Example: Create and Deploy Project

```javascript
// 1. Create project
const project = await tools.createProject({
  name: "memeforge-frontend",
  description: "NFT meme generator"
});

// 2. Assign chat with UI to project
await tools.assignChatToProject({
  chatId: uiChat.id,
  projectId: project.id
});

// 3. Set environment variables
await tools.setProjectEnvVar({
  projectId: project.id,
  key: "NEXT_PUBLIC_SOLANA_RPC",
  value: "https://api.mainnet-beta.solana.com"
});

// 4. Deploy
const deployment = await tools.createDeployment({
  projectId: project.id
});

console.log(`Deployed to: ${deployment.url}`);
```

## Best Practices

1. **Use Chat for UI Generation**: v0 excels at generating React/Next.js components
2. **Be Specific in Prompts**: Include framework (React), styling (Tailwind), and detailed requirements
3. **Iterate with Messages**: Send follow-up messages to refine generated UI
4. **Fork Successful Chats**: Use `forkChat` to branch from good starting points
5. **Check Rate Limits**: Use `getRateLimits` before bulk operations

## Integration with SolanaHacker

For MemeForge project:
- Generate NFT gallery components
- Create voting UI (Tinder-style swipe)
- Build wallet connection flows
- Design leaderboard displays
- Auto-deploy to Vercel for testing

## References

- [v0 SDK GitHub](https://github.com/vercel/v0-sdk)
- [AI SDK Documentation](https://ai-sdk.dev/)
