import { Elysia } from 'elysia'
import { getConfig } from '../config'

export const corsMiddleware = new Elysia()
    .onRequest(({ request, set }) => {
        const config = getConfig()

        if (!config.cors.enabled) return

        const origin = request.headers.get('origin')
        const allowedOrigins = config.cors.origins

        // Check if origin is allowed
        const isAllowed = allowedOrigins.includes('*') ||
            (origin && allowedOrigins.includes(origin))

        if (isAllowed) {
            set.headers['Access-Control-Allow-Origin'] = origin || '*'
            set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
            set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            set.headers['Access-Control-Allow-Credentials'] = 'true'
        }
    })

    // Handle preflight requests
    .options('*', ({ set }) => {
        const config = getConfig()

        if (config.cors.enabled) {
            set.headers['Access-Control-Allow-Origin'] = '*'
            set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
            set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            set.headers['Access-Control-Max-Age'] = '86400'
        }

        return new Response(null, { status: 204 })
    })
