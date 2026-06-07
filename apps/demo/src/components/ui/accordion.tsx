'use client';

import type { ReactNode } from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import { RiArrowDownSLine } from 'react-icons/ri';
import { cn } from '../../lib/cn';

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
    <Accordion.Root
      className={cn('playground-sections', className)}
      multiple
      defaultValue={defaultOpen}>
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
    <Accordion.Item value={value} className="playground-section">
      <Accordion.Header className="playground-section__header">
        <Accordion.Trigger className="playground-section__head">
          <span>{title}</span>
          <RiArrowDownSLine
            className="playground-section__chevron"
            aria-hidden="true"
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="playground-section__panel" keepMounted>
        <div className="playground-section__body">{children}</div>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
