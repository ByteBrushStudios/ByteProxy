# ByteProxy Documentation

Welcome to ByteProxy!  
A powerful, extensible web proxy for Discord, GitHub, and more.

## Features

- Multi-service proxying (Discord, GitHub, custom APIs)
- Rate limiting, authentication, and dynamic service management
- Health/status endpoints, diagnostics, and logging
- TypeScript, Elysia, Bun/Node support

## Authentication Options

ByteProxy supports multiple authentication methods:

- API Key via Bearer token: `Authorization: Bearer YOUR_API_KEY`
- API Key via header: `x-api-key: YOUR_API_KEY`
- API Key via query parameter: `?api_key=YOUR_API_KEY`

Authentication can be enabled/disabled in the configuration.

## Quick Links

- [Usage Guide](usage.md)
- [Self-Hosting](self-host.md)
- [Configuration Reference](config.md)
- [Troubleshooting](troubleshooting.md)
- [API Reference](api.md)

---

Built by [ByteBrush Studios](https://github.com/ByteBrushStudios) and [CodeMeAPixel](https://codemeapixel.dev).
