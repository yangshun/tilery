'use client';

import type { ReactNode } from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import { RiArrowDownSLine } from 'react-icons/ri';
import { cn } from '../../lib/cn';
import styles from './accordion.module.css';

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
    <Accordion.Item value={value} className={styles.section}>
      <Accordion.Header className={styles.sectionHeader}>
        <Accordion.Trigger className={styles.sectionHead}>
          <span>{title}</span>
          <RiArrowDownSLine
            className={styles.sectionChevron}
            aria-hidden="true"
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className={styles.sectionPanel} keepMounted>
        <div className={styles.sectionBody}>{children}</div>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
