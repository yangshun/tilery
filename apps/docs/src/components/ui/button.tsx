import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ElementType,
  type ComponentPropsWithoutRef,
} from 'react';
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
  asChild?: boolean;
};

const BASE =
  'inline-flex items-center justify-center min-h-8 max-w-full px-3 border border-solid rounded-md text-sm font-medium leading-none no-underline whitespace-nowrap cursor-pointer transition-colors duration-100 ease-in-out disabled:opacity-42 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-site-accent focus-visible:outline-offset-2';

const VARIANT: Record<ButtonVariant, string> = {
  default: [
    'bg-site-chrome-bg border-site-chrome-border text-site-chrome-fg',
    'hover:not-disabled:bg-site-chrome-bg-hover hover:not-disabled:border-site-chrome-border hover:not-disabled:text-site-fg',
    'data-[active=true]:bg-site-fg/16 data-[active=true]:border-site-fg/38 data-[active=true]:text-site-fg',
    'light:bg-transparent light:border-slate-900/15 light:text-site-fg-soft',
    'light:hover:not-disabled:bg-slate-900/5 light:hover:not-disabled:border-slate-900/25 light:hover:not-disabled:text-site-fg',
    'light:data-[active=true]:bg-site-accent/12 light:data-[active=true]:border-site-accent/50 light:data-[active=true]:text-site-fg',
  ].join(' '),
  primary: [
    'bg-site-button-primary-bg border-site-button-primary-bg text-site-button-primary-fg',
    'hover:not-disabled:bg-site-button-primary-bg hover:not-disabled:border-site-button-primary-bg hover:not-disabled:text-site-button-primary-fg',
  ].join(' '),
  secondary: [
    'bg-transparent border-site-border text-site-fg',
    'hover:not-disabled:bg-site-overlay hover:not-disabled:border-site-border hover:not-disabled:text-site-fg',
  ].join(' '),
  strong: 'bg-site-fg/16 border-site-fg/38 text-site-fg',
  subtle: [
    'bg-transparent border-site-border text-site-fg',
    'hover:not-disabled:bg-site-overlay hover:not-disabled:border-site-border hover:not-disabled:text-site-fg',
  ].join(' '),
};

const SIZE: Record<ButtonSize, string> = {
  default: '',
  compact: 'min-h-7 px-2.5 text-sm',
  hero: 'min-h-10 px-4 rounded-lg font-semibold',
};

const DANGER_HOVER =
  'hover:not-disabled:border-red-500 hover:not-disabled:text-red-400';

type PolymorphicProps<C extends ElementType> = {
  as?: C;
} & Omit<ComponentPropsWithoutRef<C>, keyof ButtonProps>;

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps & PolymorphicProps<ElementType>
>(function Button(
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
  const v = variant as ButtonVariant;
  const s = size as ButtonSize;

  return (
    <Comp
      ref={ref}
      type={isButton ? type : undefined}
      data-active={active}
      data-variant={variant}
      data-tone={tone}
      className={cn(
        BASE,
        VARIANT[v],
        SIZE[s],
        tone === 'danger' && DANGER_HOVER,
        className,
      )}
      {...props}
    />
  );
});
