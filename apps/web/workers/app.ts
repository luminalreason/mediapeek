import { createRequestHandler } from 'react-router';

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Default React Router handler
    try {
      return await requestHandler(request, {
        cloudflare: { env, ctx },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('No route matches URL')
      ) {
        console.warn(
          JSON.stringify({
            severity: 'WARNING',
            errorClass: 'ROUTE_NOT_FOUND',
            requestId: request.headers.get('cf-ray') ?? crypto.randomUUID(),
            message: error.message,
            path: url.pathname,
          }),
        );
        return new Response('Not Found', { status: 404 });
      }
      throw error;
    }
  },
} satisfies ExportedHandler<Env>;
