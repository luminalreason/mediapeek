import { Badge } from '~/components/ui/badge';
import { cleanTrackTitle } from '~/lib/formatters';
import type { MediaTrackJSON } from '~/types/media';

interface SubtitleTrackRowProps {
  track: MediaTrackJSON;
}

export function SubtitleTrackRow({ track }: SubtitleTrackRowProps) {
  const langName = track['Language_String'] || track['Language'] || 'Unknown';
  const title = track['Title'];
  const format = track['Format_Info'] || track['Format'];
  const codecId = track['CodecID'];

  const displayTitle = cleanTrackTitle(title, langName);

  const isForcedTitle =
    title && title.toLowerCase() === `${langName} (Forced)`.toLowerCase();

  const showTitle =
    displayTitle &&
    displayTitle.length > 0 &&
    displayTitle.toLowerCase() !== langName.toLowerCase() &&
    !(isForcedTitle && track['Forced'] === 'Yes');

  let displayFormat = track['CodecID_Info'] || format;
  if (!displayFormat && codecId && format) {
    displayFormat = `${format} (${codecId})`;
  } else if (!displayFormat && codecId) {
    displayFormat = codecId;
  }

  const renderBadges = () => (
    <>
      {track['Default'] === 'Yes' && (
        <Badge className="h-5 border border-emerald-500/20 bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400">
          Default
        </Badge>
      )}
      {track['Forced'] === 'Yes' && (
        <Badge className="h-5 border border-amber-500/20 bg-amber-500/15 text-[10px] text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/20 dark:text-amber-400">
          Forced
        </Badge>
      )}
    </>
  );

  return (
    <div className="bg-muted/10 border-border/40 flex items-center justify-between rounded-md border p-3">
      <div className="flex items-start gap-3">
        {/* Track Number Column */}
        <span className="text-muted-foreground pt-0.5 text-xs font-medium">
          {track['@typeorder']}
        </span>

        {/* Content Column */}
        <div className="flex flex-col gap-0.5">
          {/* Line 1: Language Name */}
          <span className="text-foreground/85 text-sm font-semibold">
            {langName}
          </span>

          {/* Line 2: Track Title */}
          {showTitle && (
            <span className="text-muted-foreground text-xs">
              {displayTitle}
            </span>
          )}

          {/* Line 3: Format */}
          <span className="text-muted-foreground/70 text-xs tracking-wide">
            {displayFormat}
          </span>
        </div>
      </div>
      <div className="flex gap-1.5 self-center">{renderBadges()}</div>
    </div>
  );
}
