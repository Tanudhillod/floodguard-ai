"use client"

import { kpis, sensors, shelters, sos } from '@/lib/mock-data'
import { Icon, MetricCard, Panel, ProgressBar, SectionHeader, StatusBadge } from '@/components/ui/shared'

const priorityTone: Record<string, 'critical' | 'high' | 'medium' | 'good' | 'neutral'> = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  OPEN: 'good',
  'NEAR CAPACITY': 'warning',
  FULL: 'critical',
  EMERGENCY: 'critical',
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-sky-500/10 via-slate-900/80 to-slate-950 p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">Monitor • Analyze • Prioritize • Respond</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">Good morning, Arjun.</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">Here is the latest operational overview across the flood-affected districts and emergency response network.</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(14,165,233,0.35)] transition hover:bg-sky-400">
            <Icon name="Radio" size={16} />
            Broadcast alert
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((item) => (
          <MetricCard key={item.label} icon={item.icon} label={item.label} value={item.value} meta={item.meta} tone={item.tone as any} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Live map</div>
              <h3 className="mt-1 text-lg font-semibold text-white">Flood Response Map</h3>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300">
              <Icon name="Maximize2" size={14} />
              Expand
            </button>
          </div>

          <div className="relative h-[320px] overflow-hidden rounded-2xl border border-slate-700 bg-[radial-gradient(circle_at_top,#11365b_0%,#0b1e2d_35%,#071722_100%)]">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cyan-500/20 via-sky-500/10 to-transparent" />
            <div className="absolute left-[18%] top-[20%] h-20 w-20 rounded-full border border-cyan-500/20 bg-cyan-500/10 blur-2xl" />
            <div className="absolute right-[12%] top-[16%] h-24 w-24 rounded-full border border-orange-500/20 bg-orange-500/10 blur-3xl" />

            {[
              { x: 20, y: 62, tone: 'critical' },
              { x: 43, y: 30, tone: 'warning' },
              { x: 58, y: 56, tone: 'high' },
              { x: 77, y: 36, tone: 'good' },
              { x: 71, y: 70, tone: 'critical' },
            ].map((marker, index) => (
              <div key={index} className="absolute" style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>
                <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                  marker.tone === 'critical' ? 'border-red-300 bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.8)]' :
                  marker.tone === 'warning' ? 'border-amber-300 bg-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.8)]' :
                  marker.tone === 'good' ? 'border-emerald-300 bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.8)]' :
                  'border-sky-300 bg-sky-500 shadow-[0_0_18px_rgba(14,165,233,0.8)]'
                }`} />
              </div>
            ))}

            <div className="absolute bottom-5 left-5 rounded-lg bg-slate-950/80 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">East Delhi</div>

            <div className="absolute bottom-4 right-4 flex gap-2 rounded-xl border border-slate-700 bg-slate-950/70 p-2">
              {['Critical areas', 'High risk', 'Shelters', 'Teams'].map((label, idx) => (
                <div key={label} className="flex items-center gap-2 px-1 text-[10px] text-slate-300">
                  <span className={`h-2.5 w-2.5 rounded-full ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-amber-500' : idx === 2 ? 'bg-sky-500' : 'bg-emerald-500'}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader eyebrow="Flood risk" title="Risk status" icon="Activity" />
          <div className="mt-4 flex items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-red-500/30 bg-slate-950 text-center shadow-[inset_0_0_30px_rgba(239,68,68,0.1)]">
              <div>
                <div className="text-3xl font-bold text-red-200">82%</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">High risk</div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/60 px-3 py-2">
              <span className="text-sm text-slate-300">Model confidence</span>
              <span className="text-sm font-semibold text-white">94%</span>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Indicator trend</span>
                <StatusBadge label="Rising" tone="critical" />
              </div>
              <ProgressBar value={82} tone="red" />
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel className="p-5">
          <SectionHeader eyebrow="Priority queue" title="Emergency requests" icon="Siren" action={<button className="text-xs font-medium text-sky-300">View all</button>} />
          <div className="space-y-3">
            {sos.slice(0, 4).map((item) => (
              <div key={item.id} className={`flex flex-col gap-3 rounded-2xl border p-3 md:flex-row md:items-center md:justify-between ${item.priority === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700 bg-slate-950/40'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{item.id}</span>
                    <StatusBadge label={item.priority} tone={priorityTone[item.priority] ?? 'neutral'} />
                  </div>
                  <div className="mt-2 text-sm text-slate-300">{item.location}</div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 md:justify-end">
                  <span>{item.people} people</span>
                  <span>{item.time}</span>
                  <span className="rounded-full border border-slate-600 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-200">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader eyebrow="Shelter status" title="Network summary" icon="House" />
          <div className="space-y-3">
            {shelters.slice(0, 3).map((shelter) => {
              const percent = Math.round((shelter.occupancy / shelter.capacity) * 100)
              return (
                <div key={shelter.name} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{shelter.name}</div>
                      <div className="mt-1 text-xs text-slate-400">{shelter.location}</div>
                    </div>
                    <StatusBadge label={shelter.status} tone={priorityTone[shelter.status] ?? 'neutral'} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                    <span>{shelter.occupancy}/{shelter.capacity}</span>
                    <span>{percent}% occupied</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={percent} tone={percent > 85 ? 'amber' : 'green'} />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </section>

      <section>
        <SectionHeader eyebrow="Sensor network" title="Live monitoring" icon="Radar" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {sensors.map((sensor) => (
            <Panel key={sensor.name} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-200">{sensor.name}</span>
                <StatusBadge label={sensor.status} tone={sensor.status === 'CRITICAL' ? 'critical' : sensor.status === 'WARNING' ? 'warning' : 'neutral'} />
              </div>
              <div className="mt-4 flex items-end gap-1 text-2xl font-bold text-white">
                <span>{sensor.value}</span>
                <span className="pb-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{sensor.unit}</span>
              </div>
              <div className="mt-4">
                <ProgressBar value={(sensor.data.at(-1) ?? 0) * 0.9} tone={sensor.status === 'CRITICAL' ? 'red' : sensor.status === 'WARNING' ? 'amber' : 'blue'} />
              </div>
              <div className="mt-3 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                <Icon name="Clock3" size={12} />
                Live · 12 sec ago
              </div>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  )
}
