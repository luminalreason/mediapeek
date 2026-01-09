import { analyzeSchema } from '~/lib/schemas';
import { fetchMediaChunk } from '~/services/media-fetch.server';
import { analyzeMediaBuffer } from '~/services/mediainfo.server';

import type { Route } from './+types/resource.analyze';

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const validationResult = analyzeSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );

  // --- Turnstile Validation ---
  const turnstileToken = request.headers.get('CF-Turnstile-Response');
  const secretKey = import.meta.env.DEV
    ? '1x00000000000000000000AA'
    : context.cloudflare.env.TURNSTILE_SECRET_KEY;

  if (
    (context.cloudflare.env.ENABLE_TURNSTILE as string) === 'true' &&
    secretKey
  ) {
    if (!turnstileToken) {
      return Response.json(
        { error: 'Missing security token. Complete the verification.' },
        { status: 403 },
      );
    }

    // Bypass verification for localhost mock token
    if (turnstileToken === 'localhost-mock-token' || import.meta.env.DEV) {
      // Allow immediately
    } else {
      const formData = new FormData();
      formData.append('secret', secretKey);
      formData.append('response', turnstileToken);
      formData.append(
        'remoteip',
        request.headers.get('CF-Connecting-IP') || '',
      );

      const result = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          body: formData,
        },
      );

      const outcome = (await result.json()) as { success: boolean };
      if (!outcome.success) {
        return Response.json(
          { error: 'Security check failed. Refresh and try again.' },
          { status: 403 },
        );
      }
    }
  }
  // ----------------------------

  if (!validationResult.success) {
    const { fieldErrors } = validationResult.error.flatten();
    const serverError =
      fieldErrors.url?.[0] || fieldErrors.format?.[0] || 'Invalid input.';
    return Response.json({ error: serverError }, { status: 400 });
  }

  const { url: initialUrl, format: requestedFormats } = validationResult.data;

  try {
    // 1. Fetch Media Chunk (includes validation, resolution, streaming)
    const { buffer, fileSize, filename } = await fetchMediaChunk(initialUrl);

    // 2. Analyze
    const results = await analyzeMediaBuffer(
      buffer,
      fileSize,
      filename,
      requestedFormats,
    );

    return Response.json({ results });
  } catch (error) {
    console.error('Server-side Analysis Error:', error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      },
      { status: 500 },
    );
  }
}
