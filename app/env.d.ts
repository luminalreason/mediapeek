/// <reference types="@cloudflare/workers-types" />

interface Env {
  TURNSTILE_SECRET_KEY: string;
  SESSION_SECRET: string;
}
