import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const ICON_BUTTON_BASE =
  'inline-flex items-center justify-center size-[30px] p-0 border-0 border-transparent bg-transparent text-site-fg text-lg leading-none no-underline cursor-pointer rounded-md transition-[background,border-color,color] duration-150 ease-in-out hover:bg-site-overlay hover:text-site-fg focus-visible:outline-2 focus-visible:outline-site-accent focus-visible:outline-offset-2';

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ type = 'button', className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(ICON_BUTTON_BASE, className)}
        {...props}
      />
    );
  },
);
