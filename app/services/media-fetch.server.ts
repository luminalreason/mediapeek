import {
  getEmulationHeaders,
  resolveGoogleDriveUrl,
  validateUrl,
} from '~/lib/server-utils';

export interface MediaFetchResult {
  buffer: Uint8Array;
  filename: string;
  fileSize: number;
}

export async function fetchMediaChunk(
  initialUrl: string,
  chunkSize: number = 50 * 1024 * 1024,
): Promise<MediaFetchResult> {
  const { url: targetUrl, isGoogleDrive } = resolveGoogleDriveUrl(initialUrl);

  if (isGoogleDrive) {
    console.log(`[Analyze] Converted Google Drive URL to: ${targetUrl}`);
  }

  validateUrl(targetUrl);

  // 1. HEAD Request
  const headRes = await fetch(targetUrl, {
    method: 'HEAD',
    headers: getEmulationHeaders(),
    redirect: 'follow',
  });

  console.log(`[Analyze] isGoogleDrive: ${isGoogleDrive}`);
  if (isGoogleDrive) {
    const contentType = headRes.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error(
        'Google Drive file is rate-limited. Please try again in 24 hours.',
      );
    }
  }

  if (!headRes.ok) throw new Error(`Failed to HEAD: ${headRes.status}`);

  const fileSize = parseInt(headRes.headers.get('content-length') || '0', 10);
  console.log(`[Analyze] File size: ${fileSize} bytes`);
  if (!fileSize) throw new Error('Could not determine file size');

  // 2. Determine Filename
  let filename = targetUrl;
  const contentDisposition = headRes.headers.get('content-disposition');
  if (contentDisposition) {
    const starMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (starMatch && starMatch[1]) {
      try {
        filename = decodeURIComponent(starMatch[1]);
      } catch (e) {
        console.warn('Failed to decode filename*:', e);
      }
    } else {
      const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      if (normalMatch && normalMatch[1]) {
        filename = normalMatch[1];
      }
    }
  }
  console.log(`[Analyze] Resolved filename: ${filename}`);

  // 3. Fetch Content Chunk
  const fetchEnd = Math.min(chunkSize - 1, fileSize - 1);

  console.log(`[Analyze] Pre-fetching bytes 0-${fetchEnd}...`);
  const t0 = performance.now();
  const response = await fetch(targetUrl, {
    headers: getEmulationHeaders(`bytes=0-${fetchEnd}`),
    redirect: 'follow',
  });
  console.log(
    `[Analyze] Fetch response received in ${Math.round(performance.now() - t0)}ms. Status: ${response.status}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch initial chunk: ${response.status} ${response.statusText}`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Failed to retrieve response body stream');

  const chunks: Uint8Array[] = [];
  let receivedLength = 0;
  const maxBytes = fetchEnd + 1;
  let chunkCount = 0;

  try {
    console.log('[Analyze] Starting stream reading loop...');
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log(
          `[Analyze] Stream reading finished. Total chunks: ${chunkCount}`,
        );
        break;
      }

      chunkCount++;
      chunks.push(value);
      receivedLength += value.length;

      // Log every 50 chunks or first/last chunks to debug progress
      if (chunkCount % 50 === 0 || receivedLength >= maxBytes) {
        console.log(
          `[Analyze] Read chunk ${chunkCount}, Total: ${receivedLength} bytes`,
        );
      }

      if (receivedLength >= maxBytes) {
        console.log(
          `[Analyze] Reached chunk limit (${receivedLength}/${maxBytes}). Cancelling stream.`,
        );
        await reader.cancel();
        break;
      }
    }
  } catch (err) {
    console.warn('[Analyze] Stream reading interrupted or failed:', err);
  }

  const fileBuffer = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    fileBuffer.set(chunk, position);
    position += chunk.length;
  }

  console.log(`[Analyze] Loaded ${fileBuffer.byteLength} bytes into memory.`);

  return {
    buffer: fileBuffer,
    filename,
    fileSize,
  };
}
