'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CSSProperties,
  ReactElement,
  PropsWithChildren,
  ReactNode,
} from 'react';
import { useDemoSurfaceResize } from '../../components/demo-surface';
import { cn } from '../../lib/cn';
import { Button } from '../../components/ui/button';

type ExampleStackProps = PropsWithChildren<{
  rows?: string;
  style?: CSSProperties;
}>;

export function ExampleStack({
  children,
  rows = 'minmax(0, 1fr)',
  style,
}: ExampleStackProps) {
  return (
    <div style={{ ...stackStyle, gridTemplateRows: rows, ...style }}>
      {children}
    </div>
  );
}

type ExampleSectionProps = PropsWithChildren<{
  title?: string;
  description?: string;
  actions?: ReactNode;
  frameStyle?: CSSProperties;
  isDirty?: boolean;
  onReset?: () => void;
  resettable?: boolean;
}>;

export function ExampleSection({
  title,
  description,
  actions,
  children,
  frameStyle,
  isDirty = false,
  onReset,
  resettable = true,
}: ExampleSectionProps) {
  const [resetKey, setResetKey] = useState(0);
  const initialLayoutStateRef = useRef<string | null>(null);
  const hasUserInteractedRef = useRef(false);
  const [hasChangedLayout, setHasChangedLayout] = useState(false);
  const hasHeader = title || description || actions || resettable;
  const { resized: frameResized, reset: resetFrameSize } =
    useDemoSurfaceResize();
  const showReset = resettable && (isDirty || hasChangedLayout || frameResized);

  const trackLayoutChange = useCallback((state: unknown) => {
    const serialized = serializeLayoutState(state);
    if (initialLayoutStateRef.current === null) {
      initialLayoutStateRef.current = serialized;
      setHasChangedLayout(false);
      return;
    }
    if (!hasUserInteractedRef.current) {
      initialLayoutStateRef.current = serialized;
      setHasChangedLayout(false);
      return;
    }
    setHasChangedLayout(serialized !== initialLayoutStateRef.current);
  }, []);

  function resetWorkspace() {
    onReset?.();
    resetFrameSize();
    initialLayoutStateRef.current = null;
    hasUserInteractedRef.current = false;
    setHasChangedLayout(false);
    setResetKey((key) => key + 1);
  }

  function markUserInteracted() {
    hasUserInteractedRef.current = true;
  }

  const trackedChildren = useMemo(
    () =>
      resettable ? trackTileryChanges(children, trackLayoutChange) : children,
    [children, resettable, trackLayoutChange],
  );

  return (
    <section
      className="h-full min-h-0 grid grid-rows-[auto_minmax(0,1fr)] gap-4"
      onKeyDownCapture={markUserInteracted}
      onPointerDownCapture={markUserInteracted}>
      {hasHeader ? (
        <div className="min-w-0 flex flex-nowrap items-end justify-between gap-x-[18px] gap-y-3 max-lg:flex-wrap max-lg:items-start">
          <div className="min-w-0 flex-[1_1_320px] grid gap-[5px] max-lg:w-full">
            {title ? (
              <div className="text-site-fg text-[15px] font-[650] leading-[1.35]">
                {title}
              </div>
            ) : null}
            {description ? (
              <p className="m-0 text-site-muted text-sm leading-[1.35]">
                {description}
              </p>
            ) : null}
          </div>
          {actions || resettable ? (
            <div className="min-w-0 flex flex-[0_1_auto] flex-wrap justify-end gap-1.5 max-lg:w-full max-lg:justify-start">
              {actions}
              {resettable ? (
                <Button
                  type="button"
                  size="compact"
                  className={cn(
                    'overflow-hidden transition-[max-width,margin-left,opacity,padding,border-color,transform,visibility] duration-[180ms] ease-in-out',
                    showReset
                      ? 'max-w-24 opacity-100 translate-y-0'
                      : 'max-w-0 ml-[-6px] px-0 border-0 opacity-0 pointer-events-none -translate-y-0.5 invisible',
                  )}
                  aria-hidden={!showReset}
                  tabIndex={showReset ? undefined : -1}
                  onClick={resetWorkspace}>
                  Reset
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        key={resetKey}
        className="w-[min(var(--demo-frame-width,100%),100%)] h-full min-h-0 overflow-hidden border border-[var(--example-demo-border)] rounded-[6px] bg-[var(--example-demo-panel-bg)] text-[var(--example-demo-fg)]"
        style={{ colorScheme: 'dark', ...frameStyle }}>
        {trackedChildren}
      </div>
    </section>
  );
}

type ElementWithProps = ReactElement<
  Record<string, unknown> & { children?: ReactNode; onChange?: unknown }
>;

function trackTileryChanges(
  children: ReactNode,
  onChange: (state: unknown) => void,
): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    const element = child as ElementWithProps;
    const props = element.props;
    const nextProps: Record<string, unknown> = {};
    let changed = false;

    if (props.children) {
      nextProps.children = trackTileryChanges(props.children, onChange);
      changed = true;
    }

    if (isTileryElement(props)) {
      const originalOnChange = props.onChange;
      nextProps.onChange = (state: unknown) => {
        if (typeof originalOnChange === 'function') originalOnChange(state);
        onChange(state);
      };
      changed = true;
    }

    return changed ? cloneElement(element, nextProps) : child;
  });
}

function isTileryElement(props: Record<string, unknown>): props is Record<
  string,
  unknown
> & {
  onChange?: (state: unknown) => void;
} {
  return (
    'initialLayout' in props &&
    typeof props.renderTabHeader === 'function' &&
    typeof props.renderTabContent === 'function'
  );
}

function serializeLayoutState(state: unknown) {
  try {
    return JSON.stringify(state);
  } catch {
    return String(state);
  }
}

type EmptyStateProps = {
  children: ReactNode;
};

export function EmptyState({ children }: EmptyStateProps) {
  return <div style={emptyStateStyle}>{children}</div>;
}

type TabContentProps = PropsWithChildren<{
  meta?: string;
}>;

export function TabContent({ meta, children }: TabContentProps) {
  return (
    <div style={tabContentStyle}>
      {meta ? <div style={tabMetaStyle}>{meta}</div> : null}
      <div style={tabBodyStyle}>{children}</div>
    </div>
  );
}

export const stackStyle: CSSProperties = {
  height: '100%',
  minHeight: 0,
  display: 'grid',
  gap: 12,
  background: 'transparent',
};

export const emptyStateStyle: CSSProperties = {
  color: 'var(--example-demo-muted-soft)',
  fontSize: 13,
};

export const tabContentStyle: CSSProperties = {
  height: '100%',
  padding: 16,
  color: 'var(--example-demo-fg)',
  fontSize: 15,
  lineHeight: 1.5,
};

export const tabMetaStyle: CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  marginBottom: 10,
  padding: '3px 7px',
  borderRadius: 4,
  background: 'var(--example-demo-meta-bg)',
  color: 'var(--example-demo-muted)',
  fontFamily: 'var(--site-mono)',
  fontSize: 11,
};

export const tabBodyStyle: CSSProperties = {
  maxWidth: 560,
};

export const monoBlockStyle: CSSProperties = {
  margin: 0,
  color: 'var(--example-demo-muted)',
  fontFamily: 'var(--site-mono)',
  fontSize: 12,
};

export const codeBlockStyle: CSSProperties = {
  ...monoBlockStyle,
  color: 'var(--example-demo-fg)',
};
