export const mapDolbyProfile = (profile?: string) => {
  if (!profile) return '';
  if (profile.includes('dvhe.08')) return 'Profile 8.1';
  if (profile.includes('dvhe.05')) return 'Profile 5';
  if (profile.includes('dvhe.07')) return 'Profile 7';
  return profile;
};

export const cleanMetadataString = (s: string | undefined): string => {
  if (!s) return '';
  return s.trim();
};

export const cleanBitrateString = (s: string | undefined): string => {
  if (!s) return '';
  // Replace space between digits: "5 844" -> "5844"
  return s.replace(/(\d)\s+(?=\d)/g, '$1');
};

export const cleanTrackTitle = (
  title: string | undefined,
  langName: string | undefined,
): string | null => {
  if (!title || !langName) return null;

  let displayTitle = title;

  // Create list of names to remove
  // Escape special characters for regex
  const escapedName = langName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const langRegex = new RegExp(`\\b${escapedName}\\b`, 'gi');
  displayTitle = displayTitle.replace(langRegex, '');

  displayTitle = displayTitle.trim();

  // Clean up leading/trailing punctuation that might remain (e.g. " (SDH)" -> "(SDH)", ", Title" -> "Title")
  return cleanMetadataString(displayTitle);
};

export const cleanRedundantAudioTitle = (title: string | undefined | null) => {
  if (!title) return null;
  // regex to match "Surround X.X" or "Stereo" (case insensitive)
  const regex = /\b(Surround\s+\d+(\.\d+)?|Stereo)\b/gi;
  const cleaned = title.replace(regex, '').trim();
  return cleanMetadataString(cleaned) || null;
};

export const formatAudioChannels = (
  channels?: number | string,
  positions?: string,
): string => {
  const count = Number(channels);
  if (!channels || isNaN(count)) return '';

  const cleanPositions = (positions || '').toUpperCase();
  const lfeCount = (cleanPositions.match(/\bLFE\d*\b/g) || []).length;

  // Detect height/top channels: Tfl, Tfr, Tbl, Tbr, Tsl, Tsr, Thl, Thr, Tfc, Tbc, Vhl, Vhr, Tc, Tcs
  const heightRegex =
    /\b(TFL|TFR|TBL|TBR|TSL|TSR|THL|THR|TFC|TBC|VHL|VHR|TC|TCS)\b/g;
  const heightCount = (cleanPositions.match(heightRegex) || []).length;

  const mainCount = count - lfeCount - heightCount;

  let layout = `${mainCount}.${lfeCount}`;
  if (heightCount > 0) {
    layout += `.${heightCount}`; // e.g., 5.1.4
  }

  switch (layout) {
    case '1.0':
      return 'Mono';
    case '2.0':
      return 'Stereo';
    default:
      return `${layout} channel`;
  }
};
