import { Elysia } from 'elysia'
import { getConfig, listServices, getServiceConfig, getAppVersion } from '../config'

export const healthRoutes = new Elysia()
    .get(
        '/health',
        () => {
            const config = getConfig()
            const services = listServices()

            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: getAppVersion(),
                services: {
                    total: services.length,
                    available: services
                },
                config: {
                    port: config.port,
                    logging: config.logging,
                    cors: config.cors
                }
            }
        },
        {
            detail: {
                summary: 'Health check endpoint',
                description: 'Basic health check for monitoring and status verification',
                tags: ['Health'],
                responses: {
                    200: {
                        description: 'System is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'string',
                                            example: 'healthy'
                                        },
                                        timestamp: {
                                            type: 'string',
                                            format: 'date-time',
                                            example: '2023-08-15T12:34:56.789Z'
                                        },
                                        uptime: {
                                            type: 'number',
                                            description: 'Server uptime in seconds',
                                            example: 1234.56
                                        },
                                        version: {
                                            type: 'string',
                                            example: 'v0.1.0-dev'
                                        },
                                        services: {
                                            type: 'object',
                                            properties: {
                                                total: { type: 'number' },
                                                available: {
                                                    type: 'array',
                                                    items: { type: 'string' }
                                                }
                                            }
                                        },
                                        config: { type: 'object' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )

    .get(
        '/status',
        () => {
            const config = getConfig()
            const services = listServices()

            const serviceDetails = services.map(key => {
                const serviceConfig = getServiceConfig(key)
                return {
                    key,
                    name: serviceConfig?.name,
                    baseUrl: serviceConfig?.baseUrl,
                    configured: !!serviceConfig,
                    hasAuth: !!serviceConfig?.auth,
                    authTokenConfigured: serviceConfig?.auth?.tokenEnvVar
                        ? !!process.env[serviceConfig.auth.tokenEnvVar]
                        : false,
                    rateLimit: serviceConfig?.rateLimit
                }
            })

            return {
                application: {
                    name: 'ByteProxy',
                    version: '0.1.0',
                    description: 'Extensible web proxy for Discord, GitHub, and other APIs'
                },
                runtime: {
                    node: process.version,
                    platform: process.platform,
                    uptime: process.uptime(),
                    memory: process.memoryUsage()
                },
                configuration: {
                    port: config.port,
                    services: serviceDetails,
                    logging: config.logging,
                    cors: config.cors
                }
            }
        },
        {
            detail: {
                summary: 'Detailed status information',
                description: 'Comprehensive system status with runtime, configuration and service details',
                tags: ['Health', 'Diagnostics'],
                responses: {
                    200: {
                        description: 'Detailed system status',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        application: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                version: { type: 'string' },
                                                description: { type: 'string' }
                                            }
                                        },
                                        runtime: {
                                            type: 'object',
                                            properties: {
                                                node: { type: 'string' },
                                                platform: { type: 'string' },
                                                uptime: { type: 'number' },
                                                memory: { type: 'object' }
                                            }
                                        },
                                        configuration: {
                                            type: 'object',
                                            properties: {
                                                port: { type: 'number' },
                                                services: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            key: { type: 'string' },
                                                            name: { type: 'string' },
                                                            baseUrl: { type: 'string' },
                                                            configured: { type: 'boolean' },
                                                            hasAuth: { type: 'boolean' },
                                                            authTokenConfigured: { type: 'boolean' },
                                                            rateLimit: { type: 'object', nullable: true }
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
                }
            }
        }
    )

    .get(
        '/auth-status',
        ({ request }) => {
            const config = getConfig()
            const url = new URL(request.url)
            const path = url.pathname

            return {
                path,
                authConfig: {
                    proxyAuthRequired: config.security.requireAuthForProxy,
                    managementAuthRequired: config.security.requireAuthForManagement,
                    proxyKeyConfigured: !!config.security.proxyApiKey,
                    managementKeyConfigured: !!config.security.managementApiKey
                },
                requestInfo: {
                    method: request.method,
                    hasAuthHeader: !!request.headers.get('authorization'),
                    hasApiKeyHeader: !!request.headers.get('x-api-key'),
                    hasQueryKey: !!url.searchParams.get('api_key'),
                    fullUrl: request.url,
                    pathSegments: path.split('/').filter(Boolean)
                },
                help: 'This endpoint helps diagnose authentication issues'
            }
        },
        {
            detail: {
                summary: 'Authentication status check',
                description: 'Provides information about the authentication configuration and request details',
                tags: ['Health', 'Debug'],
                responses: {
                    200: {
                        description: 'Authentication status information',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        path: { type: 'string' },
                                        authConfig: {
                                            type: 'object',
                                            properties: {
                                                proxyAuthRequired: { type: 'boolean' },
                                                managementAuthRequired: { type: 'boolean' },
                                                proxyKeyConfigured: { type: 'boolean' },
                                                managementKeyConfigured: { type: 'boolean' }
                                            }
                                        },
                                        requestInfo: {
                                            type: 'object',
                                            properties: {
                                                method: { type: 'string' },
                                                hasAuthHeader: { type: 'boolean' },
                                                hasApiKeyHeader: { type: 'boolean' },
                                                hasQueryKey: { type: 'boolean' },
                                                fullUrl: { type: 'string' },
                                                pathSegments: {
                                                    type: 'array',
                                                    items: { type: 'string' }
                                                }
                                            }
                                        },
                                        help: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )
