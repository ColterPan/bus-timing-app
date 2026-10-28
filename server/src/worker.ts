// Cloudflare Workers entry point: `npm run deploy`
import type { Hono } from 'hono';
import { createApp } from './app';
import { createLtaClient } from './lta';

interface Env {
  LTA_ACCOUNT_KEY: string;
}

// Created on first request because secrets are only available via `env` at request time
let app: Hono | undefined;

export default {
  fetch(request: Request, env: Env, ctx: unknown) {
    app ??= createApp({
      lta: createLtaClient(env.LTA_ACCOUNT_KEY),
      clientIp: (c) => c.req.header('cf-connecting-ip') ?? 'unknown',
    });
    return app.fetch(request, env, ctx as never);
  },
};
