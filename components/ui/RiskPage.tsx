"use client"

import { chart, riskIndicators } from '@/lib/mock-data'
import { Panel, ProgressBar, SectionHeader, StatusBadge } from '@/components/ui/shared'

export default function RiskPage() {
  const max = Math.max(...chart)

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <SectionHeader eyebrow="Model assessment" title="Flood risk analysis" icon="Activity" />

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-red-500/30 bg-slate-950 text-center">
              <div>
                <div className="text-4xl font-bold text-red-200">82%</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">High risk</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Model confidence</span>
                <strong className="text-lg font-semibold text-white">94%</strong>
              </div>
              <div className="mt-3">
                <ProgressBar value={94} tone="red" />
              </div>
            </div>

            <div className="space-y-2">
              {riskIndicators.map((indicator) => (
                <div key={indicator.label} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-300">{indicator.label}</span>
                    <StatusBadge label={indicator.value} tone={indicator.tone as any} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionHeader eyebrow="Indicator trend" title="Risk signal progression" icon="TrendingUp" />
        <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
          <div className="flex h-48 items-end gap-2">
            {chart.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] text-slate-500">{value}</span>
                <div className="w-full rounded-t-xl bg-gradient-to-t from-sky-500 via-cyan-400 to-emerald-300" style={{ height: `${(value / max) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  )
}
