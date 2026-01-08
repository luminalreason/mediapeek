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
  chunkSize: number = 10 * 1024 * 1024,
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

  // Check for HTML content (indicates a webpage, not a direct file link)
  const contentType = headRes.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    // If it's Google Drive, it might be the rate-limit page
    if (isGoogleDrive) {
      throw new Error(
        'Google Drive file is rate-limited. Try again in 24 hours.',
      );
    }
    // Generic HTML response
    throw new Error(
      'URL links to a webpage, not a media file. Provide a direct link.',
    );
  }

  if (!headRes.ok) {
    if (headRes.status === 404) {
      throw new Error('Media file not found. Check the URL.');
    } else if (headRes.status === 403) {
      throw new Error(
        'Access denied. The link may have expired or requires authentication.',
      );
    } else {
      throw new Error(`Unable to access file (HTTP ${headRes.status}).`);
    }
  }

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

  let fileBuffer: Uint8Array;

  // Strategy: "Turbo Mode" vs "Eco Mode"
  // If the server respects Range (206), we use native arrayBuffer for speed.
  // If the server ignores Range (200), we use a safe, pre-allocated stream reader to prevent OOM.
  if (response.status === 206) {
    console.log(
      '[Analyze] Server accepted Range request (206). Using native optimized buffer.',
    );
    const arrayBuffer = await response.arrayBuffer();
    fileBuffer = new Uint8Array(arrayBuffer);
  } else {
    // Status 200: Server is sending the FULL file.
    // We cannot use arrayBuffer() because it would try to load the entire file (e.g. 2GB) and crash.
    // We must stream it manually, but efficiently.
    console.warn(
      '[Analyze] Server ignored Range request (200). Using fallback stream reader with 10MB limit.',
    );

    const SAFE_LIMIT = 10 * 1024 * 1024; // 10MB "Eco Mode" limit
    const tempBuffer = new Uint8Array(SAFE_LIMIT); // Pre-allocate: Zero GC overhead
    let offset = 0;

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to retrieve response body stream');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const spaceLeft = SAFE_LIMIT - offset;

        if (value.byteLength > spaceLeft) {
          // Buffer full: Copy what fits, then stop.
          tempBuffer.set(value.subarray(0, spaceLeft), offset);
          offset += spaceLeft;
          console.log(
            `[Analyze] Hit safe limit of ${SAFE_LIMIT} bytes. Cancelling stream.`,
          );
          await reader.cancel();
          break;
        } else {
          tempBuffer.set(value, offset);
          offset += value.byteLength;
        }
      }
    } catch (err) {
      console.warn('[Analyze] Stream reading interrupted or failed:', err);
    }

    // Create a view of the actual data we read (no copy)
    fileBuffer = tempBuffer.subarray(0, offset);
  }

  console.log(`[Analyze] Loaded ${fileBuffer.byteLength} bytes into memory.`);

  return {
    buffer: fileBuffer,
    filename,
    fileSize,
  };
}
