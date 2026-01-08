import { CopyMenu } from '~/components/copy-menu';
import { ShareMenu } from '~/components/share-menu';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { Switch } from '~/components/ui/switch';
import { getMediaBadges } from '~/lib/media-utils';
import type { MediaTrackJSON } from '~/types/media';

import { MediaIcon } from './media-icon';

interface MediaHeaderProps {
  generalTrack?: MediaTrackJSON;
  videoTracks: MediaTrackJSON[];
  audioTracks: MediaTrackJSON[];
  textTracks: MediaTrackJSON[];
  isTextView: boolean;
  setIsTextView: (val: boolean) => void;
  rawData: Record<string, string>;
  url: string;
}

export function MediaHeader({
  generalTrack,
  videoTracks,
  audioTracks,
  textTracks,
  isTextView,
  setIsTextView,
  rawData,
  url,
}: MediaHeaderProps) {
  if (!generalTrack) return null;

  // 1. Resolutions, Audio, Subtitle Badges
  const filenameRaw =
    (generalTrack['CompleteName'] as string) ||
    (generalTrack['File_Name'] as string) ||
    'Unknown';
  // Extract basename
  const displayFilename =
    filenameRaw.split('/').pop()?.split('\\').pop() || filenameRaw;

  const headerIcons = getMediaBadges(
    videoTracks,
    audioTracks,
    textTracks,
    generalTrack,
  );

  const fileSize =
    generalTrack['FileSize_String'] ||
    (generalTrack['FileSize/String'] as string) ||
    (generalTrack['FileSize'] as string);
  const duration =
    generalTrack['Duration_String'] ||
    (generalTrack['Duration/String'] as string) ||
    (generalTrack['Duration'] as string);

  return (
    <div className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 -mx-4 flex flex-col gap-4 px-4 pt-4 pb-0 backdrop-blur-md transition-all md:-mx-8 md:px-8">
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-xl font-bold tracking-tight break-all md:text-2xl">
          {displayFilename}
        </h1>
        <div className="text-muted-foreground flex w-full flex-wrap items-center gap-4 text-sm">
          {duration && <span>{duration}</span>}
          {fileSize && (
            <>
              <span className="opacity-30">|</span>
              <span>{fileSize}</span>
            </>
          )}

          {/* Header Icons Inline */}
          {headerIcons.length > 0 && (
            <div className="border-border flex items-center gap-3 sm:border-l sm:pl-4">
              {headerIcons.map((icon) => (
                <MediaIcon
                  key={icon}
                  name={icon}
                  className="h-6 w-10 opacity-90 transition-opacity hover:opacity-100"
                />
              ))}
            </div>
          )}

          {/* Copy & Share Menus - Right of Badges */}
          <div className="mt-2 flex w-full shrink-0 flex-wrap items-center justify-start gap-4 sm:mt-0 sm:ml-auto sm:w-auto sm:justify-end">
            <div className="flex items-center space-x-2">
              <Switch
                id="text-mode"
                checked={isTextView}
                onCheckedChange={setIsTextView}
              />
              <Label htmlFor="text-mode" className="text-xs whitespace-nowrap">
                View as Text
              </Label>
            </div>
            <CopyMenu data={rawData} url={url} />
            <ShareMenu data={rawData} url={url} />
          </div>
        </div>
      </div>
      <Separator />
    </div>
  );
}
