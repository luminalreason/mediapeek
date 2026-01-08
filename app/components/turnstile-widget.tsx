import { useEffect, useRef, useState } from 'react';

import { TURNSTILE_SITE_KEY } from '~/lib/constants';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);

  useEffect(() => {
    // Localhost / Development Bypass
    if (import.meta.env.DEV) {
      onVerify('localhost-mock-token');
      return;
    }

    if (!containerRef.current) return;

    // Wait for turnstile to be available
    const checkTurnstile = setInterval(() => {
      if (window.turnstile && containerRef.current) {
        clearInterval(checkTurnstile);
        if (!widgetId) {
          try {
            const id = window.turnstile.render(containerRef.current, {
              sitekey: TURNSTILE_SITE_KEY,
              callback: (token) => {
                onVerify(token);
              },
              'error-callback': () => {
                onError?.();
              },
              'expired-callback': () => {
                onExpire?.();
              },
              theme: 'auto',
            });
            setWidgetId(id);
          } catch (e) {
            console.error('Turnstile render error:', e);
          }
        }
      }
    }, 100);

    return () => {
      clearInterval(checkTurnstile);
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (import.meta.env.DEV) {
    return (
      <div className="text-muted-foreground flex min-h-[65px] min-w-[300px] items-center justify-center rounded-md border border-dashed p-4 text-sm">
        Turnstile Bypassed (Dev Mode)
      </div>
    );
  }

  return <div ref={containerRef} className="min-h-[65px] min-w-[300px]" />;
}
