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
  return (
    <div className="flex min-h-screen flex-col font-sans text-gray-100">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-start px-4 pt-4 lg:px-8">
        <MediaForm />
      </main>
      <footer className="w-full border-t border-white/10 bg-black/20 text-center backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <p className="text-sm font-medium text-gray-400">
            Hosted on{' '}
            <a
              href="https://workers.cloudflare.com/"
              target="_blank"
              rel="noreferrer"
              className="text-orange-400 underline underline-offset-4 transition-colors hover:text-orange-300"
            >
              Cloudflare Workers
            </a>{' '}
            • Powered by{' '}
            <a
              href="https://mediainfo.js.org/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline underline-offset-4 transition-colors hover:text-blue-300"
            >
              MediaInfo WebAssembly
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
