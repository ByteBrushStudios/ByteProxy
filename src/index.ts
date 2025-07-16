import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { getConfig, getAppVersion, checkForUpdates } from './config'
import { corsMiddleware } from './middleware/cors'
import { baseRoutes } from './routes/base'
import { proxyRoutes } from './routes/proxy'
import { healthRoutes } from './routes/health'
import { managementRoutes } from './routes/management'
import { versionRoutes } from './routes/version'
import { logger } from './utils/logger'

// Check for updates before starting the server
console.log('Checking for ByteProxy updates...')
;(async (): Promise<void> => {
    try {
        // Only perform the check if not in development mode
        const env = process.env.NODE_ENV?.toLowerCase() || 'local'
        const skipUpdateCheck = env === 'dev' || env === 'development' || process.env.SKIP_UPDATE_CHECK === 'true'

        if (skipUpdateCheck) {
            console.log(
                '\x1b[33m%s\x1b[0m',
                '⚠️ Update check skipped in development mode or due to SKIP_UPDATE_CHECK=true'
            )
        } else {
            const updateInfo = await checkForUpdates()

            if (updateInfo.updateAvailable) {
                console.error('\x1b[31m%s\x1b[0m', '❌ UPDATE REQUIRED')
                console.error('\x1b[31m%s\x1b[0m', `Your ByteProxy version (${updateInfo.currentVersion}) is outdated.`)
                console.error('\x1b[31m%s\x1b[0m', `Latest version: ${updateInfo.latestVersion}`)
                console.error('\x1b[31m%s\x1b[0m', `Please update from: ${updateInfo.latestReleaseUrl}`)
                console.error('\x1b[31m%s\x1b[0m', 'Server startup aborted.')
                console.error(
                    '\x1b[31m%s\x1b[0m',
                    'To bypass this check, set SKIP_UPDATE_CHECK=true in your environment variables.'
                )
                process.exit(1)
            }

            console.log('\x1b[32m%s\x1b[0m', '✅ Running latest version of ByteProxy!')
        }

        // Initialize config once at startup
        const config = getConfig()
        const appVersion = getAppVersion()

        new Elysia()
            .use(corsMiddleware)
            .use(baseRoutes)
            .use(healthRoutes)
            .use(proxyRoutes)
            .use(managementRoutes)
            .use(versionRoutes)
            .use(
                swagger({
                    path: '/docs',
                    documentation: {
                        info: {
                            title: 'ByteProxy',
                            version: appVersion.replace('v', ''), // Use the version from config
                            description:
                                'Extensible web proxy for Discord, GitHub, and other APIs. Provides rate limiting, authentication handling, and easy service management.'
                        },
                        tags: [
                            {
                                name: 'Base',
                                description:
                                    'Core endpoints providing general information, version details, and API root access'
                            },
                            {
                                name: 'Health',
                                description:
                                    'Health check endpoints for monitoring service status and performance metrics'
                            },
                            {
                                name: 'Proxy',
                                description:
                                    'Endpoints for proxying requests to third-party services with authentication and rate limiting'
                            },
                            {
                                name: 'Debug',
                                description:
                                    'Development and troubleshooting endpoints to inspect request/response data and test connections'
                            },
                            {
                                name: 'Management',
                                description:
                                    'Service configuration endpoints for adding, removing, and managing available proxy targets'
                            },
                            {
                                name: 'Diagnostics',
                                description:
                                    'System diagnostics showing resource usage, performance data, and operational metrics'
                            }
                        ],
                        components: {
                            securitySchemes: {
                                apiKey: {
                                    type: 'apiKey',
                                    name: 'x-api-key',
                                    description: 'Your Proxy or Management API Key',
                                    in: 'header'
                                },
                                bearerAuth: {
                                    type: 'http',
                                    scheme: 'bearer',
                                    bearerFormat: 'API Key',
                                    description: 'Your Proxy or Management API Key'
                                },
                                queryParam: {
                                    type: 'apiKey',
                                    name: 'api_key',
                                    description: 'Your Proxy or Management API Key',
                                    in: 'query'
                                }
                            }
                        },
                        security: [{ bearerAuth: [] }]
                    }
                })
            )
            .listen(config.port)

        logger.info(`🚀 ByteProxy (${appVersion}) started on port: ${config.port}`)
        logger.debug(`📚 API Documentation: http://localhost:${config.port}/docs`)
        logger.debug(`💚 Health Check: http://localhost:${config.port}/health`)
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ Error checking for updates:')
        console.error(error)
        console.error('\x1b[31m%s\x1b[0m', 'Starting server anyway...')

        // Initialize config and start server despite update check failure
        const config = getConfig()
        const appVersion = getAppVersion()

        new Elysia()
            .use(corsMiddleware)
            .use(baseRoutes)
            .use(healthRoutes)
            .use(proxyRoutes)
            .use(managementRoutes)
            .use(versionRoutes)
            .use(
                swagger({
                    path: '/docs',
                    documentation: {
                        info: {
                            title: 'ByteProxy',
                            version: appVersion.replace('v', ''), // Use the version from config
                            description:
                                'Extensible web proxy for Discord, GitHub, and other APIs. Provides rate limiting, authentication handling, and easy service management.'
                        },
                        tags: [
                            {
                                name: 'Base',
                                description:
                                    'Core endpoints providing general information, version details, and API root access'
                            },
                            {
                                name: 'Health',
                                description:
                                    'Health check endpoints for monitoring service status and performance metrics'
                            },
                            {
                                name: 'Proxy',
                                description:
                                    'Endpoints for proxying requests to third-party services with authentication and rate limiting'
                            },
                            {
                                name: 'Debug',
                                description:
                                    'Development and troubleshooting endpoints to inspect request/response data and test connections'
                            },
                            {
                                name: 'Management',
                                description:
                                    'Service configuration endpoints for adding, removing, and managing available proxy targets'
                            },
                            {
                                name: 'Diagnostics',
                                description:
                                    'System diagnostics showing resource usage, performance data, and operational metrics'
                            }
                        ],
                        components: {
                            securitySchemes: {
                                apiKey: {
                                    type: 'apiKey',
                                    name: 'x-api-key',
                                    description: 'Your Proxy or Management API Key',
                                    in: 'header'
                                },
                                bearerAuth: {
                                    type: 'http',
                                    scheme: 'bearer',
                                    bearerFormat: 'API Key',
                                    description: 'Your Proxy or Management API Key'
                                },
                                queryParam: {
                                    type: 'apiKey',
                                    name: 'api_key',
                                    description: 'Your Proxy or Management API Key',
                                    in: 'query'
                                }
                            }
                        },
                        security: [{ bearerAuth: [] }]
                    }
                })
            )
            .listen(config.port)

        logger.info(`🚀 ByteProxy (${appVersion}) started on port: ${config.port}`)
        logger.debug(`📚 API Documentation: http://localhost:${config.port}/docs`)
        logger.debug(`💚 Health Check: http://localhost:${config.port}/health`)
    }
})()
