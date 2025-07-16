import { Elysia } from 'elysia'
import { getConfig } from '../config'
import { logger } from '../utils/logger'

/**
 * Authentication middleware factory for API keys
 */
export function createAuthMiddleware(keyType: 'proxy' | 'management') {
    // Always reload config to get latest env vars
    const config = getConfig()

    // Read API key and auth requirement directly from process.env for reliability
    const apiKey = keyType === 'proxy'
        ? process.env.PROXY_API_KEY
        : process.env.MANAGEMENT_API_KEY

    const isRequired = keyType === 'proxy'
        ? process.env.REQUIRE_AUTH_FOR_PROXY === 'true'
        : process.env.REQUIRE_AUTH_FOR_MANAGEMENT === 'true'

    // If auth is not required, return a pass-through middleware
    if (!isRequired) {
        logger.info(`${keyType} authentication is disabled by configuration`)
        return new Elysia()
    }

    // Log warning if auth is required but no API key is set
    if (!apiKey) {
        logger.warn(`${keyType} authentication is REQUIRED but no API key is configured!`, {
            keyType,
            envVar: keyType === 'proxy' ? 'PROXY_API_KEY' : 'MANAGEMENT_API_KEY'
        })
    }

    // Return middleware that validates the API key
    return new Elysia()
        .onRequest(({ request, set }) => {
            // If no API key is configured but auth is required, fail open
            if (!apiKey) {
                logger.warn(`Auth bypassed: ${keyType} API key not configured`, {
                    path: new URL(request.url).pathname
                })
                return
            }

            try {
                // Extract auth info
                const authHeader = request.headers.get('authorization')
                const apiKeyHeader = request.headers.get('x-api-key')
                const url = new URL(request.url)
                const queryKey = url.searchParams.get('api_key')

                // Check Bearer token
                if (authHeader?.startsWith('Bearer ')) {
                    const token = authHeader.substring(7).trim()
                    if (token === apiKey) return undefined
                }

                // Check x-api-key header
                if (apiKeyHeader === apiKey) return undefined

                // Check query parameter
                if (queryKey === apiKey) return undefined

                // If we get here, authentication failed
                logger.warn(`Unauthorized access attempt to ${keyType}`, {
                    path: url.pathname,
                    method: request.method,
                    ip: request.headers.get('x-forwarded-for') || 'unknown'
                })

                set.status = 401
                return {
                    error: 'Unauthorized',
                    message: `Valid API key required for ${keyType} routes`,
                    howToAuthenticate: [
                        'Add header: "Authorization: Bearer YOUR_API_KEY"',
                        'Add header: "x-api-key: YOUR_API_KEY"',
                        'Add query param: "?api_key=YOUR_API_KEY"'
                    ]
                }
            } catch (error) {
                logger.error(`Auth error in ${keyType} middleware`, {
                    error: error instanceof Error ? error.message : String(error)
                })
                return
            }
        })
}

// Export ready-to-use middleware instances
export const proxyAuthMiddleware = createAuthMiddleware('proxy')
export const managementAuthMiddleware = createAuthMiddleware('management')
