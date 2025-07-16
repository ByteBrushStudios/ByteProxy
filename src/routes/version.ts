import { Elysia } from 'elysia'
import { getAppVersion, checkForUpdates } from '../config'

export const versionRoutes = new Elysia({ prefix: '/version' })
    .get(
        '/',
        () => {
            const appVersion = getAppVersion()
            const versionParts = appVersion.split('-')

            return {
                version: appVersion,
                semver: versionParts[0],
                environment: versionParts[1] || 'prod',
                commitHash: versionParts[2] || undefined,
                builtWith: {
                    bun: process.version,
                    elysia: 'latest'
                }
            }
        },
        {
            detail: {
                summary: 'Get Version Information',
                description: 'Returns detailed version information about the running ByteProxy instance',
                tags: ['Base'],
                responses: {
                    200: {
                        description: 'Version Information',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        version: {
                                            type: 'string',
                                            description: 'Full version string',
                                            example: 'v0.1.0-dev'
                                        },
                                        semver: {
                                            type: 'string',
                                            description: 'Semantic version number',
                                            example: 'v0.1.0'
                                        },
                                        environment: {
                                            type: 'string',
                                            description: 'Deployment environment',
                                            example: 'dev'
                                        },
                                        commitHash: {
                                            type: 'string',
                                            description: 'Git commit hash (if available)',
                                            example: 'a1b2c3d'
                                        },
                                        builtWith: {
                                            type: 'object',
                                            description: 'Build environment information',
                                            properties: {
                                                bun: { type: 'string', example: 'v1.0.0' },
                                                elysia: { type: 'string', example: 'latest' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )

    .get(
        '/check',
        async () => {
            const updateInfo = await checkForUpdates()

            return {
                ...updateInfo,
                checkTime: new Date().toISOString()
            }
        },
        {
            detail: {
                summary: 'Check for Updates',
                description: 'Checks GitHub for newer versions of ByteProxy and provides update information',
                tags: ['Base'],
                responses: {
                    200: {
                        description: 'Update Information',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        currentVersion: {
                                            type: 'string',
                                            description: 'Currently running version',
                                            example: 'v0.1.0-dev'
                                        },
                                        latestVersion: {
                                            type: 'string',
                                            description: 'Latest available version',
                                            example: 'v0.2.0'
                                        },
                                        latestReleaseUrl: {
                                            type: 'string',
                                            description: 'URL to the latest release on GitHub',
                                            example: 'https://github.com/ByteBrushStudios/ByteProxy/releases/tag/v0.2.0'
                                        },
                                        isLatest: {
                                            type: 'boolean',
                                            description: 'Whether the current version is the latest',
                                            example: false
                                        },
                                        isPrerelease: {
                                            type: 'boolean',
                                            description: 'Whether the latest version is a prerelease',
                                            example: false
                                        },
                                        releaseDate: {
                                            type: 'string',
                                            description: 'Release date of the latest version',
                                            example: '2023-08-15T00:00:00Z'
                                        },
                                        updateAvailable: {
                                            type: 'boolean',
                                            description: 'Whether an update is available',
                                            example: true
                                        },
                                        checkTime: {
                                            type: 'string',
                                            description: 'When this check was performed',
                                            example: '2023-08-16T14:30:00Z'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )
