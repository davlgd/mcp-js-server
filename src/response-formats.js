export const ResponseFormats = {
    initialize: (version, info) => ({
        protocolVersion: version,
        serverInfo: info,
        capabilities: {
            sampling: {},
            roots: { listChanged: true },
            prompts: { listChanged: false }
        }
    }),

    tools: {
        list: (tools) => ({
            tools: tools.map(([name, tool]) => ({
                name,
                description: tool.description,
                parameters: tool.schema.properties || {},
                inputSchema: tool.schema
            }))
        }),
        call: (result) => ({
            content: [{
                type: 'text',
                text: result
            }]
        })
    },

    prompts: {
        list: (prompts) => ({
            prompts: prompts.map(([name, prompt]) => ({
                name,
                description: prompt.description,
                arguments: prompt.arguments
            }))
        }),
        get: (prompt) => ({
            description: prompt.description,
            messages: prompt.messages
        })
    },

    resources: {
        list: (resources) => ({
            resources: resources.map(([name, resource]) => ({
                name,
                uri: resource.uri,
                MimeType: resource.mimeType
            }))
        }),
        read: (resource) => ({
            contents: [{
                uri: resource.uri,
                mimeType: resource.mimeType,
                text: resource.content || "No content to display"
            }]
        }),
        templates: () => ({ templates: [] })
    },

    error: (id, code, message, data) => ({
        jsonrpc: '2.0',
        id,
        error: { code, message, data }
    }),

    jsonRPC: (id, result) => ({
        jsonrpc: '2.0',
        id,
        result
    })
};
