import type { ReactNode } from 'react';

import { cn } from '~/lib/utils';

interface MediaDetailItemProps {
  label: string;
  value?: string | number | null;
  subtext?: string | null;
  className?: string;
  children?: ReactNode;
  colSpan?: number;
}

export function MediaDetailItem({
  label,
  value,
  subtext,
  className,
  children,
  colSpan,
}: MediaDetailItemProps) {
  return (
    <div
      className={cn(
        colSpan && colSpan > 1 && `sm:col-span-${colSpan}`,
        className,
      )}
    >
      <span className="text-muted-foreground mb-1 block text-xs tracking-wider uppercase">
        {label}
      </span>
      {children ? (
        children
      ) : (
        <div className="flex flex-col">
          <span className="text-foreground/85 font-semibold">{value}</span>
          {subtext && (
            <span className="text-muted-foreground text-xs font-normal">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
