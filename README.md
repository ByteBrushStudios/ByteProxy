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

---

## 📚 Documentation

- **API Reference & Usage:**  
  Interactive Swagger documentation at [`/docs`](http://localhost:3420/docs)
- **Configuration:**  
  See [`src/config/index.ts`](src/config/index.ts) for service configuration options and our [Configuration Guide](https://proxy.bytebrush.dev/config)
- **Troubleshooting:**  
  Use [`/manage/diagnostics`](http://localhost:3420/manage/diagnostics) for system diagnostics or see our [Troubleshooting Guide](https://proxy.bytebrush.dev/troubleshooting)
- **Full Documentation:**  
  Visit our [Documentation Website](https://proxy.bytebrush.dev) for comprehensive guides:
    - [Getting Started](https://proxy.bytebrush.dev/getting-started)
    - [Usage Examples](https://proxy.bytebrush.dev/usage)
    - [Self-Hosting Guide](https://proxy.bytebrush.dev/self-host)
    - [API Reference](https://proxy.bytebrush.dev/api)
    - [Security & Authentication](https://proxy.bytebrush.dev/auth)

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
