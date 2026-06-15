/**
 * Presentational form-field primitives shared by the estimator form.
 * Styling only — state/validation lives in the parent (react-hook-form).
 * Large tap targets, single source of truth for input chrome.
 */

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const inputBase =
  "w-full rounded-xl border-2 bg-surface px-4 py-3 text-[15px] text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-muted/60 hover:border-line/80 focus:border-accent focus:ring-4 focus:ring-accent/15 focus:shadow-md disabled:opacity-60";

function borderClass(error?: string) {
  return error ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-line";
}

export function FieldShell({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-ink"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted">{hint}</p>
      )}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

type TextFieldProps = {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function TextField({
  label,
  required,
  hint,
  error,
  id,
  ...rest
}: TextFieldProps) {
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      required={required}
      hint={hint}
      error={error}
    >
      <input id={id} className={`${inputBase} ${borderClass(error)}`} {...rest} />
    </FieldShell>
  );
}

type SelectFieldProps = {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  options: readonly string[];
  placeholder?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({
  label,
  required,
  hint,
  error,
  options,
  placeholder,
  id,
  ...rest
}: SelectFieldProps) {
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      required={required}
      hint={hint}
      error={error}
    >
      <select
        id={id}
        className={`${inputBase} ${borderClass(error)} appearance-none bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat pr-10`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%235b6b7f' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type TextAreaProps = {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  label,
  required,
  hint,
  error,
  id,
  ...rest
}: TextAreaProps) {
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      required={required}
      hint={hint}
      error={error}
    >
      <textarea
        id={id}
        className={`${inputBase} ${borderClass(error)} min-h-24 resize-y`}
        {...rest}
      />
    </FieldShell>
  );
}

/** Segmented pill control (controlled). Good for 2–6 mutually exclusive options. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  hint?: ReactNode;
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <div className="inline-flex w-full rounded-xl border border-line bg-canvas p-1">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
              aria-pressed={active}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

/** Toggle switch (controlled). */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface px-3.5 py-3">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

/** Multi-select chip list (controlled). */
export function MultiSelectChips({
  label,
  hint,
  options,
  selected,
  onToggle,
}: {
  label: string;
  hint?: ReactNode;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <FieldShell label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-accent bg-accent-light text-accent-dark"
                  : "border-line bg-surface text-muted hover:border-primary/40"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}
