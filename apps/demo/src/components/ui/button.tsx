import { forwardRef, type ButtonHTMLAttributes, type ElementType, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';
import styles from './button.module.css';

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
  asChild?: boolean;
};

const variantClass: Record<Exclude<ButtonVariant, 'default'>, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  strong: styles.strong,
  subtle: styles.subtle,
} as const;

const sizeClass: Record<Exclude<ButtonSize, 'default'>, string> = {
  compact: styles.compact,
  hero: styles.hero,
} as const;

type PolymorphicProps<C extends ElementType> = {
  as?: C;
} & Omit<ComponentPropsWithoutRef<C>, keyof ButtonProps>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps & PolymorphicProps<ElementType>>(
  function Button(
    {
      variant = 'default',
      size = 'default',
      tone = 'default',
      active = false,
      type = 'button',
      className,
      asChild = false,
      as: Component = 'button',
      ...props
    },
    ref,
  ) {
    const Comp = asChild ? Component : 'button';
    const isButton = Comp === 'button';

    const variantKey = variant as Exclude<ButtonVariant, 'default'>;
    const sizeKey = size as Exclude<ButtonSize, 'default'>;

    return (
      <Comp
        ref={ref}
        type={isButton ? type : undefined}
        data-active={active}
        data-variant={variant}
        data-tone={tone}
        className={cn(
          styles.button,
          variant !== 'default' ? variantClass[variantKey] : null,
          size !== 'default' ? sizeClass[sizeKey] : null,
          tone === 'danger' ? styles.danger : null,
          className,
        )}
        {...props}
      />
    );
  },
);
