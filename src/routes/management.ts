import { Elysia, t } from 'elysia'
import { addService, getServiceConfig, listServices, ServiceConfig, getConfig } from '../config'
import { logger } from '../utils/logger'
import { managementAuthMiddleware } from '../middleware/auth'

export const managementRoutes = new Elysia({ prefix: '/manage' })
    .use(managementAuthMiddleware)
    // Add a new service configuration
    .post(
        '/services',
        async ({ body }) => {
            try {
                const { key, config } = body as { key: string; config: ServiceConfig }

                if (!key || !config) {
                    return new Response(JSON.stringify({ error: 'Missing key or config' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                if (getServiceConfig(key)) {
                    return new Response(JSON.stringify({ error: `Service '${key}' already exists` }), {
                        status: 409,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                addService(key, config)
                logger.info(`New service added: ${key}`, { service: key, baseUrl: config.baseUrl })

                return {
                    message: `Service '${key}' added successfully`,
                    key,
                    config
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                logger.error('Failed to add service', { error: errorMessage })

                return new Response(JSON.stringify({ error: errorMessage }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                })
            }
        },
        {
            body: t.Object({
                key: t.String(),
                config: t.Object({
                    name: t.String(),
                    baseUrl: t.String(),
                    headers: t.Optional(t.Record(t.String(), t.String())),
                    rateLimit: t.Optional(
                        t.Object({
                            maxRequests: t.Number(),
                            windowMs: t.Number()
                        })
                    ),
                    auth: t.Optional(
                        t.Object({
                            type: t.Union([
                                t.Literal('bearer'),
                                t.Literal('basic'),
                                t.Literal('api-key'),
                                t.Literal('bot')
                            ]),
                            tokenEnvVar: t.Optional(t.String()),
                            headerName: t.Optional(t.String())
                        })
                    )
                })
            }),
            detail: {
                summary: 'Add a new service configuration',
                description: 'Dynamically add a new service to the proxy without restarting',
                tags: ['Management'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Service added successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        key: { type: 'string' },
                                        config: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                baseUrl: { type: 'string' },
                                                headers: {
                                                    type: 'object',
                                                    additionalProperties: { type: 'string' }
                                                },
                                                rateLimit: {
                                                    type: 'object',
                                                    properties: {
                                                        maxRequests: { type: 'number' },
                                                        windowMs: { type: 'number' }
                                                    }
                                                },
                                                auth: {
                                                    type: 'object',
                                                    properties: {
                                                        type: {
                                                            type: 'string',
                                                            enum: ['bearer', 'basic', 'api-key', 'bot']
                                                        },
                                                        tokenEnvVar: { type: 'string' },
                                                        headerName: { type: 'string' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Bad request or invalid configuration',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    409: {
                        description: 'Service already exists',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    500: {
                        description: 'Server error',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )

    // Get service configuration
    .get(
        '/services/:key',
        ({ params: { key } }) => {
            const config = getServiceConfig(key)

            if (!config) {
                return new Response(JSON.stringify({ error: `Service '${key}' not found` }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                })
            }

            // Don't expose sensitive token information
            const safeConfig = {
                ...config,
                auth: config.auth
                    ? {
                          ...config.auth,
                          tokenConfigured: config.auth.tokenEnvVar ? !!process.env[config.auth.tokenEnvVar] : false
                      }
                    : undefined
            }

            return {
                key,
                config: safeConfig
            }
        },
        {
            params: t.Object({
                key: t.String()
            }),
            detail: {
                summary: 'Get service configuration',
                description: 'Retrieves detailed configuration for a specific service',
                tags: ['Management'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Service configuration',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        key: { type: 'string' },
                                        config: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                baseUrl: { type: 'string' },
                                                headers: {
                                                    type: 'object',
                                                    additionalProperties: { type: 'string' }
                                                },
                                                auth: {
                                                    type: 'object',
                                                    properties: {
                                                        type: { type: 'string' },
                                                        tokenConfigured: { type: 'boolean' }
                                                    }
                                                },
                                                rateLimit: {
                                                    type: 'object',
                                                    nullable: true,
                                                    properties: {
                                                        maxRequests: { type: 'number' },
                                                        windowMs: { type: 'number' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    404: {
                        description: 'Service not found',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )

    // Test service connectivity
    .post(
        '/services/:key/test',
        async ({ params: { key } }) => {
            const config = getServiceConfig(key)

            if (!config) {
                return new Response(JSON.stringify({ error: `Service '${key}' not found` }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                })
            }

            try {
                const startTime = Date.now()
                const response = await fetch(config.baseUrl, {
                    method: 'HEAD',
                    headers: config.headers || {}
                })
                const duration = Date.now() - startTime

                return {
                    service: key,
                    status: 'reachable',
                    responseStatus: response.status,
                    duration: `${duration}ms`,
                    baseUrl: config.baseUrl
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'

                return {
                    service: key,
                    status: 'unreachable',
                    error: errorMessage,
                    baseUrl: config.baseUrl,
                    troubleshooting: {
                        suggestions: [
                            'Check your internet connection',
                            'Verify the service URL is correct',
                            'Check if the service is experiencing downtime',
                            'If you see TLS/SSL errors, the service may have certificate issues'
                        ],
                        tlsHelp:
                            errorMessage.includes('TLS') ||
                            errorMessage.includes('certificate') ||
                            errorMessage.includes('SSL')
                                ? {
                                      issue: 'TLS/SSL Certificate Error Detected',
                                      possibleCauses: [
                                          'Expired or invalid certificates on the target server',
                                          'System clock is incorrect (check date/time)',
                                          'Corporate firewall blocking connections',
                                          'Certificate authority not trusted by your system'
                                      ],
                                      solutions: [
                                          'Verify your system date and time are correct',
                                          'Try accessing the URL directly in a web browser',
                                          'For development only: set network.strictTLS to false in config',
                                          'Contact your network administrator if behind a corporate firewall'
                                      ]
                                  }
                                : null
                    }
                }
            }
        },
        {
            params: t.Object({
                key: t.String()
            }),
            detail: {
                summary: 'Test service connectivity',
                security: [{ bearerAuth: [] }],
                description: 'Test if a configured service is reachable',
                tags: ['Management']
            }
        }
    )

    // List all services with their status
    .get(
        '/services',
        () => {
            const services = listServices().map(key => {
                const config = getServiceConfig(key)
                return {
                    key,
                    name: config?.name,
                    baseUrl: config?.baseUrl,
                    hasAuth: !!config?.auth,
                    authConfigured: config?.auth?.tokenEnvVar ? !!process.env[config.auth.tokenEnvVar] : false,
                    rateLimit: config?.rateLimit
                }
            })

            return {
                services,
                count: services.length
            }
        },
        {
            detail: {
                summary: 'List all configured services',
                security: [{ bearerAuth: [] }],
                description: 'Returns a comprehensive list of all registered services and their configurations',
                tags: ['Management'],
                responses: {
                    200: {
                        description: 'List of services',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        services: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    key: { type: 'string' },
                                                    name: { type: 'string' },
                                                    baseUrl: { type: 'string' },
                                                    hasAuth: { type: 'boolean' },
                                                    authConfigured: { type: 'boolean' },
                                                    rateLimit: {
                                                        type: 'object',
                                                        nullable: true,
                                                        properties: {
                                                            maxRequests: { type: 'number' },
                                                            windowMs: { type: 'number' }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        count: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )

    // Network diagnostics endpoint
    .get(
        '/diagnostics',
        () => {
            const config = getConfig()

            // Check environment variables for auth tokens
            const authStatus = Object.entries(config.services).reduce(
                (acc, [key, service]) => {
                    const svc = service as ServiceConfig
                    if (svc.auth?.tokenEnvVar) {
                        const token = process.env[svc.auth.tokenEnvVar]
                        acc[key] = {
                            tokenConfigured: !!token,
                            envVar: svc.auth.tokenEnvVar,
                            authType: svc.auth.type,
                            tokenPreview: token ? `${token.substring(0, 8)}...` : 'NOT_SET'
                        }
                    }
                    return acc
                },
                {} as Record<string, Record<string, string | boolean>>
            )

            return {
                system: {
                    platform: process.platform,
                    nodeVersion: process.version,
                    runtime: typeof Bun !== 'undefined' ? 'Bun' : 'Node.js',
                    uptime: process.uptime()
                },
                network: {
                    strictTLS: config.network.strictTLS,
                    timeout: config.network.timeout,
                    retryAttempts: config.network.retryAttempts
                },
                environment: {
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    currentTime: new Date().toISOString(),
                    locale: Intl.DateTimeFormat().resolvedOptions().locale
                },
                authentication: authStatus,
                troubleshooting: {
                    authIssues: {
                        commonCauses: [
                            'Environment variables not set correctly',
                            'Server not restarted after setting env vars',
                            'Invalid or expired tokens',
                            'Wrong token format or permissions'
                        ],
                        quickFixes: [
                            'Check .env.local file exists and has correct tokens',
                            'Restart the server: bun run dev',
                            'Verify token permissions in Discord/GitHub settings',
                            'Check token format matches expected pattern'
                        ]
                    },
                    tlsIssues: {
                        commonCauses: [
                            'System clock/date incorrect',
                            'Corporate firewall or proxy',
                            'Certificate authority issues',
                            'Target server certificate problems'
                        ],
                        quickFixes: [
                            'Check system date and time',
                            'Try from different network',
                            'Disable strict TLS temporarily (development only)',
                            'Contact network administrator'
                        ]
                    }
                }
            }
        },
        {
            detail: {
                summary: 'Get network and system diagnostics',
                description: 'Provides system information and troubleshooting tips for network issues',
                tags: ['Management', 'Diagnostics'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'System diagnostics information',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        system: {
                                            type: 'object',
                                            properties: {
                                                platform: { type: 'string' },
                                                nodeVersion: { type: 'string' },
                                                runtime: { type: 'string' },
                                                uptime: { type: 'number' }
                                            }
                                        },
                                        network: {
                                            type: 'object',
                                            properties: {
                                                strictTLS: { type: 'boolean' },
                                                timeout: { type: 'number' },
                                                retryAttempts: { type: 'number' }
                                            }
                                        },
                                        environment: {
                                            type: 'object',
                                            properties: {
                                                timeZone: { type: 'string' },
                                                currentTime: { type: 'string' },
                                                locale: { type: 'string' }
                                            }
                                        },
                                        authentication: {
                                            type: 'object',
                                            additionalProperties: {
                                                type: 'object',
                                                properties: {
                                                    tokenConfigured: { type: 'boolean' },
                                                    envVar: { type: 'string' },
                                                    authType: { type: 'string' },
                                                    tokenPreview: { type: 'string' }
                                                }
                                            }
                                        },
                                        troubleshooting: { type: 'object' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )

    // Add key debug endpoint to help identify the correct key to use
    .get(
        '/key-debug',
        () => {
            const config = getConfig()

            return {
                message: 'API Key Debug Information',
                note: 'This endpoint helps identify which key you should use',
                keyInfo: {
                    managementKeyFormat: config.security.managementApiKey
                        ? `${config.security.managementApiKey.substring(0, 12)}...`
                        : 'Not configured',
                    proxyKeyFormat: config.security.proxyApiKey
                        ? `${config.security.proxyApiKey.substring(0, 12)}...`
                        : 'Not configured',
                    managementKeyLength: config.security.managementApiKey?.length || 0,
                    proxyKeyLength: config.security.proxyApiKey?.length || 0,
                    keyTypes: {
                        management: 'Required for /manage/* routes',
                        proxy: 'Required for /proxy/* routes'
                    }
                },
                help: 'For management routes, you must use the MANAGEMENT_API_KEY from your .env file'
            }
        },
        {
            detail: {
                summary: 'Debug API key information',
                description: 'Helper endpoint to determine which API key to use',
                tags: ['Management', 'Debug'],
                security: [{ bearerAuth: [] }]
            }
        }
    )
