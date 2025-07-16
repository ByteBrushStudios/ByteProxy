import { Elysia } from 'elysia'
import { getAppVersion } from '../config'
import { UnderPressure } from '../services/up'
import { logger } from '../utils/logger'

const underPressure = new UnderPressure({
    maxEventLoopDelay: 250, // ms
    maxHeapUsedBytes: 512 * 1024 * 1024, // 512MB
    maxRssBytes: 1024 * 1024 * 1024, // 1GB
    maxEventLoopUtilization: 0.98,
    sampleInterval: 1000
})

export const baseRoutes = new Elysia()
    .get(
        '/',
        () => {
            const appVersion = getAppVersion()

            return {
                message: 'Welcome to ByteProxy, feel free to browse around!',
                source: 'https://github.com/ByteBrushStudios/ByteProxy',
                documentation: '/docs',
                status: '/status',
                health: '/health',
                version: appVersion,
                checkUpdates: '/version/check'
            }
        },
        {
            detail: {
                summary: 'API Root',
                description: 'Returns basic information about the ByteProxy API',
                tags: ['Base'],
                responses: {
                    200: {
                        description: 'Basic API information',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        source: { type: 'string' },
                                        documentation: { type: 'string' },
                                        status: { type: 'string' },
                                        health: { type: 'string' },
                                        version: { type: 'string' },
                                        checkUpdates: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )

    // Under Pressure endpoint (for debugging mainly)
    .get(
        '/up',
        () => {
            return {
                status: 'ok',
                ...underPressure.getStatus()
            }
        },
        {
            detail: {
                summary: 'Under Pressure',
                description: 'View information about the state of the Proxy Server (if it is under pressure)',
                responses: {
                    200: {
                        description: 'Successful Response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'string',
                                            default: 'ok',
                                            example: 'unhealthy'
                                        },
                                        eventLoopDelay: {
                                            type: 'number',
                                            default: 3,
                                            example: 3
                                        },
                                        heapUsed: {
                                            type: 'integer',
                                            default: 'unknown',
                                            example: 5776205
                                        },
                                        rssBytes: {
                                            type: 'integer',
                                            default: 'unknown',
                                            example: 209743872
                                        },
                                        eventLoopUtilized: {
                                            type: 'number',
                                            default: 'unknown',
                                            example: 0
                                        },
                                        healthy: {
                                            type: 'boolean',
                                            default: true,
                                            example: false
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                tags: ['Base']
            }
        }
    )

    // Handle 404s and unknown endpoints
    .all(
        '*',
        ({ set, request }) => {
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
        },
        {
            detail: {
                summary: 'Not Found Handler',
                description: 'Generic handler for any requests to non-existent endpoints',
                tags: ['Base'],
                responses: {
                    404: {
                        description: 'Endpoint not found',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' },
                                        message: { type: 'string' },
                                        suggestion: { type: 'string' },
                                        documentation: {
                                            type: 'object',
                                            properties: {
                                                url: { type: 'string' },
                                                description: { type: 'string' }
                                            }
                                        },
                                        quickStart: {
                                            type: 'object',
                                            properties: {
                                                proxy: { type: 'string' },
                                                health: { type: 'string' },
                                                management: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )

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
