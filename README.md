# ByteProxy

[![Build Status](https://github.com/ByteBrushStudios/Proxy/actions/workflows/build.yml/badge.svg)](https://github.com/ByteBrushStudios/Proxy/actions/workflows/build.yml)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-blue)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/version-0.1.0-orange)](https://github.com/ByteBrushStudios/Proxy/releases)
[![Discord](https://img.shields.io/discord/957420716142252062?label=Discord&logo=discord)](https://discord.gg/Vv2bdC44Ge)

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
git clone https://github.com/ByteBrushStudios/Proxy.git
cd proxy
bun install
cp .env.example .env.local
# Edit .env.local with your API tokens
bun run dev
```

Check out our [docs](https://proxy.bytebrush.dev) for Setup, Usage Guides and Documentation.

---

## 📚 Documentation

- **API Reference & Usage:**  
  See [`/docs`](http://localhost:3420/docs) (Swagger UI)
- **Configuration:**  
  See [`src/config/index.ts`](src/config/index.ts) for service setup
- **Troubleshooting:**  
  See [`/manage/diagnostics`](http://localhost:3420/manage/diagnostics)

---

## 🛠️ Development

- **Project Structure:**  
  See [`src/`](src/)
- **Scripts:**  
  - `bun run dev` — Development mode
  - `bun run build` — Build TypeScript
  - `bun run start` — Start production server

---

## 💡 Support & Community

- [Create an issue](https://github.com/ByteBrushStudios/Proxy/issues)
- [Join our Discord](https://discord.gg/Vv2bdC44Ge)
- [Documentation](https://proxy.bytebrush.dev)

---

## 📄 License

AGPL-3.0 © ByteBrush Studios - [View License](./LICENSE)

---

Built with ❤️ by [CodeMeAPixel](https://codemeapixel.dev) and the ByteBrush Studios team.
