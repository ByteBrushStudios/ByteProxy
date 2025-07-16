import { getServiceConfig, ServiceConfig, getConfig } from '../config'
import http, { IncomingMessage, ServerResponse } from 'http'
import { WebSocket as NodeWebSocket } from 'ws'
import https from 'https'

let WebSocketImpl: any
try {
    WebSocketImpl = require('ws').WebSocket
} catch {
    WebSocketImpl = undefined
}

export interface ProxyRequest {
    service: string
    path: string
    method: string
    headers?: Record<string, string>
    body?: any
    query?: Record<string, string>
    baseUrl?: string // Optional override for per-request baseUrl (for Discord versioning)
}

export interface ProxyResponse {
    status: number
    headers: Record<string, string>
    body: any
    service: string
    path: string
    duration: number
}

export interface ProxyRewriteOptions {
    rewritePrefix?: string
    rewritePath?: (path: string, req: IncomingMessage) => string
    rewriteHeaders?: (headers: Record<string, string>, req: IncomingMessage) => Record<string, string>
    ws?: boolean
}

export class ProxyService {
    private rateLimits: Map<string, { count: number; resetTime: number }> = new Map()

    async proxyRequest(request: ProxyRequest): Promise<ProxyResponse> {
        const startTime = Date.now()
        const serviceConfig = getServiceConfig(request.service)

        if (!serviceConfig) {
            throw new Error(`Service '${request.service}' not configured`)
        }

        // Check rate limits
        await this.checkRateLimit(request.service, serviceConfig)

        // Build the target URL
        const targetUrl = this.buildTargetUrl(serviceConfig, request.path, request.query, request.baseUrl)

        // Prepare headers
        const headers = this.prepareHeaders(serviceConfig, request.headers)

        // Make the request
        const hasBody = request.body !== undefined && request.method !== 'GET' && request.method !== 'HEAD'
        const response = await this.makeRequest(targetUrl, {
            method: request.method,
            headers,
            body: hasBody ? JSON.stringify(request.body) : undefined
        })

        const duration = Date.now() - startTime

        return {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: await this.parseResponseBody(response),
            service: request.service,
            path: request.path,
            duration
        }
    }

    private async checkRateLimit(service: string, config: ServiceConfig): Promise<void> {
        if (!config.rateLimit) return

        const now = Date.now()
        const key = service
        const limit = this.rateLimits.get(key)

        if (!limit || now > limit.resetTime) {
            // Reset the rate limit window
            this.rateLimits.set(key, {
                count: 1,
                resetTime: now + config.rateLimit.windowMs
            })
            return
        }

        if (limit.count >= config.rateLimit.maxRequests) {
            const resetIn = Math.ceil((limit.resetTime - now) / 1000)
            throw new Error(`Rate limit exceeded for ${service}. Reset in ${resetIn} seconds.`)
        }

        limit.count++
    }

    private buildTargetUrl(config: ServiceConfig, path: string, query?: Record<string, string>, baseUrlOverride?: string): string {
        // Remove leading slash from path if present
        const cleanPath = path.startsWith('/') ? path.slice(1) : path

        // Use override if provided
        let baseUrl = baseUrlOverride || config.baseUrl
        // Avoid double slashes
        baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
        let url = cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl

        if (query && Object.keys(query).length > 0) {
            const searchParams = new URLSearchParams(query)
            url += `?${searchParams.toString()}`
        }

        return url
    }

    private prepareHeaders(config: ServiceConfig, requestHeaders?: Record<string, string>): Record<string, string> {
        // Remove hop-by-hop/request-specific headers that should not be forwarded
        const hopByHopHeaders = [
            'host', 'connection', 'content-length', 'transfer-encoding', 'upgrade', 'proxy-authorization',
            'proxy-authenticate', 'te', 'trailer', 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host',
            'authorization' // Always remove incoming Authorization
        ];

        // Merge config and request headers, but filter out hop-by-hop headers
        const headers: Record<string, string> = {
            ...config.headers,
            ...requestHeaders
        };

        for (const h of hopByHopHeaders) {
            delete headers[h];
            delete headers[h.toLowerCase()];
        }

        // Always set a valid User-Agent for GitHub
        if (config.name === 'GitHub API') {
            headers['User-Agent'] = 'ByteProxy/0.1.0';
        }

        // Add authentication if configured
        if (config.auth) {
            const token = process.env[config.auth.tokenEnvVar || ''];
            if (token) {
                switch (config.auth.type.toLowerCase()) {
                    case 'bot':
                        headers['Authorization'] = `Bot ${token}`;
                        break;
                    case 'bearer':
                        headers['Authorization'] = `Bearer ${token}`;
                        break;
                    case 'api-key':
                        if (config.auth.headerName) {
                            headers[config.auth.headerName] = token;
                        }
                        break;
                    case 'basic':
                        headers['Authorization'] = `Basic ${btoa(token)}`;
                        break;
                }

                // Debug logging for auth (without exposing full token)
                const maskedToken = token.length > 8 ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}` : '***'
                console.debug(`Auth configured for ${config.name}: ${config.auth.type} with token ${maskedToken}`)
            } else {
                console.warn(`Auth token not found for ${config.name}. Expected env var: ${config.auth.tokenEnvVar}`)
            }
        }

        return headers;
    }

    private async makeRequest(url: string, options: RequestInit): Promise<Response> {
        const config = getConfig()

        try {
            // Build headers properly based on request method and body
            const requestHeaders: Record<string, string> = {
                ...options.headers as Record<string, string>
            }

            // Only set Content-Type for requests with body
            if (options.body && !requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
                requestHeaders['Content-Type'] = 'application/json'
            }

            const requestOptions: RequestInit = {
                ...options,
                headers: requestHeaders,
                // Add timeout support
                signal: AbortSignal.timeout(config.network.timeout)
            }

            // For Bun runtime, add TLS configuration
            if (typeof Bun !== 'undefined') {
                // @ts-ignore - Bun specific options
                requestOptions.tls = {
                    rejectUnauthorized: config.network.strictTLS,
                    secureProtocol: 'TLSv1_2_method'
                }
            }

            return await fetch(url, requestOptions)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            // Handle timeout errors
            if (error instanceof Error && error.name === 'TimeoutError') {
                throw new Error(`Request timeout after ${config.network.timeout}ms when connecting to ${url}`)
            }

            // Provide more helpful error messages for common issues
            if (errorMessage.includes('TLS') || errorMessage.includes('certificate') || errorMessage.includes('SSL')) {
                if (config.network.strictTLS) {
                    throw new Error(`TLS/SSL certificate error when connecting to ${url}. This might be due to:
1. Invalid or expired certificates on the target server
2. System time/date being incorrect
3. Corporate firewall or proxy interference
4. Certificate validation issues

To resolve temporarily (DEVELOPMENT ONLY), you can set network.strictTLS to false in your config.`)
                } else {
                    // Try again with even more relaxed settings if strictTLS is already false
                    try {
                        console.warn(`Certificate validation failed for ${url}, retrying with minimal validation...`)

                        // Use the headers variable from this scope
                        const retryOptions: RequestInit = {
                            ...options,
                            headers: options.headers, // Fix: Reference options.headers directly
                            signal: AbortSignal.timeout(config.network.timeout)
                        }

                        // For Bun, completely disable TLS validation
                        if (typeof Bun !== 'undefined') {
                            // @ts-ignore - Bun specific
                            retryOptions.tls = {
                                rejectUnauthorized: false,
                                checkServerIdentity: () => undefined
                            }
                        }

                        const response = await fetch(url, retryOptions)
                        console.warn(`Successfully connected to ${url} with disabled TLS validation`)
                        return response
                    } catch (retryError) {
                        throw new Error(`Persistent TLS/SSL error when connecting to ${url}. The target server may have certificate issues or be temporarily unavailable. Original error: ${errorMessage}`)
                    }
                }
            }

            if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
                throw new Error(`Network error: Unable to reach ${url}. Please check your internet connection.`)
            }

            throw new Error(`Request failed: ${errorMessage}`)
        }
    }

    private async parseResponseBody(response: Response): Promise<any> {
        const contentType = response.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
            try {
                return await response.json()
            } catch {
                return await response.text()
            }
        }

        if (contentType.includes('text/')) {
            return await response.text()
        }

        // For binary data, return as ArrayBuffer
        return await response.arrayBuffer()
    }

    getRateLimitStatus(service: string): { remaining: number; resetTime: number } | null {
        const config = getServiceConfig(service)
        if (!config?.rateLimit) return null

        const limit = this.rateLimits.get(service)
        if (!limit) {
            return {
                remaining: config.rateLimit.maxRequests,
                resetTime: 0
            }
        }

        return {
            remaining: Math.max(0, config.rateLimit.maxRequests - limit.count),
            resetTime: limit.resetTime
        }
    }

    // HTTP/WebSocket proxy with rewrite support
    public proxyHttpOrWs(
        req: IncomingMessage,
        res: ServerResponse,
        target: string,
        options: ProxyRewriteOptions = {}
    ) {
        // Path rewriting
        let path = req.url || '/'
        if (options.rewritePrefix && path.startsWith(options.rewritePrefix)) {
            path = path.replace(options.rewritePrefix, '') || '/'
        }
        if (options.rewritePath) {
            path = options.rewritePath(path, req)
        }

        // Header rewriting
        let headers = { ...req.headers } as Record<string, string>
        if (options.rewriteHeaders) {
            headers = options.rewriteHeaders(headers, req)
        }

        // X-Forwarded headers
        headers['x-forwarded-for'] = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || ''
        // Use (req.socket as any).encrypted for Node, fallback to http
        headers['x-forwarded-proto'] = ((req.socket as any).encrypted ? 'https' : 'http')
        headers['x-forwarded-host'] = req.headers['host'] || ''

        // WebSocket proxy
        if (
            options.ws &&
            req.headers.upgrade &&
            req.headers.upgrade.toLowerCase() === 'websocket'
        ) {
            if (!WebSocketImpl) {
                res.writeHead(501)
                res.end('WebSocket proxy not supported in this runtime')
                return
            }
            const wsTarget = target.replace(/^http/, 'ws') + path

            // Fix: Use options object properly for WebSocketImpl constructor
            const wsOptions = { headers }
            const wsClient = new WebSocketImpl(wsTarget, [], wsOptions)

            wsClient.on('open', () => {
                req.pipe(wsClient as any)
                    ; (wsClient as any).pipe(res)
            })
            wsClient.on('error', () => {
                res.writeHead(502)
                res.end('WebSocket proxy error')
            })
            return
        }

        const proxyReq = (target.startsWith('https') ? https : http).request(
            target + path,
            {
                method: req.method,
                headers: headers
            },
            proxyRes => {
                res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
                proxyRes.pipe(res)
            }
        )
        proxyReq.on('error', () => {
            res.writeHead(502)
            res.end('Proxy error')
        })
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            req.pipe(proxyReq)
        } else {
            proxyReq.end()
        }
    }
}

export const proxyService = new ProxyService()
