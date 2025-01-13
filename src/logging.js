import { join } from 'path';
import { platform, homedir } from 'os';
import { getPackageName, MAX_LOG_LINES } from './constants.js';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

async function getSystemLogPath() {
    const appName = await getPackageName();

    switch (platform()) {
        case 'linux':
            return join(homedir(), '.local/share/logs', appName);
        case 'darwin':
            return join(homedir(), 'Library/Logs', appName);
        case 'win32':
            return join(homedir(), 'AppData/Local/Logs', appName);
        default:
            return join(homedir(), '.logs', appName);
    }
}

function ensureDirectoryExists(dirPath) {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}

function rotateLogFile(logFile) {
    try {
        if (existsSync(logFile)) {
            const content = readFileSync(logFile, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length > MAX_LOG_LINES) {
                const trimmedLines = lines.slice(-MAX_LOG_LINES);
                writeFileSync(logFile, trimmedLines.join('\n') + '\n');
            }
        }
    } catch (error) {
        console.error('Error while rotating logs file:', error);
    }
}

export async function logRPC(type, data) {
    const logDir = await getSystemLogPath();
    const logFile = join(logDir, 'server.log');

    const logEntry = {
        timestamp: new Date().toISOString(),
        type,
        data
    };

    try {
        ensureDirectoryExists(logDir);
        rotateLogFile(logFile);
        appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        return true;
    } catch (error) {
        console.error('Error while writing log line:', error);
        return false;
    }
}
