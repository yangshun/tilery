'use client';

import { Switch } from '@base-ui-components/react/switch';
import { cn } from '../../lib/cn';

export type SwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function SwitchInput({
  checked,
  onChange,
  disabled,
  className,
}: SwitchProps) {
  return (
    <Switch.Root
      className={
        className ??
        cn(
          'relative w-[34px] h-5 p-0 border border-site-shell-border rounded-full bg-site-fg/15 cursor-pointer transition-[background,border-color] duration-150 ease-in-out',
          'data-[checked]:bg-site-fg/42 data-[checked]:border-site-fg/52',
          'data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed',
        )
      }
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}>
      <Switch.Thumb className="absolute top-1/2 left-0.5 w-3.5 h-3.5 rounded-full bg-white -translate-y-1/2 transition-[left] duration-150 ease-in-out [[data-checked]>&]:left-[17px]" />
    </Switch.Root>
  );
}
