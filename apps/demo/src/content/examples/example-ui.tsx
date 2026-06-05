import type {
  ButtonHTMLAttributes,
  CSSProperties,
  PropsWithChildren,
  ReactNode,
} from 'react';

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
}>;

export function ExampleSection({
  title,
  description,
  actions,
  children,
  frameStyle,
}: ExampleSectionProps) {
  const hasHeader = title || description || actions;

  return (
    <section className="example-section">
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
          {actions ? (
            <div className="example-section__actions">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className="example-section__frame" style={frameStyle}>
        {children}
      </div>
    </section>
  );
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
      className={['example-button', props.className].filter(Boolean).join(' ')}
      style={{
        ...buttonStyle,
        background: active
          ? 'var(--example-button-active-bg, var(--site-overlay))'
          : 'var(--example-button-bg, var(--site-chrome-bg))',
        color: active
          ? 'var(--example-button-active-fg, var(--site-fg))'
          : 'var(--example-button-fg, var(--site-chrome-fg))',
        ...style,
      }}
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

export const buttonStyle: CSSProperties = {
  minHeight: 26,
  padding: '0 9px',
  border: '1px solid var(--example-button-border, var(--site-chrome-border))',
  borderRadius: 4,
  fontSize: 13,
  cursor: 'pointer',
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
