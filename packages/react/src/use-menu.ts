'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shared keyboard + focus behavior for Tilery's dropdown menus (panel actions
 * and tab overflow). Owns the open state and adds the WAI-ARIA menu contract:
 * focus the first item when the menu opens, roving Arrow/Home/End focus among
 * items, Escape and outside-pointer-down close, and focus return to the trigger
 * on keyboard (Escape) close.
 */
export function useTileryMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const toggle = useCallback(() => setIsOpen((value) => !value), []);
  const close = useCallback((returnFocus = true) => {
    setIsOpen(false);
    if (returnFocus) {
      /* v8 ignore next -- the trigger is always mounted when close() runs. */
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    /* v8 ignore next -- menu and trigger are always mounted while open. */
    if (!menu || !trigger) return;
    // Move focus into the menu when it opens.
    const items = menu.querySelectorAll<HTMLElement>('[role^="menuitem"]');
    /* v8 ignore next -- an open menu always renders at least one item. */
    items[0]?.focus();
    // Close on a pointer-down outside the menu or its trigger.
    const onPointerDown = (e: Event) => {
      const target = e.target as Node;
      if (menu.contains(target) || trigger.contains(target)) return;
      setIsOpen(false);
    };
    const doc = menu.ownerDocument;
    doc.addEventListener('pointerdown', onPointerDown, true);
    return () => doc.removeEventListener('pointerdown', onPointerDown, true);
  }, [isOpen]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      const menu = menuRef.current;
      /* v8 ignore next -- the menu element is always mounted while open. */
      if (!menu) return;
      const items = Array.from(
        menu.querySelectorAll<HTMLElement>('[role^="menuitem"]'),
      );
      /* v8 ignore next -- an open menu always renders at least one item. */
      if (items.length === 0) return;
      const current = items.indexOf(document.activeElement as HTMLElement);
      let next: number;
      if (e.key === 'ArrowDown') next = current + 1;
      else if (e.key === 'ArrowUp') next = current - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;
      else return;
      if (next < 0) next = items.length - 1;
      else if (next >= items.length) next = 0;
      e.preventDefault();
      items[next]!.focus();
    },
    [close],
  );

  return { isOpen, close, toggle, triggerRef, menuRef, onKeyDown };
}
