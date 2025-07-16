import { getConfig } from '../config'

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogData = Record<string, any>;

// ANSI color codes
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    // Foreground colors
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",

    // Background colors
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m"
};

class Logger {
    // Cache the config
    private configCache = getConfig();

    private colorizeLevel(level: string): string {
        switch (level.toUpperCase()) {
            case 'INFO':
                return `${colors.green}${level}${colors.reset}`;
            case 'WARN':
                return `${colors.yellow}${level}${colors.reset}`;
            case 'ERROR':
                return `${colors.red}${level}${colors.reset}`;
            case 'DEBUG':
                return `${colors.cyan}${level}${colors.reset}`;
            default:
                return level;
        }
    }

    private colorizeKey(key: string): string {
        return `${colors.cyan}${key}${colors.reset}`;
    }

    private colorizeValue(value: any, isNumber = false): string {
        if (isNumber) return `${colors.yellow}${value}${colors.reset}`;
        if (typeof value === 'string') return `${colors.green}${JSON.stringify(value)}${colors.reset}`;
        return `${colors.yellow}${JSON.stringify(value)}${colors.reset}`;
    }

    private colorizeLabel(label: string): string {
        return `${colors.dim}${label}${colors.reset}`;
    }

    private formatLogData(data: LogData): string {
        if (Object.keys(data).length === 0) return '';

        // Convert data to the requested format with labels
        const formattedData = Object.entries(data)
            .map(([key, value]) => {
                const isNumeric = typeof value === 'number';
                // Format based on the key to add context with colors
                if (key === 'port')
                    return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value, true)} ${this.colorizeLabel('[server port]')}`;
                if (key === 'docs')
                    return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value)} ${this.colorizeLabel('[documentation URL]')}`;
                if (key === 'health')
                    return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value)} ${this.colorizeLabel('[health check URL]')}`;
                if (key === 'cors')
                    return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value)} ${this.colorizeLabel('[cross-origin policy]')}`;
                if (key === 'logging')
                    return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value)} ${this.colorizeLabel('[log level]')}`;
                if (key === 'tlsVerification')
                    return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value)} ${this.colorizeLabel('[TLS certificate validation]')}`;
                if (key === 'retryAttempts')
                    return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value, true)} ${this.colorizeLabel('[network retry count]')}`;
                if (key === 'timeout')
                    return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value)} ${this.colorizeLabel('[request timeout]')}`;
                if (key === 'proxyAuth')
                    return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value)} ${this.colorizeLabel('[proxy authentication required]')}`;
                if (key === 'managementAuth')
                    return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value)} ${this.colorizeLabel('[management API authentication required]')}`;

                // Default formatting for other keys
                return `    ${this.colorizeKey(key)}: ${this.colorizeValue(value, isNumeric)}`;
            })
            .join('\n');

        return `{\n${formattedData}\n}`;
    }

    private log(level: LogLevel, message: string, data: LogData = {}): void {
        const timestamp = new Date().toISOString();
        const levelUpper = level.toUpperCase().padEnd(5);

        // Format: [timestamp] LEVEL message with colors
        let logMessage = `${colors.dim}[${timestamp}]${colors.reset} ${this.colorizeLevel(levelUpper)}  ${message}`;

        // Add formatted data if present
        const formattedData = this.formatLogData(data);
        if (formattedData) {
            logMessage += '\n' + formattedData;
        }

        console.log(logMessage);
    }

    info(message: string, data: LogData = {}): void {
        this.log('info', message, data);
    }

    warn(message: string, data: LogData = {}): void {
        this.log('warn', message, data);
    }

    error(message: string, data: LogData = {}): void {
        this.log('error', message, data);
    }

    debug(message: string, data: LogData = {}): void {
        this.log('debug', message, data);
    }

    private shouldLog(level: LogLevel): boolean {
        if (!this.configCache.logging.enabled) return false;

        const configLevel = this.getLevelNumber(this.configCache.logging.level);
        return level >= configLevel;
    }

    private getLevelNumber(level: string): LogLevel {
        switch (level.toLowerCase()) {
            case 'debug': return LogLevel.DEBUG
            case 'info': return LogLevel.INFO
            case 'warn': return LogLevel.WARN
            case 'error': return LogLevel.ERROR
            default: return LogLevel.INFO
        }
    }

    logRequest(service: string, method: string, path: string, status: number, duration: number): void {
        const logLevel = status >= 400 ? 'warn' : 'info'
        const message = `${method.toUpperCase()} /${service}${path} -> ${status}`

        this[logLevel](message, {
            service,
            method,
            path,
            status,
            duration: `${duration}ms`,
            success: status < 400
        })

        // Add specific auth failure logging
        if (status === 401 || status === 403) {
            this.warn(`Authentication issue detected for ${service}`, {
                service,
                status,
                hint: 'Check environment variables and token validity'
            })
        }
    }
}

export const logger = new Logger()
