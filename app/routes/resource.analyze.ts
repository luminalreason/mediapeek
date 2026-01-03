import { fetchMediaChunk } from '~/services/media-fetch.server';
import { analyzeMediaBuffer } from '~/services/mediainfo.server';

import type { Route } from './+types/resource.analyze';

export async function loader({ request }: Route.LoaderArgs) {
  const urlParams = new URL(request.url).searchParams;
  const initialUrl = urlParams.get('url');

  if (!initialUrl) {
    return Response.json(
      { error: 'Please provide a valid URL.' },
      { status: 400 },
    );
  }

  try {
    // 1. Fetch Media Chunk (includes validation, resolution, streaming)
    const { buffer, fileSize, filename } = await fetchMediaChunk(initialUrl);

    // 2. Analyze
    const requestedFormats =
      urlParams.get('format')?.toLowerCase().split(',') || [];

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
