import { Input } from '@base-ui/react/input';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { analyzeMedia } from '../services/mediainfo';
import { FormatMenu } from './format-menu';

// Apple-style Activity Indicator (simple spinner for now, can be SVG)
function ActivityIndicator() {
  return (
    <span className="relative flex h-5 w-5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-20"></span>
      <span className="relative inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
    </span>
  );
}

// Separate component to utilize useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <motion.button
      type="submit"
      disabled={pending}
      // Fix: Explicitly define starting color in style prop as HEX so motion can interpolate
      style={{ backgroundColor: '#2563eb' }} // blue-600
      whileHover={{ scale: 1.01, backgroundColor: '#4338ca' }} // indigo-700
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-2xl py-4 text-lg font-semibold text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-3">
          <ActivityIndicator />
          <span>Processing...</span>
        </span>
      ) : (
        'Get Info'
      )}
    </motion.button>
  );
}

// Initial state for the action
type FormState = {
  result: string | null;
  error: string | null;
  status: string;
  url?: string;
};

const initialState: FormState = {
  result: null,
  error: null,
  status: '',
};

export function MediaForm() {
  const [realtimeStatus, setRealtimeStatus] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('text');

  const [state, formAction, isPending] = useActionState(
    async (_prevState: FormState, formData: FormData): Promise<FormState> => {
      const url = formData.get('url') as string;
      if (!url) {
        return { result: null, error: 'URL is required', status: '' };
      }

      setRealtimeStatus('Connecting...');
      try {
        const format = (formData.get('format') as string) || 'text';
        const result = await analyzeMedia(
          url,
          () => {},
          (s) => setRealtimeStatus(s),
          format,
        );
        // Haptic Feedback on Success (Standard Web Vibration API)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
        return { result, error: null, status: 'Done', url };
      } catch (err) {
        // Haptic Feedback on Error
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([50, 100, 50]);
        }
        return {
          result: null,
          error: err instanceof Error ? err.message : 'Failed',
          status: 'Failed',
          url,
        };
      }
    },
    initialState,
  );

  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center p-2 md:p-4">
      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} // Apple-native ease
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl p-5 sm:p-12"
      >
        <div className="relative z-10 space-y-10">
          {/* Header - Left Aligned & Apple Typography */}
          <div className="space-y-2 text-left">
            <h1 className="text-4xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-5xl">
              MediaPeek
            </h1>
            <p className="max-w-md text-lg font-normal text-gray-400">
              Instant remote metadata analysis.
            </p>
          </div>

          <form action={formAction} className="space-y-8">
            <div className="space-y-3">
              <label
                htmlFor="media-url"
                className="ml-1 text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Media URL
              </label>
              <div className="group relative">
                <Input
                  id="media-url"
                  name="url"
                  className="w-full rounded-2xl border-none bg-white/10 px-5 py-4 text-lg font-medium tracking-wide text-white placeholder-white/40 transition-colors outline-none focus:bg-white/20 focus:ring-0"
                  placeholder="https://example.com/movie.mkv"
                  autoComplete="off"
                  // Fix: Ensure controlled/uncontrolled consistency
                  defaultValue={state.url || ''}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <FormatMenu
                  value={selectedFormat}
                  onChange={setSelectedFormat}
                />
                <input type="hidden" name="format" value={selectedFormat} />
              </div>
              <SubmitButton />
            </div>
          </form>

          {/* Status Indicator (Apple Style: Subtle, inline) */}
          {(isPending || state.error) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden rounded-xl bg-white/5 px-4 py-3 backdrop-blur-md"
            >
              <p
                className={clsx(
                  'text-sm font-medium',
                  state.error ? 'text-red-400' : 'text-gray-300',
                )}
              >
                {state.error ? state.error : realtimeStatus}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Result Card */}
      {state.result && !isPending && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mt-8 w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl"
        >
          <div className="p-8">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-semibold text-white">Metadata</h2>
              {/* Badge removed for cleaner HIG focus/selection look */}
            </div>
            <pre className="scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent max-h-[600px] overflow-auto font-mono text-xs leading-relaxed whitespace-pre text-gray-300 sm:text-sm md:whitespace-pre-wrap">
              {state.result}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
}
