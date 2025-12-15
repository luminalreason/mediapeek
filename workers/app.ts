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

    // Proxy logic
    // console.log("Incoming request:", url.pathname, url.searchParams.toString());
    if (
      url.pathname === '/resources/proxy' ||
      url.pathname.startsWith('/resources/proxy')
    ) {
      const targetUrl = url.searchParams.get('url');

      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, User-Agent',
        'Access-Control-Expose-Headers':
          'Content-Length, Content-Range, Content-Type, Accept-Ranges, Content-Disposition',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: corsHeaders,
        });
      }

      if (!targetUrl) {
        return new Response("Missing 'url' query parameter", {
          status: 400,
          headers: corsHeaders,
        });
      }

      try {
        const upstreamUrl = new URL(targetUrl);
        // Basic validation
        if (!['http:', 'https:'].includes(upstreamUrl.protocol)) {
          return new Response('Invalid protocol', {
            status: 400,
            headers: corsHeaders,
          });
        }

        const upstreamHeaders = new Headers();

        // Forward key headers
        const allowedReqHeaders = [
          'Range',
          'User-Agent',
          'Accept',
          'Accept-Encoding',
        ];
        for (const header of allowedReqHeaders) {
          const val = request.headers.get(header);
          if (val) upstreamHeaders.set(header, val);
        }

        // Always set a default User-Agent if none provided, to avoid blocking
        if (!upstreamHeaders.has('User-Agent')) {
          upstreamHeaders.set(
            'User-Agent',
            'MediaPeek/1.0 (Cloudflare Worker)',
          );
        }

        const upstreamResponse = await fetch(upstreamUrl.toString(), {
          method: request.method,
          headers: upstreamHeaders,
          redirect: 'follow',
        });

        // Create response headers to forward
        const responseHeaders = new Headers();

        // Copy upstream headers but filter out hop-by-hop or problematic ones
        const skipHeaders = [
          'content-encoding', // Let the worker/browser handle this
          'content-security-policy',
          'access-control-allow-origin', // We set our own
          'transfer-encoding',
          'connection',
          'keep-alive',
        ];

        for (const [key, value] of upstreamResponse.headers.entries()) {
          if (!skipHeaders.includes(key.toLowerCase())) {
            responseHeaders.set(key, value);
          }
        }

        // Ensure CORS headers are set/overwritten
        Object.entries(corsHeaders).forEach(([key, value]) => {
          responseHeaders.set(key, value);
        });

        // Strictly check for Range support if we requested it
        // If we requested bytes=0-100 and got 200 OK (full file), we might want to warn or error?
        // But for stream passthrough, we just return what we got.
        // The client-side (mediainfo.ts) logic will now handle the 200 vs 206 check and abort if needed.

        return new Response(upstreamResponse.body, {
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
          headers: responseHeaders,
        });
      } catch (error) {
        return new Response(
          `Proxy error: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          {
            status: 502,
            headers: corsHeaders,
          },
        );
      }
    }

    // Default Remix handler
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
