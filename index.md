---
title: Home
layout: home
nav_order: 1
permalink: /
---

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

Authentication can be enabled/disabled in the configuration. For detailed information, see our [Authentication Guide](auth.md).

## Quick Links

- [Getting Started](getting-started.md)
- [Usage Guide](usage.md)
- [Authentication](auth.md)
- [Self-Hosting](self-host.md)
- [Configuration Reference](config.md)
- [API Reference](api.md)
- [Service Management](services.md)
- [Troubleshooting](troubleshooting.md)
- [Contributing](contributing.md)
- [Changelog](changelog.md)

---

Built by [ByteBrush Studios](https://github.com/ByteBrushStudios) and [CodeMeAPixel](https://codemeapixel.dev)
