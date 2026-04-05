import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const OPENCLAW_CONFIG_PATH = path.join(os.homedir(), '.openclaw', 'openclaw.json');

export async function GET() {
  try {
    if (!fs.existsSync(OPENCLAW_CONFIG_PATH)) {
      return NextResponse.json({ error: 'OpenClaw configuration not found' }, { status: 404 });
    }
    const content = fs.readFileSync(OPENCLAW_CONFIG_PATH, 'utf8');
    const config = JSON.parse(content);
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newConfig = await request.json();
    
    // Simple validation (can be more strict)
    if (!newConfig || typeof newConfig !== 'object') {
      return NextResponse.json({ error: 'Invalid configuration object' }, { status: 400 });
    }

    // Create backup
    if (fs.existsSync(OPENCLAW_CONFIG_PATH)) {
      const backupPath = `${OPENCLAW_CONFIG_PATH}.bak.${Date.now()}`;
      fs.copyFileSync(OPENCLAW_CONFIG_PATH, backupPath);
    }

    fs.writeFileSync(OPENCLAW_CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, message: 'Configuration saved successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
