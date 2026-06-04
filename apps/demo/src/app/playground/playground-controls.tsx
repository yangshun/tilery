'use client';

// Presentational, site-themed control primitives for the Playground inspector,
// built on Base UI's unstyled components (accordion, switch, select, number
// field) so we don't hand-roll interactive widgets. Styling lives in globals.css
// under the `/* Playground */` block and keys off Base UI's data-* state attrs.

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import { Switch } from '@base-ui-components/react/switch';
import { RiArrowDownSLine } from 'react-icons/ri';

export function Sections({
  defaultOpen,
  children,
}: {
  defaultOpen: string[];
  children: ReactNode;
}) {
  return (
    <Accordion.Root
      className="playground-sections"
      multiple
      defaultValue={defaultOpen}>
      {children}
    </Accordion.Root>
  );
}

export function Section({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Accordion.Item value={value} className="playground-section">
      <Accordion.Header className="playground-section__header">
        <Accordion.Trigger className="playground-section__head">
          <span>{title}</span>
          <RiArrowDownSLine className="playground-section__chevron" aria-hidden="true" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="playground-section__panel" keepMounted>
        <div className="playground-section__body">{children}</div>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

export function ControlRow({
  label,
  hint,
  control,
}: {
  label: string;
  hint?: string;
  control: ReactNode;
}) {
  return (
    <div className="playground-row">
      <div className="playground-row__text">
        <span className="playground-row__label">{label}</span>
        {hint ? <span className="playground-row__hint">{hint}</span> : null}
      </div>
      <div className="playground-row__control">{control}</div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch.Root
      className="playground-switch"
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}>
      <Switch.Thumb className="playground-switch__thumb" />
    </Switch.Root>
  );
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <ControlRow
      label={label}
      hint={hint}
      control={
        <Toggle checked={checked} onChange={onChange} disabled={disabled} />
      }
    />
  );
}

type Option = { value: string; label: string };

// Native <select>: accessible, theme-adapting, and the right tool for these
// simple option lists. (Base UI's Select is reserved for cases that need a fully
// custom-rendered listbox; here it added flaky portaled popups for no benefit.)
export function PgSelect({
  value,
  onChange,
  options,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className="playground-select-wrap">
      <select
        className="playground-select"
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
      <RiArrowDownSLine className="playground-select__icon" aria-hidden="true" />
    </div>
  );
}

export function SelectRow({
  label,
  hint,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
}) {
  return (
    <ControlRow
      label={label}
      hint={hint}
      control={
        <PgSelect
          value={value}
          onChange={onChange}
          options={options}
          disabled={disabled}
          ariaLabel={label}
        />
      }
    />
  );
}

export function NumberRow({
  label,
  hint,
  value,
  onChange,
  placeholder,
  disabled,
  min = 0,
  max,
}: {
  label: string;
  hint?: string;
  value: number | '';
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <ControlRow
      label={label}
      hint={hint}
      control={
        <input
          type="number"
          className="playground-num"
          aria-label={label}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          onChange={(event) =>
            onChange(event.target.value === '' ? null : Number(event.target.value))
          }
        />
      }
    />
  );
}

type PgButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  variant?: 'default' | 'primary' | 'danger';
};

export function PgButton({
  active = false,
  variant = 'default',
  ...props
}: PgButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      data-active={active}
      data-variant={variant}
      className={`playground-btn ${props.className ?? ''}`}
    />
  );
}

export function ButtonGrid({ children }: { children: ReactNode }) {
  return <div className="playground-btn-grid">{children}</div>;
}
