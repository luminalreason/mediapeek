import { ChevronDown, ExternalLink, Share } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

import { uploadToPrivateBin } from '../lib/privatebin';

interface ShareMenuProps {
  data: Record<string, string>;
  url: string;
  className?: string;
}

export function ShareMenu({ data, url, className }: ShareMenuProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const fetchedData = useRef<Record<string, string>>({});

  const handleShare = async (format: string, label: string) => {
    let content: string | undefined =
      data[format] || fetchedData.current[format];

    if (!content) {
      // Fetch on demand
      const toastId = toast.loading(`Generating ${label}...`);
      try {
        const response = await fetch(
          `/resource/analyze?url=${encodeURIComponent(url)}&format=${format}`,
        );
        if (!response.ok) throw new Error('Failed to generate format');
        const json = (await response.json()) as {
          results?: Record<string, string>;
        };
        // The API returns { results: { [format]: content } }
        content = json.results?.[format];
        if (!content) throw new Error('No content returned');

        fetchedData.current[format] = content as string;
        toast.dismiss(toastId);
      } catch (err) {
        console.error(err);
        toast.error(`Failed to generate ${label}`, { id: toastId });
        return;
      }
    }

    if (!content) {
      toast.error(`No ${label} data found.`);
      return;
    }

    const toastId = toast.loading(`Encrypting & Uploading ${label}...`);

    try {
      const { url: newUrl } = await uploadToPrivateBin(content);

      await navigator.clipboard.writeText(newUrl);
      setShareUrl(newUrl);

      toast.success('Link Copied', {
        id: toastId,
        description: `Secure ${label} link copied to clipboard.`,
        duration: 4000,
      });
    } catch (err) {
      console.error('PrivateBin upload failed:', err);
      toast.error('Upload Failed', {
        id: toastId,
        description: 'Could not upload to PrivateBin. Please try again.',
      });
    }
  };

  if (shareUrl) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className={className}
        onClick={() => window.open(shareUrl, '_blank')}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Open in PrivateBin
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className={className}>
          <Share className="mr-2 h-4 w-4" />
          Share
          <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleShare('text', 'Text')}>
          Share Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('json', 'JSON')}>
          Share JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('html', 'HTML')}>
          Share HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('xml', 'XML')}>
          Share XML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
