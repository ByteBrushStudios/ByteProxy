import { readFileSync } from 'fs'
import { join } from 'path'
import { fetch } from 'undici'

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

// Load package version once at startup
let packageVersion: string
try {
    const pkgPath = join(__dirname, '../../package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    packageVersion = pkg.version || '0.1.0'
} catch {
    packageVersion = '0.1.0'
}

const serviceRegistry: Record<string, ServiceConfig> = {
    discord: {
        id: 'discord',
        name: 'Discord API',
        baseUrl: 'https://discord.com/api/',
        versionedBaseUrls: {
            v10: 'https://discord.com/api/v10/',
            v9: 'https://discord.com/api/v9/'
        },
        headers: {
            'User-Agent': `DiscordBot (https://github.com/ByteBrushStudios/ByteProxy, ${packageVersion})`,
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
            'User-Agent': `ByteProxy/${packageVersion}`,
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
let cachedConfig: ProxyConfig | null = null

export const getConfig = (): ProxyConfig => {
    // Return cached config if available
    if (cachedConfig) {
        return cachedConfig
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
    }

    // Store the config in cache
    cachedConfig = config

    return config
}

// Function to reset the config cache (useful for testing or after env changes)
export const resetConfigCache = (): void => {
    cachedConfig = null
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

/**
 * Determines the current environment based on NODE_ENV
 * @returns Environment name (prod, dev, test, or local)
 */
export function determineEnvironment(): string {
    const env = process.env.NODE_ENV?.toLowerCase() || 'local'
    if (['production', 'prod'].includes(env)) return 'prod'
    if (['development', 'dev'].includes(env)) return 'dev'
    return 'local'
}

/**
 * Gets the version from package.json with optional environment info.
 * Returns a clean version string for production (v1.0.0) and
 * environment-tagged version for non-production (v1.0.0-dev)
 */
export function getAppVersion(): string {
    // Read version from package.json
    let version = 'unknown'
    try {
        const pkgPath = join(__dirname, '../../package.json')
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
        version = pkg.version || version
    } catch {
        // ignore
    }

    // Get current environment
    const env = determineEnvironment()

    // Format version string: v1.0.0 for prod, v1.0.0-env for non-prod
    const formattedVersion = env === 'prod' ? `v${version}` : `v${version}-${env}`

    return formattedVersion
}

interface GitHubRelease {
    tag_name: string
    name: string
    published_at: string
    html_url: string
    prerelease: boolean
}

/**
 * Checks for the latest release on GitHub and compares with current version
 * @param owner The GitHub repository owner
 * @param repo The GitHub repository name
 * @returns Object with version comparison information
 */
export async function checkForUpdates(
    owner = 'ByteBrushStudios',
    repo = 'ByteProxy'
): Promise<{
    currentVersion: string
    latestVersion: string | null
    latestReleaseUrl: string | null
    isLatest: boolean
    isPrerelease: boolean
    releaseDate: string | null
    updateAvailable: boolean
}> {
    const currentVersion = getAppVersion()
    const currentSemver = currentVersion.split('-')[0].replace('v', '')

    try {
        // Fetch latest release from GitHub API
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'ByteProxy-UpdateChecker/1.0'
            }
        })

        if (!response.ok) {
            throw new Error(`GitHub API responded with status: ${response.status}`)
        }

        const releases = (await response.json()) as GitHubRelease[]

        if (!releases || releases.length === 0) {
            return {
                currentVersion,
                latestVersion: null,
                latestReleaseUrl: null,
                isLatest: true,
                isPrerelease: false,
                releaseDate: null,
                updateAvailable: false
            }
        }

        // Find the latest non-prerelease version
        const stableReleases = releases.filter(r => !r.prerelease)
        const latestRelease = stableReleases.length > 0 ? stableReleases[0] : releases[0]
        const latestVersion = latestRelease.tag_name.replace('v', '')

        // Simple semver comparison - could be enhanced for more complex versions
        const updateAvailable = compareVersions(currentSemver, latestVersion) < 0

        return {
            currentVersion,
            latestVersion: latestRelease.tag_name,
            latestReleaseUrl: latestRelease.html_url,
            isLatest: !updateAvailable,
            isPrerelease: latestRelease.prerelease,
            releaseDate: latestRelease.published_at,
            updateAvailable
        }
    } catch (error) {
        console.error('Failed to check for updates:', error)
        return {
            currentVersion,
            latestVersion: null,
            latestReleaseUrl: null,
            isLatest: true,
            isPrerelease: false,
            releaseDate: null,
            updateAvailable: false
        }
    }
}

/**
 * Simple semver comparison utility
 * @returns negative if v1 < v2, positive if v1 > v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
    const v1Parts = v1.split('.').map(Number)
    const v2Parts = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0
        const v2Part = v2Parts[i] || 0

        if (v1Part !== v2Part) {
            return v1Part - v2Part
        }
    }

    return 0
}
