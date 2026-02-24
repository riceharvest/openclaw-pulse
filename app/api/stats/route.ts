import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

const OPENCLAW_HOME = path.join(os.homedir(), '.openclaw');

export async function GET() {
  try {
    const agentsDir = path.join(OPENCLAW_HOME, 'agents');
    const stats: {
      totalTokens: number;
      totalInput: number;
      totalOutput: number;
      totalCacheRead: number;
      sessions: Array<{ id: string; agent: string; tokens: number }>;
      byModel: Record<string, { input: number; output: number; total: number; count: number }>;
      history: Array<{ timestamp: string; agent: string; model: string; input: number; output: number; cacheRead: number; total: number; action: string }>;
      daily?: Record<string, number>;
      chartData?: Array<{ date: string; tokens: number }>;
    } = {
      totalTokens: 0,
      totalInput: 0,
      totalOutput: 0,
      totalCacheRead: 0,
      sessions: [],
      byModel: {},
      history: [],
    };

    if (!fs.existsSync(agentsDir)) {
      return NextResponse.json({ error: 'OpenClaw directory not found' }, { status: 404 });
    }

    const agents = fs.readdirSync(agentsDir);

    for (const agent of agents) {
      const sessionsDir = path.join(agentsDir, agent, 'sessions');
      if (!fs.existsSync(sessionsDir)) continue;

      const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));

      for (const file of files) {
        const filePath = path.join(sessionsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.trim().split('\n');

        let sessionTokens = 0;

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.type === 'message' && entry.message?.role === 'assistant') {
              const usage = entry.message.usage;
              if (usage) {
                const input = usage.input || 0;
                const output = usage.output || 0;
                const cacheRead = usage.cacheRead || 0;
                const total = usage.totalTokens || (input + output);

                stats.totalInput += input;
                stats.totalOutput += output;
                stats.totalCacheRead += cacheRead;
                stats.totalTokens += total;
                sessionTokens += total;

                const model = entry.message.model || 'unknown';
                if (!stats.byModel[model]) {
                  stats.byModel[model] = { input: 0, output: 0, total: 0, count: 0 };
                }
                stats.byModel[model].input += input;
                stats.byModel[model].output += output;
                stats.byModel[model].total += total;
                stats.byModel[model].count += 1;

                // Add detailed entry for raw logs table
                stats.history.push({
                  timestamp: entry.timestamp,
                  agent,
                  model: model.split('/').pop(),
                  input,
                  output,
                  cacheRead,
                  total,
                  action: entry.action || 'message'
                });

                // Daily history aggregation for chart
                const date = entry.timestamp.split('T')[0];
                if (!stats.daily) stats.daily = {};
                if (!stats.daily[date]) stats.daily[date] = 0;
                stats.daily[date] += total;
              }
              }
            } catch {
              // Skip malformed lines
            }
        }

        stats.sessions.push({
          id: file.replace('.jsonl', ''),
          agent,
          tokens: sessionTokens,
        });
      }
    }

    // Convert daily map to sorted history array for chart
    stats.chartData = Object.entries(stats.daily || {})
      .map(([date, tokens]) => ({ date, tokens: tokens as number }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Sort raw history by timestamp descending
    stats.history.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
