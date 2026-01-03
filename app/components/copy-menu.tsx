import { ChevronDown, Copy } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

interface CopyMenuProps {
  data: Record<string, string>;
  url: string;
  className?: string;
}

export function CopyMenu({ data, url, className }: CopyMenuProps) {
  // Local cache for fetched formats
  const fetchedData = useRef<Record<string, string>>({});

  const handleCopy = async (format: string, label: string) => {
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

    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard', {
        description: `${label} format copied successfully.`,
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy', err);
      toast.error('Failed to copy', {
        description: 'Please try again.',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className={className}>
          <Copy className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Copy</span>
          <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleCopy('text', 'Text')}>
          Copy Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopy('json', 'JSON')}>
          Copy JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopy('html', 'HTML')}>
          Copy HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopy('xml', 'XML')}>
          Copy XML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
