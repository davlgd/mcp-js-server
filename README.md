# MCP Server - JavaScript SDK
[![smithery badge](https://smithery.ai/badge/mcp-js-server)](https://smithery.ai/server/mcp-js-server)

This is an unofficial JavaScript SDK for [Model Context Protocol](https://spec.modelcontextprotocol.io/latest).

## Usage

Import the package to your project:

```bash
npm install mcp-js-server
```

Create files to define the server's prompts, resources, and tools.

### Prompts

```javascript
// prompts.js
export const prompts = {
    hello_world: {
        description: 'A simple prompt that says hello.',
        arguments: [],
        messages: [{
            role: 'assistant',
            content: {
                type: 'text',
                text: 'Hello, world!'
            }
        }]
    }
};
```

### Resources

```javascript
// resources.js
export const resources = {
    apiReference: {
        uri: 'https://api.example.com/openapi.json',
        mimeType: 'application/json'
    }
};
```

### Tools

```javascript
// tools.js
export const tools = {
    simple_tool: {
        description: 'A simple tool',
        handler: async () => new Date().toLocaleString(),
        schema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    complex_tool: {
        description: 'A complex tool',
        handler: async ({ param1, param2 }) => {
            return `param1: ${param1}, param2: ${param2}`;
        },
        schema: {
            type: 'object',
            properties: {
                param1: { type: 'string' },
                param2: { type: 'string' }
            },
            required: ['param1', 'param2']
        }
    }
};
```

### Server

Then create a server instance with the following code:

```javascript
// server.js
import { MCP } from 'mcp-server';
import { tools } from './tools.js';
import { prompts } from './prompts.js';
import { resources } from './resources.js';

const infos = {
    name: 'mcp-demo-server',
    version: '0.1.0'
};

const server = new MCP(infos, prompts, resources, tools);
```

### Debugging

You can find logs of the server in your user system logs directory:

```
Linux:   ~/.local/share/logs
macOS:   ~/Library/Logs
Windows: %USERPROFILE%\AppData\Local\Logs
```
