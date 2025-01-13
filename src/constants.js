import { readFile } from 'fs/promises';

export const MAX_LOG_LINES = 100;
export const PROTOCOL_VERSION = '2024-11-05';

export const RPC_ERROR_CODES = {
    PARSE_ERROR: -32700,
    METHOD_NOT_FOUND: -32601
}

export async function getPackageName () {
    try {
        const packageJson = JSON.parse(await readFile('./package.json', 'utf8'));
        return packageJson.name;
    } catch (error) {
        console.error('Error while reading package.json:', error);
        return 'mcp-js-server-default';
    }
}
