export interface ServiceConfig {
    name: string
    baseUrl: string
    headers?: Record<string, string>
    rateLimit?: {
        maxRequests: number
        windowMs: number
    }
    auth?: {
        type: 'bearer' | 'basic' | 'api-key' | 'bot'
        tokenEnvVar?: string
        headerName?: string
    }
    versionedBaseUrls?: Record<string, string>
}

export interface ProxyConfig {
    port: number
    services: Record<string, ServiceConfig>
    cors: {
        enabled: boolean
        origins: string[]
    }
    logging: {
        enabled: boolean
        level: 'debug' | 'info' | 'warn' | 'error'
    }
    network: {
        timeout: number
        retryAttempts: number
        strictTLS: boolean
    }
    security: {
        proxyApiKey?: string
        managementApiKey?: string
        requireAuthForProxy: boolean
        requireAuthForManagement: boolean
    }
}

const defaultConfig: ProxyConfig = {
    port: Number(process.env.PORT) || 3420,
    services: {
        discord: {
            name: 'Discord API',
            baseUrl: 'https://discord.com/api/',
            versionedBaseUrls: {
                v10: 'https://discord.com/api/v10/',
                v9: 'https://discord.com/api/v9/'
            },
            headers: {
                'User-Agent': 'DiscordBot (https://github.com/ByteBrushStudios/ByteProxy, 0.1.0)',
                'Content-Type': 'application/json'
            },
            rateLimit: {
                maxRequests: 50,
                windowMs: 60000
            },
            auth: {
                type: 'bot',
                tokenEnvVar: 'DISCORD_BOT_TOKEN'
            }
        },
        github: {
            name: 'GitHub API',
            baseUrl: 'https://api.github.com/',
            headers: {
                'User-Agent': 'ByteProxy/0.1.0',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            rateLimit: {
                maxRequests: 60,
                windowMs: 3600000
            },
            auth: {
                type: 'bearer',
                tokenEnvVar: 'GITHUB_TOKEN'
            }
        }
    },
    logging: {
        enabled: true,
        level: 'info'
    },
    cors: {
        enabled: true,
        origins: ['*']
    },
    network: {
        timeout: 30000,
        retryAttempts: 2,
        strictTLS: false
    },
    security: {
        proxyApiKey: process.env.PROXY_API_KEY || undefined,
        managementApiKey: process.env.MANAGEMENT_API_KEY || undefined,
        requireAuthForProxy: process.env.REQUIRE_AUTH_FOR_PROXY !== 'false',
        requireAuthForManagement: process.env.REQUIRE_AUTH_FOR_MANAGEMENT !== 'false'
    }
}

export const getConfig = (): ProxyConfig => {
    // In the future, this could load from a config file or environment variables
    return defaultConfig
}

export const addService = (key: string, config: ServiceConfig): void => {
    defaultConfig.services[key] = config
}

export const getServiceConfig = (service: string): ServiceConfig | undefined => {
    return defaultConfig.services[service]
}

export const listServices = (): string[] => {
    return Object.keys(defaultConfig.services)
}
