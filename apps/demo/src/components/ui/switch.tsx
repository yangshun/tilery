'use client';

import { Switch } from '@base-ui-components/react/switch';
import styles from './switch.module.css';

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
      className={className ?? styles.switch}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}>
      <Switch.Thumb className={styles.thumb} />
    </Switch.Root>
  );
}
