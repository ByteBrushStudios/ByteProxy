# ByteProxy

[![Build Status](https://github.com/ByteBrushStudios/ByteProxy/actions/workflows/build.yml/badge.svg)](https://github.com/ByteBrushStudios/ByteProxy/actions/workflows/build.yml)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-blue)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/version-0.1.0-orange)](https://github.com/ByteBrushStudios/ByteProxy/releases)
[![Discord](https://img.shields.io/discord/871440804638519337?label=Discord&logo=discord)](https://discord.gg/Vv2bdC44Ge)

A powerful, extensible web proxy built with [Elysia](https://elysiajs.com/) for seamless API forwarding to Discord, GitHub, and more. Features built-in rate limiting, dynamic service management, robust error handling, and interactive API docs.

---

## 🚀 Features

- **Multi-Service Proxy:** Discord, GitHub, and custom APIs
- **Rate Limiting:** Per-service, configurable
- **Dynamic Service Management:** Add/remove services at runtime
- **CORS Support:** Configurable origins
- **Comprehensive Logging:** Request/response logs
- **Health Monitoring:** `/health` and `/status` endpoints
- **Swagger Docs:** Interactive API docs at [`/docs`](http://localhost:3420/docs)
- **TypeScript:** Fully typed for reliability

> **Note:**  
> Authentication is currently disabled due to ongoing fixes.  
> All proxy and management endpoints are open by default.

---

## ⚡ Quick Start

```bash
git clone https://github.com/ByteBrushStudios/ByteProxy.git
cd ByteProxy
bun install
cp .env.example .env.local
# Edit .env.local with your API tokens
bun run dev
```

Access the proxy at [http://localhost:3420](http://localhost:3420) and explore the API documentation at [http://localhost:3420/docs](http://localhost:3420/docs).

Check out our [documentation website](https://proxy.bytebrush.dev) for complete setup guides, usage examples, and API references.

---

## 📚 Documentation

- **API Reference & Usage:**  
  Interactive Swagger documentation at [`/docs`](http://localhost:3420/docs)
- **Configuration:**  
  See [`src/config/index.ts`](src/config/index.ts) for service configuration options
- **Troubleshooting:**  
  Use [`/manage/diagnostics`](http://localhost:3420/manage/diagnostics) for system diagnostics
- **Authentication:**  
  API key management at [`/manage/key-debug`](http://localhost:3420/manage/key-debug)
- **Health Checks:**  
  Server status at [`/health`](http://localhost:3420/health) and [`/status`](http://localhost:3420/status)

### Environment Variables

Create a `.env.local` file with the following options:

```
# Server Configuration
PORT=3420
CORS_ENABLED=true
CORS_ORIGINS=*
LOG_LEVEL=info

# Security Settings
REQUIRE_AUTH_FOR_PROXY=false
REQUIRE_AUTH_FOR_MANAGEMENT=false
PROXY_API_KEY=your-proxy-key
MANAGEMENT_API_KEY=your-management-key

# Service API Tokens
DISCORD_BOT_TOKEN=your-discord-token
GITHUB_TOKEN=your-github-token

# Network Settings
NETWORK_TIMEOUT=30000
NETWORK_RETRIES=2
STRICT_TLS=true

# Update Settings
SKIP_UPDATE_CHECK=false
```

---

## 🛠️ Development

- **Project Structure:**
    - `src/config/` - Service and system configuration
    - `src/routes/` - API endpoint definitions
    - `src/middleware/` - Authentication and CORS handlers
    - `src/utils/` - Logging and helper utilities
    - `src/services/` - Core service implementations

- **Scripts:**
    - `bun run dev` — Development mode with hot reloading
    - `bun run build` — Build TypeScript project
    - `bun run start` — Start production server
    - `bun run test` — Run test suite

---

## 💡 Support & Community

- [Create an issue](https://github.com/ByteBrushStudios/ByteProxy/issues)
- [Join our Discord](https://discord.gg/Vv2bdC44Ge)
- [Documentation](https://proxy.bytebrush.dev)

---

## 📄 License

AGPL-3.0 © ByteBrush Studios - [View License](./LICENSE)

---

Built with ❤️ by [CodeMeAPixel](https://codemeapixel.dev) and the ByteBrush Studios team.
