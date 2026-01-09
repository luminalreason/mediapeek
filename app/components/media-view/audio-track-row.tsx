import { Badge } from '~/components/ui/badge';
import {
  cleanBitrateString,
  cleanMetadataString,
  cleanRedundantAudioTitle,
  cleanTrackTitle,
  formatAudioChannels,
} from '~/lib/formatters';
import type { MediaTrackJSON } from '~/types/media';

interface AudioTrackRowProps {
  track: MediaTrackJSON;
  trackNumber: string | undefined;
  showTrackNumber: boolean;
}

export function AudioTrackRow({
  track,
  trackNumber,
  showTrackNumber,
}: AudioTrackRowProps) {
  const langName = track['Language_String'] || track['Language'] || 'Unknown';
  const title = cleanRedundantAudioTitle(
    cleanTrackTitle(track['Title'], langName),
  );

  const channelsStr =
    formatAudioChannels(track['Channels'], track['ChannelPositions']) ||
    track['Channel(s)_String'] ||
    track['Channels_String'] ||
    track['Channel(s)'] ||
    track['Channels'];
  let channels = String(channelsStr);
  if (track.extra?.NumberOfDynamicObjects) {
    channels += ` with ${track.extra.NumberOfDynamicObjects} Objects`;
  }

  const commercial = cleanMetadataString(track['Format_Commercial_IfAny']);
  const info = track['Format_Info'];
  const rawFormat = cleanMetadataString(track['Format']);
  const codecInfo = track['CodecID_Info'];

  // Prioritize CodecID_Info if available
  const format = codecInfo || commercial || info || rawFormat;
  const subFormat = commercial && info ? info : undefined;

  const renderBadges = () => {
    return (
      <>
        {track['Default'] === 'Yes' && (
          <Badge className="border border-emerald-500/20 bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400">
            Default
          </Badge>
        )}
        {track['Forced'] === 'Yes' && (
          <Badge className="border border-amber-500/20 bg-amber-500/15 text-[10px] text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/20 dark:text-amber-400">
            Forced
          </Badge>
        )}
      </>
    );
  };

  const techDetails = [
    {
      label: 'Format',
      value: (track['Format_String'] ||
        track['Format_Commercial'] ||
        track['Format']) as string,
    },
    {
      label: 'Format Mode',
      value: track['Format_Settings_Mode'],
    },
    {
      label: 'Bitrate',
      value: cleanBitrateString(
        (track['BitRate_String'] || track['BitRate_Maximum_String']) as string,
      ),
      sub: (track['BitRate_Mode_String'] || track['BitRate_Mode']) as string,
    },
    {
      label: 'Sample Rate',
      value: track['SamplingRate_String'] || `${track['SamplingRate']} Hz`,
    },
    {
      label: 'Bit Depth',
      value:
        track['BitDepth_String'] ||
        (track['BitDepth'] ? `${track['BitDepth']}-bit` : undefined),
    },
    {
      label: 'Delay',
      value: (() => {
        const d = track['Delay'];
        const sd = track.extra?.Source_Delay;
        if (d && d !== '0' && d !== '0.000') return `${d}ms`;
        if (sd && sd !== '0' && sd !== '0.000') return `${sd}ms`;
        return undefined;
      })(),
      sub: (() => {
        const d = track['Delay'];
        const sd = track.extra?.Source_Delay;
        // If primary delay exists, we don't show source.
        // If primary is empty/0, and we use source delay, show its source if available.
        if (
          (!d || d === '0' || d === '0.000') &&
          sd &&
          sd !== '0' &&
          sd !== '0.000'
        ) {
          return track.extra?.Source_Delay_Source;
        }
        return undefined;
      })(),
    },
    {
      label: 'Dialogue Intelligence',
      value:
        track.extra?.dialnorm_String ||
        (track.extra?.dialnorm ? `${track.extra.dialnorm} dB` : undefined),
    },
    {
      label: 'Bed Layout',
      value: (track['BedChannelConfiguration'] ||
        track.extra?.['BedChannelConfiguration']) as string,
      sub: (track['BedChannelCount_String'] ||
        track.extra?.['BedChannelCount_String']) as string,
    },
    {
      label: 'Compression',
      value: (track['Compression_Mode_String'] ||
        cleanMetadataString(track['Compression_Mode'])) as string,
    },
    {
      label: 'Encoded Library',
      value: (track['Encoded_Library_String'] ||
        track['Encoded_Library']) as string,
    },
  ].filter((item) => item.value);

  return (
    <div className="bg-muted/10 border-muted/20 hover:bg-muted/20 flex flex-col items-start gap-2 rounded-lg border p-4 transition-colors sm:flex-row sm:gap-4">
      {/* Mobile Header: Track Number + Badges */}
      <div className="flex w-full items-start justify-between sm:hidden">
        {showTrackNumber && (
          <span className="text-muted-foreground pt-0.5 text-xs font-medium">
            {trackNumber}
          </span>
        )}
        <div className="flex flex-wrap justify-end gap-1.5 align-top">
          {renderBadges()}
        </div>
      </div>

      {/* Desktop Track Number Column */}
      {showTrackNumber && (
        <span className="text-muted-foreground hidden pt-0.5 text-xs font-medium sm:block">
          {trackNumber}
        </span>
      )}

      <div className="flex flex-1 flex-col gap-4">
        {/* Header Zone: Identity */}
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-foreground text-base font-semibold">
                {langName}
              </span>
              <span className="text-muted-foreground text-sm">
                ({channels})
              </span>
            </div>
            <div className="hidden flex-wrap justify-end gap-1.5 align-top sm:flex">
              {renderBadges()}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground/90 text-sm font-medium">
                {format}
                {subFormat && format !== subFormat && (
                  <span className="text-muted-foreground ml-1 font-normal">
                    {subFormat}
                  </span>
                )}
              </span>
              {track['ChannelLayout'] && (
                <span className="text-muted-foreground font-mono text-xs">
                  {track['ChannelLayout']}
                </span>
              )}
            </div>

            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              {title && <span>{title}</span>}
            </div>
          </div>
        </div>

        {/* Tech Specs Zone: Grid */}
        {techDetails.length > 0 && (
          <div className="grid grid-cols-2 gap-x-2 gap-y-3 border-t pt-2 md:grid-cols-4 md:gap-4">
            {techDetails.map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-muted-foreground/70 text-[10px] tracking-wider uppercase">
                  {item.label}
                </span>
                <span className="text-foreground/85 text-sm font-medium">
                  {item.value}
                  {item.sub && (
                    <span className="text-muted-foreground/60 ml-1.5 font-sans text-xs font-normal">
                      {item.sub}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
