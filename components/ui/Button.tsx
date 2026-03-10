'use client'

import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  className?: string
  children: React.ReactNode
}

interface ButtonAsButton extends ButtonBaseProps {
  href?: never
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string
  onClick?: never
  type?: never
}

type ButtonProps = ButtonAsButton | ButtonAsLink

// ─── Style maps ───────────────────────────────────────────────────────────────

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-accent text-white hover:bg-[var(--accent-h)] active:translate-y-px',
  secondary: 'bg-transparent text-[var(--text)] border border-edge hover:border-[var(--muted)]',
  ghost:     'bg-transparent text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
  danger:    'bg-transparent text-red-400 border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.08)]',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm:  'px-3 py-1.5 text-[11px] rounded-lg gap-1.5',
  md:  'px-4 py-2 text-[12px] rounded-xl gap-2',
  lg:  'px-6 py-3 text-[14px] rounded-xl gap-2.5',
}

const BASE = 'inline-flex items-center justify-center font-semibold leading-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none'

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`
  const isDisabled = disabled || loading
  const content = loading
    ? <><span className="spinner inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />{children}</>
    : children

  if ('href' in rest && rest.href) {
    return (
      <Link href={rest.href} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type={(rest as ButtonAsButton).type ?? 'button'}
      onClick={(rest as ButtonAsButton).onClick}
      disabled={isDisabled}
      className={classes}
    >
      {content}
    </button>
  )
}

// ─── Icon button ──────────────────────────────────────────────────────────────

interface IconButtonProps {
  onClick?: () => void
  title: string
  className?: string
  children: React.ReactNode
}

export function IconButton({ onClick, title, className = '', children }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--surface-2)] text-muted hover:bg-edge hover:text-[var(--text)] transition-colors ${className}`}
    >
      {children}
    </button>
  )
}
