# OpenClaw Pulse

A high-performance, autonomous system monitoring dashboard for [OpenClaw](https://github.com/openclaw/openclaw).

## Features

- **Real-time Token Tracking:** Monitor input, output, and cache savings across all providers.
- **Model Analytics:** Breakdown of usage by model (Gemini, Llama, etc.).
- **Privacy-First:** Designed to read local logs dynamically without exposing prompt content or sensitive IDs.
- **Modern Stack:** Built with Next.js 15, Tailwind CSS, and Recharts.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/riceharvest/openclaw-pulse.git
   cd openclaw-pulse
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment:**
   This dashboard automatically looks for OpenClaw logs in your home directory (`~/.openclaw/logs`). Ensure OpenClaw is installed and has generated logs.

4. **Run the dashboard:**
   ```bash
   pnpm dev
   ```

## Security & Privacy

OpenClaw Pulse is designed to be safe for public use. The API layer only extracts numerical usage data and timestamps from your local logs. **Raw message content, system prompts, and user identifiers are never sent to the frontend.**

---
Part of the [@opensourceframework](https://github.com/riceharvest/opensourceframework) ecosystem.
