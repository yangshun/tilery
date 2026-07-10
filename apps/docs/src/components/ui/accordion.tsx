'use client';

import type { ReactNode } from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { RiArrowDownSLine } from 'react-icons/ri';

export type AccordionRootProps = {
  defaultOpen?: string[];
  children: ReactNode;
  className?: string;
};

export function AccordionRoot({
  defaultOpen,
  children,
  className,
}: AccordionRootProps) {
  return (
    <Accordion.Root className={className} multiple defaultValue={defaultOpen}>
      {children}
    </Accordion.Root>
  );
}

export type AccordionItemProps = {
  value: string;
  title: string;
  children: ReactNode;
};

export function AccordionItem({ value, title, children }: AccordionItemProps) {
  return (
    <Accordion.Item value={value} className="border-b border-site-shell-border">
      <Accordion.Header className="m-0">
        <Accordion.Trigger className="w-full flex items-center justify-between p-3 border-0 bg-transparent font-[inherit] text-sm font-medium tracking-normal text-left text-site-fg cursor-pointer select-none">
          <span>{title}</span>
          <RiArrowDownSLine
            className="shrink-0 text-base opacity-70 transition-transform duration-150 ease-in-out motion-reduce:transition-none [[data-panel-open]>&]:rotate-180"
            aria-hidden="true"
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel
        className="grid grid-rows-[1fr] hidden:hidden transition-all duration-200 ease-in-out motion-reduce:transition-none data-[starting-style]:grid-rows-[0fr] data-[ending-style]:grid-rows-[0fr]"
        keepMounted>
        <div className="min-h-0 overflow-hidden flex flex-col gap-2.5 px-3 pt-1 pb-4 transition-opacity duration-200 ease-in-out motion-reduce:transition-none [[data-starting-style]_&]:opacity-0 [[data-ending-style]_&]:opacity-0">
          {children}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
