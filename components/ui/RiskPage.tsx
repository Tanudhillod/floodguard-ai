"use client"

import { chart, riskIndicators } from '@/lib/mock-data'
import { Panel, ProgressBar, SectionHeader, StatusBadge } from '@/components/ui/shared'

export default function RiskPage() {
  const max = Math.max(...chart)

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <SectionHeader eyebrow="Current conditions" title="Flood risk analysis" icon="Activity" />

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-red-200 bg-white text-center">
              <div>
                <div className="text-4xl font-bold text-[#d92d20]">82%</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D97706]">High risk</div>
              </div>
            </div>
            <div className="mt-5 max-w-xs text-center text-sm text-[#486581]">High risk is driven by rising water levels, heavy rainfall, rapid flow, and reduced drainage capacity.</div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-sm text-[#486581]">
                <span>Risk assessment</span>
                <strong className="text-lg font-semibold text-[#D97706]">HIGH</strong>
              </div>
              <div className="mt-3">
                <ProgressBar value={82} tone="red" />
              </div>
            </div>

            <div className="space-y-2">
              {riskIndicators.map((indicator) => (
                <div key={indicator.label} className="rounded-lg border border-[#D9E2EC] bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[#486581]">{indicator.label}</span>
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
            <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex h-48 items-end gap-2">
            {chart.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] text-slate-500">{value}</span>
                <div className="w-full rounded-t-md bg-[#2563eb]" style={{ height: `${(value / max) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  )
}
