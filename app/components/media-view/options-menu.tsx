import { Copy, FileText, MoreVertical, Share } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Switch } from '~/components/ui/switch';
import { useMediaActions } from '~/hooks/use-media-actions';

interface OptionsMenuProps {
  data: Record<string, string>;
  url: string;
  isTextView: boolean;
  setIsTextView: (val: boolean) => void;
  className?: string;
}

// Formats for copy and share actions
const formats = [
  { id: 'json', label: 'Object' },
  { id: 'json', label: 'JSON' },
  { id: 'text', label: 'Text' },
  { id: 'xml', label: 'XML' },
  { id: 'html', label: 'HTML' },
];

export function OptionsMenu({
  data,
  url,
  isTextView,
  setIsTextView,
  className,
}: OptionsMenuProps) {
  const { handleCopy, handleShare } = useMediaActions({ data, url });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <MoreVertical className="h-5 w-5" />
          <span className="sr-only">Options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setIsTextView(!isTextView);
          }}
        >
          <div className="flex flex-1 items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              {isTextView ? (
                <FileText className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4 opacity-50" />
              )}
              View as Text
            </span>
            <Switch checked={isTextView} />
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            {formats.map((fmt, i) => (
              <DropdownMenuItem
                key={`${fmt.id}-${i}`}
                onClick={() => handleCopy(fmt.id, fmt.label)}
              >
                Copy {fmt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Share className="mr-2 h-4 w-4" />
            <span>Share</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            {formats.map((fmt, i) => (
              <DropdownMenuItem
                key={`${fmt.id}-${i}`}
                onClick={() => handleShare(fmt.id, fmt.label)}
              >
                Share {fmt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
