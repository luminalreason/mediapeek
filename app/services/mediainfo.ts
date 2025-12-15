import type { MediaInfo, ReadChunkFunc } from 'mediainfo.js';

// type MediaInfoCallback removed as it was unused

// We need to define the type for the MediaInfo factory function
// strictly speaking it's on window or imported, but for dynamic import:
type MediaInfoFactory = (opts: {
  format: 'text' | 'json' | 'object' | 'XML' | 'MAXML' | 'HTML' | string;
  coverData: boolean;
  full: boolean;
  locateFile?: (path: string, prefix: string) => string;
}) => Promise<MediaInfo>;

export async function analyzeMedia(
  url: string,
  onResult: (text: string) => void,
  onStatus: (status: string) => void,
  format: string = 'text',
): Promise<string> {
  // --- 1. Validation Phase ---
  onStatus('Validating URL...');

  const SUPPORTED_EXTENSIONS = {
    video: [
      'mkv',
      'mp4',
      'avi',
      'mov',
      'webm',
      'flv',
      'wmv',
      'm4v',
      '3gp',
      'ts',
      'mts',
      'm2ts',
      'vob',
      'ogv',
    ],
    audio: [
      'mp3',
      'wav',
      'aac',
      'flac',
      'ogg',
      'm4a',
      'wma',
      'alac',
      'opus',
      'mid',
      'midi',
    ],
    image: [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'webp',
      'svg',
      'tiff',
      'ico',
      'heic',
    ],
  };

  // Helper to extract filename from Content-Disposition
  const getFilenameFromHeader = (header: string | null): string | null => {
    if (!header) return null;
    const matches = /filename="?([^"]+)"?/.exec(header);
    return matches ? matches[1] : null;
  };

  // Perform HEAD request for validation
  const response = await fetch(
    `/resources/proxy?url=${encodeURIComponent(url)}`,
    { method: 'HEAD' },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch metadata (HEAD): ${response.status} ${response.statusText}`,
    );
  }

  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = getFilenameFromHeader(contentDisposition);

  if (!filename) {
    // If no filename in header, maybe try URL path?
    // The user specifically asked to check Content-Disposition "because it will easily tell".
    // If it's missing, we might want to strict fail or fallback.
    // Strict fail seems safer based on "we must check... content-disposition".
    throw new Error(
      'Cannot determine filename. Server must provide "Content-Disposition" header with a filename.',
    );
  }

  const extension = filename.split('.').pop()?.toLowerCase();

  if (!extension) {
    throw new Error(
      `Cannot determine file extension from filename: "${filename}"`,
    );
  }

  const isVideo = SUPPORTED_EXTENSIONS.video.includes(extension);
  const isAudio = SUPPORTED_EXTENSIONS.audio.includes(extension);
  const isImage = SUPPORTED_EXTENSIONS.image.includes(extension);

  if (!isVideo && !isAudio && !isImage) {
    throw new Error(
      `Unsupported file type: ".${extension}". Only Video, Audio, and Image files are allowed.`,
    );
  }

  onStatus(`Detected valid file: ${filename}`);

  // --- 2. Dynamic Import & Setup ---
  onStatus('Loading MediaInfo WASM...');
  const mediainfoModule = await import('mediainfo.js');
  // mediainfoModule.default or mediainfoModule check
  const mediaInfoFactory = (mediainfoModule.default ||
    mediainfoModule) as unknown as MediaInfoFactory;

  const mediainfo = await mediaInfoFactory({
    format: format, // 'format' is string, and MediaInfoFactory accepts string
    coverData: false,
    full: false, // Set to false to avoid deep scan/parsing of all frames
    locateFile: () => '/MediaInfoModule.wasm',
  });

  try {
    let fileSize = 0;
    let cache: { start: number; data: Uint8Array } | null = null;
    const PREFETCH_SIZE = 2 * 1024 * 1024; // 2MB chunk size for prefetching

    const getSize = async (): Promise<number> => {
      // Reuse the size from the validation response if possible?
      // The validation response body is already consumed/closed (HEAD has no body),
      // but we have the headers from 'response'.
      // Let's use the headers we already fetched to avoid a second network request!
      const contentLength = response.headers.get('Content-Length');
      if (!contentLength) {
        throw new Error('Content-Length header missing');
      }
      const size = parseInt(contentLength, 10);
      fileSize = size;
      onStatus(`File size: ${(size / (1024 * 1024)).toFixed(2)} MB`);
      return size;
    };

    const readChunk: ReadChunkFunc = async (
      size: number,
      offset: number,
    ): Promise<Uint8Array> => {
      // Check cache first
      if (
        cache &&
        offset >= cache.start &&
        offset + size <= cache.start + cache.data.byteLength
      ) {
        // onStatus(`Reading from cache: ${offset}-${offset + size}`);
        const startIdx = offset - cache.start;
        return cache.data.subarray(startIdx, startIdx + size);
      }

      // Calculate fetch size (prefetch)
      // If requested size is larger than prefetch, fetch what's needed.
      // Otherwise fetch prefetch size, but don't exceed fileSize.
      let fetchSize = Math.max(size, PREFETCH_SIZE);
      if (fileSize > 0 && offset + fetchSize > fileSize) {
        fetchSize = fileSize - offset;
      }

      // If the remaining data is tiny or invalid, just fetch what is asked
      if (fetchSize < size) fetchSize = size;

      onStatus(
        `Net Fetch: ${offset}-${offset + fetchSize} (${(
          fetchSize /
          1024 /
          1024
        ).toFixed(2)} MB)...`,
      );

      const response = await fetch(
        `/resources/proxy?url=${encodeURIComponent(url)}`,
        {
          method: 'GET',
          headers: {
            Range: `bytes=${offset}-${offset + fetchSize - 1}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status !== 206) {
          throw new Error(
            `Expected Partial Content (206) but got ${response.status}. Upstream might not support Range requests.`,
          );
        }
      } else if (response.status === 200) {
        throw new Error(
          'Upstream returned 200 OK (Full File) instead of 206 Partial Content. Aborting to prevent full download.',
        );
      }

      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);

      // Update cache
      cache = {
        start: offset,
        data: data,
      };

      // Return the requested slice from the newly fetched data
      // fetchSize >= size, so 0 to size
      return data.subarray(0, size);
    };

    onStatus('Starting analysis...');
    const result = await mediainfo.analyzeData(getSize, readChunk);

    if (typeof result === 'string') {
      // "text", "HTML", "XML" return string
      onResult(result);
      onStatus('Analysis complete!');
      return result;
    } else {
      // JSON or object return object
      const json = JSON.stringify(result, null, 2);
      onResult(json);
      onStatus('Analysis complete!');
      return json;
    }
  } catch (error) {
    console.error('MediaInfo analysis failed:', error);
    throw error;
  } finally {
    mediainfo.close();
  }
}
