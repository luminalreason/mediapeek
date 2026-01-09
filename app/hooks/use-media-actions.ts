import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { uploadToPrivateBin } from '../lib/privatebin';
import { useHapticFeedback } from './use-haptic';

interface UseMediaActionsProps {
  data: Record<string, string>;
  url: string;
}

export function useMediaActions({ data, url }: UseMediaActionsProps) {
  const fetchedData = useRef<Record<string, string>>({});
  const { triggerSuccess } = useHapticFeedback();
  const [isSharing, setIsSharing] = useState(false);

  const fetchContent = async (format: string, label: string) => {
    let content: string | undefined =
      data[format] || fetchedData.current[format];

    if (!content) {
      const toastId = toast.loading(`Generating ${label}...`);
      try {
        const response = await fetch(
          `/resource/analyze?url=${encodeURIComponent(url)}&format=${format}`,
        );
        if (!response.ok) throw new Error('Failed to generate format');
        const json = (await response.json()) as {
          results?: Record<string, string>;
        };
        content = json.results?.[format];
        if (!content) throw new Error('No content returned');

        fetchedData.current[format] = content as string;
        toast.dismiss(toastId);
      } catch (err) {
        console.error(err);
        toast.error(`Failed to generate ${label}`, { id: toastId });
        return null;
      }
    }
    return content;
  };

  const handleCopy = async (format: string, label: string) => {
    const content = await fetchContent(format, label);
    if (!content) {
      if (content === undefined) toast.error(`No ${label} data found.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      triggerSuccess();
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

  const handleShare = async (format: string, label: string) => {
    const content = await fetchContent(format, label);
    if (!content) {
      if (content === undefined) toast.error(`No ${label} data found.`);
      return;
    }

    const toastId = toast.loading(`Encrypting & Uploading ${label}...`);
    setIsSharing(true);

    try {
      const { url: newUrl } = await uploadToPrivateBin(content);

      await navigator.clipboard.writeText(newUrl);
      window.open(newUrl, '_blank');

      triggerSuccess();
      toast.success('Link Copied & Opened', {
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
    } finally {
      setIsSharing(false);
    }
  };

  return { handleCopy, handleShare, isSharing };
}
