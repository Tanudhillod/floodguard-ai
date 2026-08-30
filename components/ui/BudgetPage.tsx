"use client"

import { budget } from '@/lib/mock-data'
import { Panel, ProgressBar, SectionHeader, StatusBadge } from '@/components/ui/shared'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function BudgetPage() {
  const allocated = 120000
  const spent = 78000
  const remaining = allocated - spent

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Panel className="p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Allocated</div>
          <div className="mt-3 text-3xl font-bold text-[#0f2742]">{currency.format(allocated)}</div>
        </Panel>
        <Panel className="p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Spent</div>
          <div className="mt-3 text-3xl font-bold text-[#e58a00]">{currency.format(spent)}</div>
        </Panel>
        <Panel className="p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Remaining</div>
          <div className="mt-3 text-3xl font-bold text-[#16803c]">{currency.format(remaining)}</div>
        </Panel>
      </section>

      <Panel className="p-5">
        <SectionHeader eyebrow="Resource allocation" title="Operational budget" icon="WalletCards" />

        <div className="space-y-4">
          {budget.map((entry) => {
            const percentage = Math.round((entry.spent / entry.allocated) * 100)
            return (
              <div key={entry.category} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-base font-semibold text-[#0f2742]">{entry.category}</div>
                    <div className="mt-1 text-xs text-slate-500">{currency.format(entry.spent)} spent of {currency.format(entry.allocated)}</div>
                  </div>
                  <StatusBadge label={entry.status} tone={entry.status === 'At risk' ? 'warning' : entry.status === 'Monitoring' ? 'medium' : entry.status === 'Healthy' ? 'good' : 'neutral'} />
                </div>
                <div className="mt-3">
                  <ProgressBar value={percentage} tone={percentage > 85 ? 'amber' : 'blue'} />
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
