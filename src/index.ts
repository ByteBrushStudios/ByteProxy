import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { getConfig } from './config'
import { corsMiddleware } from './middleware/cors'
import { proxyRoutes } from './routes/proxy'
import { healthRoutes } from './routes/health'
import { managementRoutes } from './routes/management'
import { logger } from './utils/logger'
import { UnderPressure } from './services/up'

// Initialize config once at startup
const config = getConfig()

// Initialize UnderPressure with desired options
const underPressure = new UnderPressure({
    maxEventLoopDelay: 250, // ms
    maxHeapUsedBytes: 512 * 1024 * 1024, // 512MB
    maxRssBytes: 1024 * 1024 * 1024, // 1GB
    maxEventLoopUtilization: 0.98,
    sampleInterval: 1000
})

new Elysia()
    .use(corsMiddleware)
    .get('/up', () => {
        return {
            status: 'ok',
            ...underPressure.getStatus()
        }
    })

    .onRequest(({ set }) => {
        const pressure = underPressure.checkPressure()
        if (pressure) {
            set.status = 503
            return {
                error: 'Server under pressure',
                type: pressure.type,
                value: pressure.value,
                message: pressure.error?.message || 'Service Unavailable'
            }
        }
    })

    // Global error handler
    .onError(({ code, error, set, request }) => {
        const url = new URL(request.url)
        const path = url.pathname

        logger.error(`Error ${code} on ${path}`, {
            code,
            error: error instanceof Error ? error.message : String(error),
            path,
            method: request.method
        })

        if (code === 'VALIDATION') {
            set.status = 400
            return {
                error: 'Invalid request format',
                message: 'Please check the API documentation for correct usage',
                documentation: '/docs',
                hint: 'Try visiting /docs for examples of how to use the proxy endpoints'
            }
        }

        // Handle 404 errors
        if (code === 'NOT_FOUND') {
            set.status = 404
            return {
                error: 'Endpoint not found',
                message: `The endpoint '${path}' does not exist`,
                documentation: '/docs',
                availableEndpoints: [
                    '/docs - API Documentation',
                    '/health - Health Check',
                    '/status - Detailed Status',
                    '/proxy/:service/* - Proxy requests to services',
                    '/manage/services - Service management'
                ]
            }
        }

        // Handle other errors
        set.status = 500
        return {
            error: 'Internal server error',
            message: error instanceof Error ? error.message : String(error) || 'An unexpected error occurred',
            documentation: '/docs'
        }
    })

    .use(
        swagger({
            path: '/docs',
            documentation: {
                info: {
                    title: 'ByteProxy',
                    version: '0.1.0',
                    description: 'Extensible web proxy for Discord, GitHub, and other APIs. Provides rate limiting, authentication handling, and easy service management.'
                }
            }
        })
    )
    .use(healthRoutes)
    .use(proxyRoutes)    // Make sure proxy routes come before management routes
    .use(managementRoutes)
    .get('/', () => ({
        message: 'ByteProxy API',
        version: '0.1.0',
        documentation: '/docs',
        health: '/health',
        status: '/status'
    }))

    .all('*', ({ set, request }) => {
        const url = new URL(request.url)
        const path = url.pathname

        logger.warn(`Unknown endpoint accessed: ${path}`, {
            path,
            method: request.method,
            userAgent: request.headers.get('user-agent')
        })

        set.status = 404
        return {
            error: 'Endpoint not found',
            message: `The endpoint '${path}' does not exist`,
            suggestion: 'Check the API documentation for available endpoints',
            documentation: {
                url: '/docs',
                description: 'Interactive API documentation with examples'
            },
            quickStart: {
                proxy: '/proxy/:service/*',
                health: '/health',
                management: '/manage/services'
            }
        }
    })

    .listen(config.port)

logger.info(`ByteProxy server started on port ${config.port}`, {
    port: config.port,
    services: Object.keys(config.services),
    cors: config.cors.enabled,
    logging: config.logging.enabled
})

console.log(`🚀 ByteProxy server running at http://localhost:${config.port}`)
console.log(`📚 API Documentation: http://localhost:${config.port}/docs`)
console.log(`💚 Health Check: http://localhost:${config.port}/health`)