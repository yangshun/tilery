import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'strong'
  | 'subtle';

export type ButtonTone = 'default' | 'danger';

export type ButtonSize = 'default' | 'compact' | 'hero';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  active?: boolean;
};

const variantClass: Record<Exclude<ButtonVariant, 'default'>, string> = {
  primary: 'site-button--primary',
  secondary: 'site-button--secondary',
  strong: 'site-button--strong',
  subtle: 'playground-btn',
};

const sizeClass: Record<Exclude<ButtonSize, 'default'>, string> = {
  compact: 'site-button--compact',
  hero: 'site-button--hero',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'default',
      size = 'default',
      tone = 'default',
      active = false,
      type = 'button',
      className,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        data-active={active}
        data-variant={variant}
        data-tone={tone}
        className={cn(
          'site-button',
          variant !== 'default' ? variantClass[variant] : null,
          size !== 'default' ? sizeClass[size] : null,
          tone === 'danger' ? 'site-button--danger' : null,
          className,
        )}
        {...props}
      />
    );
  },
);
