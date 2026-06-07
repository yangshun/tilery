'use client';

import { Switch } from '@base-ui-components/react/switch';

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
      className={className ?? 'playground-switch'}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}>
      <Switch.Thumb className="playground-switch__thumb" />
    </Switch.Root>
  );
}
