import type { MediaTrackJSON } from '~/types/media';

/**
 * Calculates the bitrate from various possible fields in the track or falls back to general track.
 */
export const getBitrate = (
  videoTrack: MediaTrackJSON,
  generalTrack?: MediaTrackJSON,
): string | null | undefined => {
  if (videoTrack['BitRate']) return videoTrack['BitRate'];
  if (videoTrack['BitRate_Measured']) return videoTrack['BitRate_Measured'];
  if (videoTrack['BitRate_Maximum']) return videoTrack['BitRate_Maximum'];
  if (videoTrack['BitRate_Nominal']) return videoTrack['BitRate_Nominal'];
  // Fallback to OverallBitRate from General if available
  if (generalTrack && generalTrack['OverallBitRate'])
    return generalTrack['OverallBitRate'];
  return null;
};

/**
 * Calculates Bits/(Pixel*Frame)
 */
export const calculateBitsPerPixel = (
  videoTrack: MediaTrackJSON,
  generalTrack?: MediaTrackJSON,
): string | null => {
  const w = parseInt(videoTrack['Width'] || '0', 10);
  const h = parseInt(videoTrack['Height'] || '0', 10);
  const fps = parseFloat(videoTrack['FrameRate'] || '0');
  const brStr = getBitrate(videoTrack, generalTrack);
  const br = parseInt(brStr || '0', 10);

  if (w > 0 && h > 0 && fps > 0 && br > 0) {
    return (br / (w * h * fps)).toFixed(3);
  }
  return null;
};

/**
 * Checks if the filename indicates an Apple TV source.
 */
export const isAppleTvFilename = (filename: string): boolean => {
  const normalized = filename.toLowerCase();
  return (
    normalized.includes('aptv') ||
    normalized.includes('atvp') ||
    normalized.includes('apple tv+') ||
    normalized.includes('apple tv')
  );
};

/**
 * Derived accessibility feature flags.
 */
export interface AccessibilityFeatures {
  hasSDH: boolean;
  hasCC: boolean;
  hasAD: boolean;
}

/**
 * Detects accessibility features present in the tracks.
 */
export const getAccessibilityFeatures = (
  audioTracks: MediaTrackJSON[],
  textTracks: MediaTrackJSON[],
  generalTrack?: MediaTrackJSON,
): AccessibilityFeatures => {
  // Subtitle Tech (SDH & CC)
  const hasSDH = textTracks.some((t) => (t['Title'] || '').includes('SDH'));

  const hasCC =
    textTracks.some((t) => {
      const title = (t['Title'] || '').toLowerCase();
      const format = (t['Format'] || '').toLowerCase();
      return (
        title.includes('cc') ||
        title.includes('closed captions') ||
        format.includes('closed captions')
      );
    }) ||
    // Apple TV Check
    (() => {
      if (!generalTrack) return false;
      const fileName = (
        generalTrack['File_Name'] ||
        generalTrack['CompleteName'] || // Fallback
        ''
      ).toLowerCase();

      if (!isAppleTvFilename(fileName)) return false;

      // If Apple TV, check for SRT, tx3g, or UTF-8 text tracks
      return textTracks.some((t) => {
        const format = (t['Format'] || '').toLowerCase();
        const codecID = (t['CodecID'] || '').toLowerCase();
        return (
          format.includes('srt') ||
          format.includes('subrip') ||
          format.includes('timed text') ||
          format.includes('utf-8') ||
          codecID.includes('tx3g') ||
          codecID.includes('utf8')
        );
      });
    })();

  // Audio Description (AD)
  const hasAD = audioTracks.some((a) => {
    const title = (a['Title'] || '').toLowerCase();
    const serviceKind = (a['ServiceKind'] || '').toLowerCase();
    return (
      title.includes('ad') ||
      title.includes('audio description') ||
      serviceKind.includes('audio description') ||
      serviceKind.includes('visually impaired')
    );
  });

  return { hasSDH, hasCC, hasAD };
};
