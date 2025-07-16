import { getConfig } from '../config'

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface LogEntry {
    level: LogLevel
    message: string
    timestamp: Date
    metadata?: Record<string, any>
}

class Logger {
    private getLevelNumber(level: string): LogLevel {
        switch (level.toLowerCase()) {
            case 'debug': return LogLevel.DEBUG
            case 'info': return LogLevel.INFO
            case 'warn': return LogLevel.WARN
            case 'error': return LogLevel.ERROR
            default: return LogLevel.INFO
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const config = getConfig()
        if (!config.logging.enabled) return false

        const configLevel = this.getLevelNumber(config.logging.level)
        return level >= configLevel
    }

    private formatMessage(level: LogLevel, message: string, metadata?: Record<string, any>): string {
        const timestamp = new Date().toISOString()
        const levelStr = LogLevel[level].padEnd(5)

        let formatted = `[${timestamp}] ${levelStr} ${message}`

        if (metadata && Object.keys(metadata).length > 0) {
            formatted += ` | ${JSON.stringify(metadata)}`
        }

        return formatted
    }

    debug(message: string, metadata?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage(LogLevel.DEBUG, message, metadata))
        }
    }

    info(message: string, metadata?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage(LogLevel.INFO, message, metadata))
        }
    }

    warn(message: string, metadata?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(LogLevel.WARN, message, metadata))
        }
    }

    error(message: string, metadata?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage(LogLevel.ERROR, message, metadata))
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
