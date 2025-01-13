import { logRPC } from './src/logging.js';
import { fetchResource } from './src/utils.js';
import { ResponseFormats } from './src/response-formats.js';
import { PROTOCOL_VERSION, RPC_ERROR_CODES } from './src/constants.js';

/**
 * Class representing a MCP server
 * @param {Object} infos - The server infos { name, version }
 * @param {Object} prompts - The server prompts
 * @param {Object} resources - The server resources
 * @param {Object} tools - The server tools
 * @returns {MCP} - A new MCP server instance
 */
export class MCP {
    constructor(infos, prompts, resources, tools) {
        this.infos = infos;
        this.tools = tools;
        this.prompts = prompts;
        this.resources = resources;
        this.isConnected = false;
        this.buffer = '';
        this.initializeServer();
    }

    initializeServer() {
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', this.handleInput.bind(this));
        process.on('SIGTERM', this.handleTermination.bind(this));
    }

    async handleInput(chunk) {
        this.buffer += chunk;
        let newlineIndex;
        while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
            const line = this.buffer.slice(0, newlineIndex);
            this.buffer = this.buffer.slice(newlineIndex + 1);
            if (line.trim()) await this.processRequest(line);
        }
    }

    createResponse(id, result) {
        return ResponseFormats.jsonRPC(id, result);
    }

    createErrorResponse(id, code, message, data) {
        return ResponseFormats.error(id, code, message, data);
    }

    async processRequest(line) {
        try {
            const request = JSON.parse(line);
            await logRPC('request', request);

            const response = await this.handleMethod(request);
            if (request.id !== undefined) {
                await logRPC('response', response);
                process.stdout.write(JSON.stringify(response) + '\n');
            }
        } catch (error) {
            const errorResponse = this.createErrorResponse(null, RPC_ERROR_CODES.PARSE_ERROR, 'Parse error', error.message);
            await logRPC('error', errorResponse);
            process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
    }

    async handleMethod(request) {
        const { method, params, id } = request;

        const methodHandlers = {
            initialize: () => this.handleInitialize(params),
            shutdown: () => this.handleShutdown(),
            exit: () => this.handleExit(),
            'tools/list': () => this.handleToolsList(),
            'tools/call': () => this.handleToolsCall(params),
            'notifications/cancelled': () => this.handleNotificationsCancelled(),
            'notifications/initialized': () => this.handleNotificationsInitialized(),
            'ping': () => this.handlePing(),
            'prompts/list': () => this.handlePromptsList(),
            'prompts/get': () => this.handlePromptsGet(params),
            'resources/list': () => this.handleResourcesList(),
            'resources/read': () => this.handleResourcesRead(params),
            'resources/templates/list': () => this.handleResourcesTemplatesList()
        };

        const handler = methodHandlers[method];
        if (!handler) {
            return this.createErrorResponse(id, RPC_ERROR_CODES.METHOD_NOT_FOUND, 'Method not found');
        }

        return this.createResponse(id, await handler());
    }

    handlePing() {
        return {};
    }

    handleShutdown() {
        this.isConnected = false;
        return null;
    }

    handleExit() {
        process.exit(0);
    }

    handleNotificationsCancelled() {
        return null;
    }

    handleNotificationsInitialized() {
        return null;
    }

    handleResourcesList() {
        return ResponseFormats.resources.list(Object.entries(this.resources));
    }

    async handleResourcesRead(params) {
        const { uri } = params;
        const resource = Object.values(this.resources).find(r => r.uri === uri);

        if (!resource) {
            throw new Error('Resource not found');
        }

        if (uri.startsWith('http')) {
            try {
                const { content, mimeType } = await fetchResource(uri);
                return ResponseFormats.resources.read({
                    ...resource,
                    mimeType,
                    content
                });
            } catch (error) {
                throw new Error(`Failed to fetch resource: ${error.message}`);
            }
        }

        return ResponseFormats.resources.read(resource);
    }

    handleResourcesTemplatesList() {
        return ResponseFormats.resources.templates();
    }

    handlePromptsList() {
        return ResponseFormats.prompts.list(Object.entries(this.prompts));
    }

    handlePromptsGet(params) {
        const { name } = params;
        const prompt = this.prompts[name];

        if (!prompt) {
            throw new Error('Prompt not found');
        }

        return ResponseFormats.prompts.get(prompt);
    }

    handleInitialize(params) {
        if (params?.protocolVersion !== PROTOCOL_VERSION) {
            throw new Error('Protocol version not supported');
        }
        this.isConnected = true;
        process.stdin.resume();

        return ResponseFormats.initialize(PROTOCOL_VERSION, this.infos);
    }

    async handleTermination() {
        if (this.isConnected) {
            await logRPC('info', { message: 'Server shutting down' });
        }
        process.exit(0);
    }

    async handleToolsList() {
        return ResponseFormats.tools.list(Object.entries(this.tools));
    }

    async handleToolsCall(params) {
        const { name, arguments: args } = params;
        const tool = this.tools[name];

        if (!tool) {
            throw new Error('Tool not found');
        }

        const result = await tool.handler(args);
        return ResponseFormats.tools.call(result);
    }
}
