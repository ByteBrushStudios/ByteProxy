/**
 * UNDER PRESSURE
 * 
 */
import { logger } from "../utils/logger"

export type PressureType =
    | 'eventLoopDelay'
    | 'heapUsedBytes'
    | 'rssBytes'
    | 'healthCheck'
    | 'eventLoopUtilization'

export interface UnderPressureOptions {
    sampleInterval?: number
    maxEventLoopDelay?: number
    maxHeapUsedBytes?: number
    maxRssBytes?: number
    maxEventLoopUtilization?: number
    healthCheck?: (() => Promise<boolean>) | false
    healthCheckInterval?: number
    customError?: Error
    message?: string
    retryAfter?: number
    pressureHandler?: (type: PressureType, value?: number) => void | Promise<void>
}

export interface PressureStatus {
    eventLoopDelay: number
    heapUsed: number
    rssBytes: number
    eventLoopUtilized: number
    healthy: boolean
}

const SERVICE_UNAVAILABLE = 503

export class UnderPressure {
    private options: UnderPressureOptions
    private heapUsed = 0
    private rssBytes = 0
    private eventLoopDelay = 0
    private eventLoopUtilized = 0
    private healthy = true
    private timer: NodeJS.Timeout | null = null
    private healthCheckTimer: NodeJS.Timeout | null = null
    private histogram: any
    private elu: any
    private lastCheck: number = Date.now()

    constructor(options: UnderPressureOptions = {}) {
        this.options = options
        this.init()
    }

    private init() {
        const {
            sampleInterval = 1000,
            healthCheck,
            healthCheckInterval = -1,
        } = this.options

        // Event loop delay monitoring (Node >=12)
        try {
            const { monitorEventLoopDelay } = require('perf_hooks')
            this.histogram = monitorEventLoopDelay({ resolution: 10 })
            this.histogram.enable()
        } catch {
            this.histogram = null
            this.lastCheck = Date.now()
        }

        // Event loop utilization (Node >=12)
        try {
            const { eventLoopUtilization } = require('perf_hooks').performance
            this.elu = eventLoopUtilization()
        } catch {
            this.elu = null
        }

        this.timer = setInterval(() => this.updateMemoryUsage(), sampleInterval)
        if (this.timer.unref) this.timer.unref()

        if (healthCheck && typeof healthCheck === 'function') {
            this.runHealthCheck(healthCheck)
            if (healthCheckInterval > 0) {
                this.healthCheckTimer = setInterval(() => this.runHealthCheck(healthCheck), healthCheckInterval)
                if (this.healthCheckTimer.unref) this.healthCheckTimer.unref()
            }
        }
    }

    private async runHealthCheck(fn: () => Promise<boolean>) {
        try {
            this.healthy = await fn()
        } catch (err) {
            this.healthy = false
            logger.error('External healthCheck failed', { error: (err as Error).message })
        }
    }

    private updateMemoryUsage() {
        const mem = process.memoryUsage()
        this.heapUsed = mem.heapUsed
        this.rssBytes = mem.rss
        this.updateEventLoopDelay()
        this.updateEventLoopUtilization()
    }

    private updateEventLoopDelay() {
        if (this.histogram) {
            this.eventLoopDelay = Math.max(0, this.histogram.mean / 1e6 - 10)
            if (Number.isNaN(this.eventLoopDelay)) this.eventLoopDelay = Infinity
            this.histogram.reset()
        } else {
            const now = Date.now()
            this.eventLoopDelay = Math.max(0, now - this.lastCheck - (this.options.sampleInterval || 1000))
            this.lastCheck = now
        }
    }

    private updateEventLoopUtilization() {
        if (this.elu) {
            const { eventLoopUtilization } = require('perf_hooks').performance
            this.eventLoopUtilized = eventLoopUtilization(this.elu).utilization
        } else {
            this.eventLoopUtilized = 0
        }
    }

    public getStatus(): PressureStatus {
        return {
            eventLoopDelay: this.eventLoopDelay,
            heapUsed: this.heapUsed,
            rssBytes: this.rssBytes,
            eventLoopUtilized: this.eventLoopUtilized,
            healthy: this.healthy
        }
    }

    public checkPressure(): { type?: PressureType, value?: number, error?: Error } | null {
        const {
            maxEventLoopDelay = 0,
            maxHeapUsedBytes = 0,
            maxRssBytes = 0,
            maxEventLoopUtilization = 0,
            customError,
            message
        } = this.options

        if (maxEventLoopDelay > 0 && this.eventLoopDelay > maxEventLoopDelay) {
            logger.warn('Under pressure: event loop delay', { value: this.eventLoopDelay })
            return { type: 'eventLoopDelay', value: this.eventLoopDelay, error: customError || new Error(message || 'Service Unavailable') }
        }
        if (maxHeapUsedBytes > 0 && this.heapUsed > maxHeapUsedBytes) {
            logger.warn('Under pressure: heap used bytes', { value: this.heapUsed })
            return { type: 'heapUsedBytes', value: this.heapUsed, error: customError || new Error(message || 'Service Unavailable') }
        }
        if (maxRssBytes > 0 && this.rssBytes > maxRssBytes) {
            logger.warn('Under pressure: RSS bytes', { value: this.rssBytes })
            return { type: 'rssBytes', value: this.rssBytes, error: customError || new Error(message || 'Service Unavailable') }
        }
        if (maxEventLoopUtilization > 0 && this.eventLoopUtilized > maxEventLoopUtilization) {
            logger.warn('Under pressure: event loop utilization', { value: this.eventLoopUtilized })
            return { type: 'eventLoopUtilization', value: this.eventLoopUtilized, error: customError || new Error(message || 'Service Unavailable') }
        }
        if (!this.healthy) {
            logger.warn('Under pressure: health check failed')
            return { type: 'healthCheck', error: customError || new Error(message || 'Service Unavailable') }
        }
        return null
    }

    public shutdown() {
        if (this.timer) clearInterval(this.timer)
        if (this.healthCheckTimer) clearInterval(this.healthCheckTimer)
    }
}

// Export pressure types for external use
export const TYPE_EVENT_LOOP_DELAY = 'eventLoopDelay'
export const TYPE_HEAP_USED_BYTES = 'heapUsedBytes'
export const TYPE_RSS_BYTES = 'rssBytes'
export const TYPE_HEALTH_CHECK = 'healthCheck'
export const TYPE_EVENT_LOOP_UTILIZATION = 'eventLoopUtilization'