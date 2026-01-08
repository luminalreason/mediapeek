'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import type { MediaInfoJSON } from '~/types/media';

import { AccessibilitySection } from './media-view/accessibility-section';
import { AudioSection } from './media-view/audio-section';
import { ChapterSection } from './media-view/chapter-section';
import { GeneralSection } from './media-view/general-section';
import { LibrarySection } from './media-view/library-section';
import { MediaHeader } from './media-view/media-header';
import { SubtitleSection } from './media-view/subtitle-section';
import { VideoSection } from './media-view/video-section';

interface MediaViewProps {
  data: Record<string, string>;
  url: string;
}

export function MediaView({ data, url }: MediaViewProps) {
  const [isTextView, setIsTextView] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Reset scroll when toggling view mode, but only if we've scrolled past the header
  useEffect(() => {
    if (!containerRef.current) return;

    // Calculate the absolute top position of the container
    const { top } = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const absoluteTop = top + scrollTop;

    // Only scroll if we are deeper than the container start
    // This allows the sticky header to "stick" at the top without jumping to page 0
    if (scrollTop > absoluteTop) {
      window.scrollTo({ top: absoluteTop, behavior: 'instant' });
    }
  }, [isTextView]);

  const { track: parsedData, creatingLibrary } = useMemo(() => {
    try {
      const jsonStr = data.json;
      if (!jsonStr) return { track: null, creatingLibrary: undefined };
      const json = JSON.parse(jsonStr) as MediaInfoJSON;
      if (!json.media || !json.media.track)
        return { track: null, creatingLibrary: undefined };
      return {
        track: json.media.track,
        creatingLibrary: json.creatingLibrary,
      };
    } catch {
      console.error('Failed to parse JSON');
      return { track: null, creatingLibrary: undefined };
    }
  }, [data]);

  if (!parsedData) {
    return (
      <div className="text-destructive rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
        <p className="font-medium">Analysis Error</p>
        <p className="text-sm">Unable to parse analysis data.</p>
        <pre className="mt-2 overflow-x-auto text-xs whitespace-pre-wrap opacity-70">
          {data.json || 'No JSON data'}
        </pre>
      </div>
    );
  }

  const General = parsedData.find((t) => t['@type'] === 'General');
  const VideoTracks = parsedData.filter((t) => t['@type'] === 'Video');
  const AudioTracks = parsedData.filter((t) => t['@type'] === 'Audio');
  const TextTracks = parsedData.filter((t) => t['@type'] === 'Text');
  const MenuTrack = parsedData.find((t) => t['@type'] === 'Menu');

  return (
    <div
      ref={containerRef}
      className="animate-in fade-in mx-auto w-full max-w-5xl space-y-6 pb-20"
    >
      <MediaHeader
        url={url}
        generalTrack={General}
        videoTracks={VideoTracks}
        audioTracks={AudioTracks}
        textTracks={TextTracks}
        isTextView={isTextView}
        setIsTextView={setIsTextView}
        rawData={data}
      />

      {isTextView ? (
        <div className="animate-in fade-in duration-300">
          <motion.div
            layout
            initial={false}
            animate={{
              borderRadius: isFullScreen ? 0 : '0.5rem',
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className={cn(
              'bg-muted/30 border-border/50 overflow-hidden border transition-colors',
              isFullScreen
                ? 'bg-background fixed inset-0 z-50 h-screen w-screen'
                : 'rounded-lg',
            )}
          >
            <motion.div
              layout="position"
              className="bg-muted/50 border-border/50 flex items-center justify-between border-b px-4 py-2"
            >
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                TEXT Output
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-background/50 h-6 px-2 text-xs"
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Full Screen'}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                    Minimize
                  </>
                ) : (
                  <>
                    <Maximize2 className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                    Maximize
                  </>
                )}
              </Button>
            </motion.div>
            <motion.pre
              layout
              key={isFullScreen ? 'fullscreen' : 'minimized'}
              initial={{ filter: 'blur(10px)', opacity: 0 }}
              animate={{ filter: 'blur(0px)', opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={cn(
                'overflow-x-auto p-4 font-mono text-xs leading-relaxed whitespace-pre sm:text-base sm:whitespace-pre-wrap',
                isFullScreen
                  ? 'h-[calc(100vh-42px)] max-w-none'
                  : 'max-w-[calc(100vw-3rem)] sm:max-w-none',
              )}
            >
              {data.text || 'No text data available.'}
            </motion.pre>
          </motion.div>
        </div>
      ) : (
        <div className="animate-in fade-in space-y-6 duration-300">
          <GeneralSection generalTrack={General} />
          <VideoSection videoTracks={VideoTracks} />
          <AudioSection audioTracks={AudioTracks} />
          <SubtitleSection textTracks={TextTracks} />
          <ChapterSection menuTrack={MenuTrack} />
          <AccessibilitySection
            generalTrack={General}
            audioTracks={AudioTracks}
            textTracks={TextTracks}
          />
          <LibrarySection
            library={creatingLibrary}
            generalTrack={General}
            videoTracks={VideoTracks}
            audioTracks={AudioTracks}
            textTracks={TextTracks}
          />
        </div>
      )}
    </div>
  );
}
