// Local development entry point: `npm run dev`
import { serve } from '@hono/node-server';
import { getConnInfo } from '@hono/node-server/conninfo';
import { networkInterfaces } from 'node:os';
import { createApp } from './app';
import { createLtaClient } from './lta';

try {
  process.loadEnvFile('.env');
} catch {
  console.error('No server/.env file found. Copy .env.example to .env and add your LTA_ACCOUNT_KEY.');
  process.exit(1);
}

const port = Number(process.env.PORT ?? 3000);
const app = createApp({
  lta: createLtaClient(process.env.LTA_ACCOUNT_KEY ?? ''),
  clientIp: (c) => getConnInfo(c).remote.address ?? 'unknown',
});

function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i!.address);
}

// 0.0.0.0 so a phone on the same Wi-Fi can reach the laptop
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.info(`Bus proxy running:  http://localhost:${port}/health`);
  for (const ip of lanAddresses()) console.info(`  from your phone:  http://${ip}:${port}`);
});
