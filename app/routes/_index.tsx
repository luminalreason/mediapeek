import { useEffect, useState } from 'react';
import type { MetaFunction } from 'react-router';

import { MediaForm } from '../components/media-form';

export const meta: MetaFunction = () => {
  return [
    { title: 'MediaPeek' },
    {
      name: 'description',
      content:
        'Analyze media files directly in your browser using Cloudflare Workers proxy and MediaInfo.js',
    },
  ];
};

export default function Index() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-start px-4 pt-4 lg:px-8">
        {isClient ? (
          <MediaForm />
        ) : (
          <div className="flex w-full max-w-3xl animate-pulse flex-col gap-8 py-8">
            <div className="rouded-lg bg-muted/20 h-32 w-full" />
            <div className="bg-muted/20 h-64 w-full rounded-lg" />
          </div>
        )}
      </main>
      <footer className="bg-muted/50 border-t backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <p className="text-muted-foreground text-center text-sm font-medium">
            Copyright &copy; {new Date().getFullYear()} MediaPeek. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
