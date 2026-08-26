"use client"

import * as Icons from 'lucide-react'

export type Tone = 'critical' | 'high' | 'medium' | 'good' | 'neutral' | 'warning'

const iconMap = Icons as Record<string, any>

export function Icon({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  const Component = iconMap[name]
  if (!Component) return null
  return <Component size={size} className={className} strokeWidth={1.8} />
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const styles: Record<Tone, string> = {
    critical: 'border-red-500/30 bg-red-500/15 text-red-200',
    high: 'border-amber-500/30 bg-amber-500/15 text-amber-200',
    medium: 'border-sky-500/30 bg-sky-500/15 text-sky-200',
    good: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
    neutral: 'border-slate-500/30 bg-slate-500/15 text-slate-200',
    warning: 'border-orange-500/30 bg-orange-500/15 text-orange-200',
  }

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${styles[tone]}`}>{label}</span>
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-700/80 bg-slate-900/70 shadow-[0_20px_60px_rgba(2,6,23,0.45)] ${className}`}>{children}</div>
}

export function SectionHeader({
  eyebrow,
  title,
  action,
  icon,
}: {
  eyebrow: string
  title: string
  action?: React.ReactNode
  icon?: string
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-200">
            <Icon name={icon} size={16} />
          </div>
        )}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</div>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">{title}</h3>
        </div>
      </div>
      {action}
    </div>
  )
}

export function MetricCard({
  icon,
  label,
  value,
  meta,
  tone = 'neutral',
}: {
  icon: string
  label: string
  value: string
  meta?: string
  tone?: Tone
}) {
  const toneMap: Record<Tone, string> = {
    critical: 'text-red-200',
    high: 'text-amber-200',
    medium: 'text-sky-200',
    good: 'text-emerald-200',
    neutral: 'text-slate-200',
    warning: 'text-orange-200',
  }

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-sky-200">
          <Icon name={icon} size={18} />
        </div>
        <StatusBadge label={meta ?? 'Live'} tone={tone} />
      </div>
      <div className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${toneMap[tone]}`}>{value}</div>
    </Panel>
  )
}

export function ProgressBar({ value, tone = 'blue' }: { value: number; tone?: 'blue' | 'amber' | 'red' | 'green' }) {
  const palette = {
    blue: 'from-sky-500 to-cyan-400',
    amber: 'from-amber-500 to-orange-400',
    red: 'from-red-500 to-rose-400',
    green: 'from-emerald-500 to-teal-400',
  }

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div className={`h-full rounded-full bg-gradient-to-r ${palette[tone]}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}
