import { Elysia } from 'elysia'
import { getConfig, listServices, getServiceConfig } from '../config'

export const healthRoutes = new Elysia()
    .get('/health', () => {
        const config = getConfig()
        const services = listServices()

        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '0.1.0',
            services: {
                total: services.length,
                available: services
            },
            config: {
                port: config.port,
                logging: config.logging,
                cors: config.cors
            }
        }
    }, {
        detail: {
            summary: 'Health check endpoint',
            tags: ['Health']
        }
    })

    .get('/status', () => {
        const config = getConfig()
        const services = listServices()

        const serviceDetails = services.map(key => {
            const serviceConfig = getServiceConfig(key)
            return {
                key,
                name: serviceConfig?.name,
                baseUrl: serviceConfig?.baseUrl,
                configured: !!serviceConfig,
                hasAuth: !!serviceConfig?.auth,
                authTokenConfigured: serviceConfig?.auth?.tokenEnvVar
                    ? !!process.env[serviceConfig.auth.tokenEnvVar]
                    : false,
                rateLimit: serviceConfig?.rateLimit
            }
        })

        return {
            application: {
                name: 'ByteProxy',
                version: '0.1.0',
                description: 'Extensible web proxy for Discord, GitHub, and other APIs'
            },
            runtime: {
                node: process.version,
                platform: process.platform,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            },
            configuration: {
                port: config.port,
                services: serviceDetails,
                logging: config.logging,
                cors: config.cors
            }
        }
    }, {
        detail: {
            summary: 'Detailed status information',
            tags: ['Health']
        }
    })
