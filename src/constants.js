import { readFile } from 'fs/promises';

export const MAX_LOG_LINES = 100;
export const PROTOCOL_VERSION = '2024-11-05';

export const RPC_ERROR_CODES = {
    PARSE_ERROR: -32700,
    METHOD_NOT_FOUND: -32601
}
