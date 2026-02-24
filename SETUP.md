# OpenClaw Pulse Setup Guide

Connect your local OpenClaw logs to the Pulse dashboard in minutes.

## Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed
- Node.js 20+ and pnpm

## Step 1: Install OpenClaw

If you haven't already, install OpenClaw:

```bash
npm install -g openclaw
```

## Step 2: Ensure Logging is Enabled

OpenClaw should be configured to write logs. The dashboard expects logs at:

```
~/.openclaw/logs/
```

Each log file should be in JSON format with entries containing:
- `timestamp`: ISO date string
- `model`: Model name (e.g., "gemini-2.0-flash", "claude-3-opus")
- `input_tokens`: Number of input tokens
- `output_tokens`: Number of output tokens
- `cache_savings`: Cache savings in tokens (if applicable)

## Step 3: Clone and Install

```bash
git clone https://github.com/riceharvest/openclaw-pulse.git
cd openclaw-pulse
pnpm install
```

## Step 4: Run the Dashboard

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view your dashboard.

## Troubleshooting

### No data appears

1. Verify logs exist: `ls ~/.openclaw/logs/`
2. Check log format matches expected structure
3. Ensure OpenClaw has run at least once

### Custom log location

If your logs are in a different directory, modify `app/api/stats/route.ts` to point to your log directory.

## Production Build

```bash
pnpm build
pnpm start
```
