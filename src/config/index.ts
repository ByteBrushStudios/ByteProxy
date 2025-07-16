export interface ServiceConfig {
    id?: string
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

let serviceRegistry: Record<string, ServiceConfig> = {
    discord: {
        id: 'discord',
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
        id: 'github',
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
}

// Add a cached config to avoid recomputing and logging on every call
let cachedConfig: ProxyConfig | null = null;

export const getConfig = (): ProxyConfig => {
    // Return cached config if available
    if (cachedConfig) {
        return cachedConfig;
    }

    const config: ProxyConfig = {
        port: parseInt(process.env.PORT || '3420', 10),
        services: serviceRegistry,
        cors: {
            enabled: process.env.CORS_ENABLED !== 'false',
            origins: process.env.CORS_ORIGINS?.split(',') || ['*']
        },
        logging: {
            enabled: process.env.LOGGING_ENABLED !== 'false',
            level: (process.env.LOG_LEVEL as ProxyConfig['logging']['level']) || 'info'
        },
        network: {
            timeout: parseInt(process.env.NETWORK_TIMEOUT || '30000', 10),
            retryAttempts: parseInt(process.env.NETWORK_RETRIES || '2', 10),
            strictTLS: process.env.STRICT_TLS !== 'false'
        },
        security: {
            proxyApiKey: process.env.PROXY_API_KEY?.trim(),
            managementApiKey: process.env.MANAGEMENT_API_KEY?.trim(),
            requireAuthForProxy: process.env.REQUIRE_AUTH_FOR_PROXY === 'true',
            requireAuthForManagement: process.env.REQUIRE_AUTH_FOR_MANAGEMENT === 'true'
        }
    };

    // Store the config in cache
    cachedConfig = config;

    return config;
};

// Function to reset the config cache (useful for testing or after env changes)
export const resetConfigCache = (): void => {
    cachedConfig = null;
}

// Resolve a token from a service config's tokenEnvVar
export const resolveServiceAuthToken = (service: string): string | undefined => {
    const svc = serviceRegistry[service]
    const envVar = svc?.auth?.tokenEnvVar
    return envVar ? process.env[envVar]?.trim() : undefined
}

// Access API key based on auth type
export const getApiKey = (keyType: 'proxy' | 'management'): string | undefined => {
    const config = getConfig()
    return keyType === 'proxy' ? config.security.proxyApiKey : config.security.managementApiKey
}

// Dynamically add a service config
export const addService = (key: string, config: ServiceConfig): void => {
    config.id = key
    serviceRegistry[key] = config
}

// Get a single service config
export const getServiceConfig = (service: string): ServiceConfig | undefined => {
    return serviceRegistry[service]
}

// List all registered services
export const listServices = (): string[] => {
    return Object.keys(serviceRegistry)
}