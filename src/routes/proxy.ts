import { Elysia, t } from 'elysia'
import { proxyService } from '../services/proxy'
import { getConfig, getServiceConfig, listServices } from '../config'
import { logger } from '../utils/logger'
import { proxyAuthMiddleware } from '../middleware/auth'

export const proxyRoutes = new Elysia({ prefix: '/proxy' })
    .use(proxyAuthMiddleware)
    .get('/services', () => {
        const services = listServices().map(key => {
            const config = getServiceConfig(key)
            return {
                key,
                name: config?.name,
                baseUrl: config?.baseUrl,
                hasAuth: !!config?.auth,
                rateLimit: config?.rateLimit
            }
        })

        return {
            services,
            count: services.length
        }
    }, {
        detail: {
            summary: 'List available proxy services',
            tags: ['Proxy']
        }
    })

    // Get rate limit status for a service
    .get('/services/:service/rate-limit', ({ params: { service } }) => {
        const status = proxyService.getRateLimitStatus(service)

        if (!status) {
            return {
                error: 'Service not found or rate limiting not configured',
                service
            }
        }

        return {
            service,
            remaining: status.remaining,
            resetTime: status.resetTime,
            resetIn: Math.max(0, Math.ceil((status.resetTime - Date.now()) / 1000))
        }
    }, {
        params: t.Object({
            service: t.String()
        }),
        detail: {
            summary: 'Get rate limit status for a service',
            tags: ['Proxy']
        }
    })

    // Main proxy endpoint - handles all HTTP methods
    .all('/:service/*', async ({ params, request, query }) => {
        let { service, '*': wildcardPath } = params
        let path = wildcardPath ? `/${wildcardPath}` : request.url.split(`/proxy/${service}`)[1] || ''

        // Discord version routing logic (single config)
        let version: string | undefined
        if (service === 'discord') {
            const versionMatch = path.match(/^\/(v\d+)(\/|$)/)
            if (versionMatch) {
                version = versionMatch[1] // e.g., 'v10'
                path = path.replace(/^\/v\d+/, '') || '/'
            }
        }

        // Add this block to help users with common GitHub endpoint mistakes
        if (
            service === 'github' &&
            /^\/org\//.test(path)
        ) {
            return new Response(
                JSON.stringify({
                    error: "Invalid GitHub API path. Did you mean '/orgs/:org' or '/orgs/:org/repos'? The GitHub API does not support '/org/'.",
                    hint: "Use '/proxy/github/orgs/ORG_NAME' or '/proxy/github/orgs/ORG_NAME/repos' instead."
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        try {
            // Validate service exists
            const serviceConfig = getServiceConfig(service)
            if (!serviceConfig) {
                logger.warn(`Service '${service}' not found`, { service, availableServices: listServices() })
                return new Response(
                    JSON.stringify({
                        error: `Service '${service}' not configured`,
                        availableServices: listServices()
                    }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                )
            }

            // Check if auth token is available
            if (serviceConfig.auth && serviceConfig.auth.tokenEnvVar) {
                const token = process.env[serviceConfig.auth.tokenEnvVar]
                if (!token) {
                    logger.error(`Missing authentication token for ${service}`, {
                        service,
                        requiredEnvVar: serviceConfig.auth.tokenEnvVar,
                        authType: serviceConfig.auth.type
                    })
                    return new Response(
                        JSON.stringify({
                            error: `Authentication token missing for ${service}`,
                            hint: `Set the environment variable: ${serviceConfig.auth.tokenEnvVar}`,
                            authType: serviceConfig.auth.type
                        }),
                        { status: 401, headers: { 'Content-Type': 'application/json' } }
                    )
                }
            }

            // Select base URL (handle Discord versioning)
            let baseUrl = serviceConfig.baseUrl
            if (service === 'discord' && version && serviceConfig.versionedBaseUrls?.[version]) {
                baseUrl = serviceConfig.versionedBaseUrls[version]
            }

            const proxyRequest = {
                service,
                path,
                method: request.method,
                headers: Object.fromEntries(request.headers.entries()),
                body: request.method !== 'GET' && request.method !== 'HEAD'
                    ? await request.json().catch(() => undefined)
                    : undefined,
                query: query as Record<string, string>,
                // Pass baseUrl override for this request
                baseUrl
            }

            const response = await proxyService.proxyRequest(proxyRequest)

            logger.logRequest(service, request.method, path, response.status, response.duration)

            return new Response(
                typeof response.body === 'object' ? JSON.stringify(response.body) : response.body,
                {
                    status: response.status,
                    headers: {
                        ...response.headers,
                        'X-Proxy-Service': service,
                        'X-Proxy-Duration': `${response.duration}ms`
                    }
                }
            )
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            logger.error(`Proxy request failed for ${service}${path}`, {
                service,
                path,
                method: request.method,
                error: errorMessage
            })

            // Determine appropriate status code
            let statusCode = 500
            if (errorMessage.includes('Rate limit')) statusCode = 429
            else if (errorMessage.includes('not configured')) statusCode = 404
            else if (errorMessage.includes('Authentication') || errorMessage.includes('token')) statusCode = 401

            return new Response(
                JSON.stringify({
                    error: errorMessage,
                    service,
                    path,
                    troubleshooting: {
                        hint: 'Check /manage/diagnostics for network troubleshooting tips',
                        documentation: '/docs',
                        authHelp: statusCode === 401 ? {
                            message: 'Authentication failed. Check your environment variables.',
                            steps: [
                                'Verify your .env.local file contains the required tokens',
                                'Restart the server after updating environment variables',
                                'Check token permissions and validity'
                            ]
                        } : undefined
                    }
                }),
                {
                    status: statusCode,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Proxy-Service': service,
                        'X-Proxy-Error': 'true'
                    }
                }
            )
        }
    }, {
        params: t.Object({
            service: t.String(),
            '*': t.Optional(t.String())
        }),
        detail: {
            summary: 'Proxy request to a service',
            description: 'Forward requests to configured services like Discord or GitHub APIs',
            tags: ['Proxy']
        }
    })

    // Add a debug authentication endpoint
    .get('/auth-debug', ({ request }) => {
        const authHeader = request.headers.get('authorization')
        const apiKeyHeader = request.headers.get('x-api-key')
        const url = new URL(request.url)
        const queryKey = url.searchParams.get('api_key')

        return {
            status: 'success',
            message: 'Authentication successful',
            timestamp: new Date().toISOString(),
            authMethod: {
                bearer: authHeader?.startsWith('Bearer ') ? 'provided' : 'not provided',
                xApiKey: apiKeyHeader ? 'provided' : 'not provided',
                queryParam: queryKey ? 'provided' : 'not provided',
            },
            help: 'If you see this message, your authentication is working correctly.'
        }
    }, {
        detail: {
            summary: 'Debug API authentication',
            description: 'Use this endpoint to verify your authentication is working',
            tags: ['Proxy', 'Debug']
        }
    })

    // Add a basic authentication test route
    .get('/auth-test', () => {
        return {
            status: 'success',
            message: 'Authentication successful',
            timestamp: new Date().toISOString()
        }
    })

    // Add key debug endpoint to help identify the correct key to use
    .get('/key-debug', () => {
        const config = getConfig();
        const proxyKeyConfigured = !!config.security.proxyApiKey;
        const managementKeyConfigured = !!config.security.managementApiKey;

        return {
            message: 'API Key Debug Information',
            note: 'This endpoint helps identify which key you should use',
            authStatus: {
                proxyAuthRequired: config.security.requireAuthForProxy,
                managementAuthRequired: config.security.requireAuthForManagement,
                proxyKeyConfigured,
                managementKeyConfigured,
                setupStatus: {
                    proxy: config.security.requireAuthForProxy && !proxyKeyConfigured
                        ? 'ERROR: Auth required but no key set'
                        : 'Valid configuration',
                    management: config.security.requireAuthForManagement && !managementKeyConfigured
                        ? 'ERROR: Auth required but no key set'
                        : 'Valid configuration'
                }
            },
            keyInfo: {
                proxyKeyFormat: config.security.proxyApiKey
                    ? `${config.security.proxyApiKey.substring(0, 4)}...${config.security.proxyApiKey.substring(config.security.proxyApiKey.length - 4)}`
                    : 'Not configured',
                managementKeyFormat: config.security.managementApiKey
                    ? `${config.security.managementApiKey.substring(0, 4)}...${config.security.managementApiKey.substring(config.security.managementApiKey.length - 4)}`
                    : 'Not configured',
                proxyKeyLength: config.security.proxyApiKey?.length || 0,
                managementKeyLength: config.security.managementApiKey?.length || 0,
                keyTypes: {
                    proxy: 'Required for /proxy/* routes',
                    management: 'Required for /manage/* routes'
                }
            },
            howToAuthenticate: [
                'Add header: "Authorization: Bearer YOUR_API_KEY"',
                'Add header: "x-api-key: YOUR_API_KEY"',
                'Add query param: "?api_key=YOUR_API_KEY"'
            ],
            troubleshooting: {
                noKeyProvided: 'If you received "No authentication provided", you need to add your API key using one of the methods above',
                invalidKey: 'If you received "Valid API key required", your provided key doesn\'t match the one in your environment',
                envSetup: 'Make sure your .env.local file has the required API keys set',
                envExample: `
# Authentication keys
PROXY_API_KEY=your_proxy_key_here
MANAGEMENT_API_KEY=your_management_key_here

# Authentication requirements (set to "true" to enable)
REQUIRE_AUTH_FOR_PROXY=true
REQUIRE_AUTH_FOR_MANAGEMENT=true
                `
            }
        }
    }, {
        detail: {
            summary: 'Debug API key information',
            description: 'Helper endpoint to determine which API key to use',
            tags: ['Proxy', 'Debug']
        }
    })
