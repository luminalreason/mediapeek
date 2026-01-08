import MediaInfoFactory from '~/lib/mediaInfoFactory';

export interface MediaInfoResult {
  [key: string]: string;
}

export type MediaInfoFormat = 'object' | 'Text' | 'XML' | 'HTML';

export async function analyzeMediaBuffer(
  fileBuffer: Uint8Array,
  fileSize: number,
  filename: string,
  requestedFormats: string[] = [],
): Promise<MediaInfoResult> {
  const readChunk = async (size: number, offset: number) => {
    if (offset >= fileBuffer.byteLength) {
      return new Uint8Array(0);
    }
    const end = Math.min(offset + size, fileBuffer.byteLength);
    return fileBuffer.subarray(offset, end);
  };

  const shouldGenerateAll =
    requestedFormats.includes('all') || requestedFormats.length === 0;

  const allFormats: { type: MediaInfoFormat; key: string }[] = [
    { type: 'object', key: 'json' },
    { type: 'Text', key: 'text' },
    { type: 'XML', key: 'xml' },
    { type: 'HTML', key: 'html' },
  ];

  const formatsToGenerate = allFormats.filter(
    (f) =>
      shouldGenerateAll ||
      requestedFormats.includes(f.key) ||
      requestedFormats.includes(f.type.toLowerCase()),
  );

  const results: Record<string, string> = {};

  // Generate formats sequentially to save memory/CPU
  // Default to JSON if no format specified effectively
  if (formatsToGenerate.length === 0) {
    formatsToGenerate.push({ type: 'object', key: 'json' });
  }

  let infoInstance;
  try {
    // Initialize MediaInfo once
    // Use the first requested format as initial, or fallback to JSON
    const initialFormat = formatsToGenerate[0]?.type || 'object';

    let wasmModule;
    try {
      // @ts-expect-error - Missing types for WASM import
      const imported = await import('../wasm/MediaInfoModule.wasm');
      wasmModule = imported.default;
    } catch (err) {
      console.warn('Failed to load WASM module dynamically:', err);
    }

    infoInstance = await MediaInfoFactory({
      format:
        initialFormat === 'Text'
          ? 'text'
          : (initialFormat as 'object' | 'XML' | 'HTML' | 'text'),
      coverData: false,
      full: false, // Initial setting, will be overridden in the loop
      chunkSize: 5 * 1024 * 1024,
      wasmModule,
      locateFile: () => 'ignored',
    });

    for (const { type, key } of formatsToGenerate) {
      try {
        // Use 'text' (lowercase) for Text view to match MediaInfo expectation
        const formatStr = type === 'Text' ? 'text' : type;

        infoInstance.options.format = formatStr as 'object';
        // Enable full output (internal tags) only for object/JSON view
        infoInstance.options.full = Boolean(type === 'object');

        infoInstance.reset();

        // For 'object' format, analyzeData returns the result directly.
        // For others, we need to call inform().
        const resultData = await infoInstance.analyzeData(
          () => fileSize,
          readChunk,
        );
        let resultStr = '';

        if (type !== 'object') {
          resultStr = infoInstance.inform();
        }

        if (type === 'object') {
          try {
            const json = resultData;

            if (json && json.media && json.media.track) {
              const generalTrack = json.media.track.find(
                (t: Record<string, unknown>) => t['@type'] === 'General',
              );
              if (generalTrack) {
                if (
                  !generalTrack['CompleteName'] &&
                  !generalTrack['Complete_name'] &&
                  !generalTrack['File_Name']
                ) {
                  generalTrack['CompleteName'] = filename;
                }
              }
            }
            results[key] = JSON.stringify(json, null, 2);
          } catch (e) {
            console.warn('Failed to process object result:', e);
            results[key] = '{}';
          }
        } else if (type === 'Text') {
          if (!resultStr.includes('Complete name')) {
            // Injection logic for text
            const lines = resultStr.split('\n');
            const generalIndex = lines.findIndex((l: string) =>
              l.trim().startsWith('General'),
            );
            if (generalIndex !== -1) {
              let insertIndex = generalIndex + 1;
              for (let i = generalIndex + 1; i < lines.length; i++) {
                if (lines[i].trim().startsWith('Unique ID')) {
                  insertIndex = i + 1;
                  break;
                }
                if (lines[i].trim() === '') break;
              }
              const padding = ' '.repeat(41 - 'Complete name'.length);
              lines.splice(
                insertIndex,
                0,
                `Complete name${padding}: ${filename}`,
              );
              resultStr = lines.join('\n');
            }
          }
          results[key] = resultStr;
        } else {
          results[key] = resultStr;
        }
      } catch (err) {
        console.error(`Failed to generate ${type}:`, err);
        results[key] = `Error generating ${type} view.`;
      }
    }
  } catch (error) {
    console.error('MediaInfo Analysis execution failed:', error);
    throw error;
  } finally {
    if (infoInstance) {
      infoInstance.close();
    }
  }

  return results;
}
