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
  ButtonHTMLAttributes,
  CSSProperties,
  ReactElement,
  PropsWithChildren,
  ReactNode,
} from 'react';
import { useDemoSurfaceResize } from '../../components/demo-surface';

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
      className="example-section"
      onKeyDownCapture={markUserInteracted}
      onPointerDownCapture={markUserInteracted}>
      {hasHeader ? (
        <div className="example-section__header">
          <div className="example-section__title-group">
            {title ? (
              <div className="example-section__title">{title}</div>
            ) : null}
            {description ? (
              <p className="example-section__description">{description}</p>
            ) : null}
          </div>
          {actions || resettable ? (
            <div className="example-section__actions">
              {actions}
              {resettable ? (
                <ExampleButton
                  type="button"
                  className="example-section__reset"
                  data-visible={showReset}
                  aria-hidden={!showReset}
                  tabIndex={showReset ? undefined : -1}
                  onClick={resetWorkspace}>
                  Reset
                </ExampleButton>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div key={resetKey} className="example-section__frame" style={frameStyle}>
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

type ExampleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function ExampleButton({
  active = false,
  style,
  ...props
}: ExampleButtonProps) {
  return (
    <button
      {...props}
      data-active={active}
      className={[
        'site-button',
        'site-button--compact',
        'example-button',
        props.className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    />
  );
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
