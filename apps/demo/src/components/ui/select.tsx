'use client';

import { RiArrowDownSLine } from 'react-icons/ri';
import { cn } from '../../lib/cn';

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function Select({
  value,
  onChange,
  options,
  disabled,
  ariaLabel,
  className,
}: SelectProps) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <select
        className="h-7 max-w-[170px] pr-[26px] pl-2 border border-site-shell-border rounded-[6px] bg-site-bg text-site-fg text-[12.5px] font-[inherit] cursor-pointer appearance-none"
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <RiArrowDownSLine
        className="absolute right-[7px] inline-flex text-[15px] opacity-55 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
