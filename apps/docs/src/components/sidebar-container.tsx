'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function SidebarContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const isPlayground = pathname.startsWith('/playground');

  return (
    <div className={className} hidden={isPlayground}>
      {children}
    </div>
  );
}
