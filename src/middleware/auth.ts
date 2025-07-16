import { Elysia } from 'elysia'
import { getConfig } from '../config'
import { logger } from '../utils/logger'

export function createAuthMiddleware(keyType: 'proxy' | 'management') {
    const config = getConfig()

    const apiKey = keyType === 'proxy'
        ? config.security.proxyApiKey
        : config.security.managementApiKey

    const isRequired = keyType === 'proxy'
        ? config.security.requireAuthForProxy
        : config.security.requireAuthForManagement

    if (!isRequired) {
        logger.info(`${keyType} authentication is disabled by configuration`)
        return new Elysia()
    }

    if (!apiKey) {
        logger.warn(`${keyType} authentication is REQUIRED but no API key is configured!`, {
            keyType,
            envVar: keyType === 'proxy' ? 'PROXY_API_KEY' : 'MANAGEMENT_API_KEY'
        })
    }

    return new Elysia().onRequest(({ request, set }) => {
        const url = new URL(request.url)
        const path = url.pathname

        // Enhanced path check to ensure we're applying the right middleware
        const isProxyPath = path.startsWith('/proxy/')
        const isManagementPath = path.startsWith('/manage/')
        
        // Skip auth check if the path doesn't match the middleware type
        if ((keyType === 'proxy' && !isProxyPath) || (keyType === 'management' && !isManagementPath)) {
            logger.debug(`Skipping ${keyType} auth for non-${keyType} path: ${path}`)
            return
        }

        const authHeader = request.headers.get('authorization')?.trim()
        const apiKeyHeader = request.headers.get('x-api-key')?.trim()
        const queryKey = url.searchParams.get('api_key')?.trim()

        const providedToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

        const matches = (key: string | null | undefined) => key === apiKey

        if (!apiKey) {
            logger.warn(`Auth bypassed (no API key configured) for ${keyType}`, { path })
            return
        }

        logger.debug(`Auth attempt for ${keyType}`, {
            path,
            method: request.method,
            hasAuthHeader: !!authHeader,
            hasApiKeyHeader: !!apiKeyHeader,
            hasQueryKey: !!queryKey
        })

        const methodsTried = {
            bearer: providedToken && matches(providedToken),
            header: apiKeyHeader && matches(apiKeyHeader),
            query: queryKey && matches(queryKey)
        }

        if (methodsTried.bearer || methodsTried.header || methodsTried.query) {
            logger.debug(`Authenticated successfully for ${keyType}`, {
                method: methodsTried.bearer ? 'Bearer' : methodsTried.header ? 'x-api-key' : 'query'
            })
            return
        }

        const noAuthProvided = !authHeader && !apiKeyHeader && !queryKey

        logger.warn(`Unauthorized access attempt to ${keyType}`, {
            path,
            method: request.method,
            ip: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown',
            noAuthProvided,
            providedAuthHeader: authHeader ? '[invalid]' : 'none',
            providedApiKeyHeader: apiKeyHeader ? '[invalid]' : 'none',
            providedQueryKey: queryKey ? '[invalid]' : 'none'
        })

        set.status = 401
        return {
            error: 'Unauthorized',
            message: noAuthProvided
                ? `No authentication provided. API key required for ${keyType} routes.`
                : `Authentication failed. Invalid API key for ${keyType} routes.`,
            howToAuthenticate: [
                'Add header: "Authorization: Bearer YOUR_API_KEY"',
                'Add header: "x-api-key: YOUR_API_KEY"',
                'Add query param: "?api_key=YOUR_API_KEY"'
            ],
            keyHelp: {
                requiredKeyType: keyType,
                keySource: `Use ${keyType.toUpperCase()}_API_KEY from your .env file`,
                envVar: keyType === 'proxy' ? 'PROXY_API_KEY' : 'MANAGEMENT_API_KEY',
                envSetup: "Make sure you've set this in your .env.local file"
            },
            debug: {
                keyType,
                providedAuthMethod: providedToken ? 'bearer' : apiKeyHeader ? 'header' : queryKey ? 'query' : 'none',
                attemptedTokenLength: providedToken?.length || 0,
                attemptedHeaderLength: apiKeyHeader?.length || 0,
                attemptedQueryLength: queryKey?.length || 0,
                configuredKeyExists: !!apiKey,
                path,
                isProxyPath,
                isManagementPath
            }
        }
    })
}

export const proxyAuthMiddleware = createAuthMiddleware('proxy')
export const managementAuthMiddleware = createAuthMiddleware('management')
