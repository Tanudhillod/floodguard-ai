"use client"

import { alerts, kpis, sensors, shelters, sos } from '@/lib/mock-data'
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
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">FloodGuard</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f2742] md:text-3xl">Emergency Response Dashboard</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600">Current conditions across monitored districts, rescue requests, shelters, and sensor infrastructure.</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]">
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
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#627D98]">Live map</div>
              <h3 className="mt-1 text-lg font-semibold text-[#173B5E]">Flood Response Map</h3>
            </div>
            <button className="inline-flex items-center gap-2 rounded-md border border-[#D9E2EC] bg-white px-3 py-2 text-xs font-medium text-[#173B5E]">
              <Icon name="Maximize2" size={14} />
              Expand
            </button>
          </div>

            <div className="relative h-[320px] overflow-hidden rounded-lg border border-slate-200 bg-[#edf3f8]">
            <div className="absolute inset-0 bg-[#e5edf5] opacity-60" />

            {[
              { x: 20, y: 62, tone: 'critical' },
              { x: 43, y: 30, tone: 'warning' },
              { x: 58, y: 56, tone: 'high' },
              { x: 77, y: 36, tone: 'good' },
              { x: 71, y: 70, tone: 'critical' },
            ].map((marker, index) => (
              <div key={index} className="absolute" style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>
                <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                  marker.tone === 'critical' ? 'border-red-700 bg-[#d92d20]' :
                  marker.tone === 'warning' ? 'border-amber-700 bg-[#e58a00]' :
                  marker.tone === 'good' ? 'border-green-700 bg-[#16803c]' :
                  'border-blue-700 bg-[#2563eb]'
                }`} />
              </div>
            ))}

            <div className="absolute bottom-5 left-5 rounded-md bg-white px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0f2742] shadow-sm">East Delhi</div>

            <div className="absolute bottom-4 right-4 flex gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
              {['Critical areas', 'High risk', 'Shelters', 'Teams'].map((label, idx) => (
                <div key={label} className="flex items-center gap-2 px-1 text-[10px] text-[#486581]">
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
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-red-200 bg-white text-center">
              <div>
                <div className="text-3xl font-bold text-[#d92d20]">82%</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#627D98]">High risk</div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-md border border-[#D9E2EC] bg-[#EAF3F8] px-3 py-2">
              <span className="text-sm text-[#486581]">Model confidence</span>
              <span className="text-sm font-semibold text-[#173B5E]">94%</span>
            </div>
            <div className="rounded-md border border-[#D9E2EC] bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-[#627D98]">
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
              <div key={item.id} className={`flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between ${item.priority === 'CRITICAL' ? 'border-red-200 bg-[#FFF1F2]' : 'border-[#D9E2EC] bg-white'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#173B5E]">{item.id}</span>
                    <StatusBadge label={item.priority} tone={priorityTone[item.priority] ?? 'neutral'} />
                  </div>
                  <div className="mt-2 text-sm text-[#486581]">{item.location}</div>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#627D98] md:justify-end">
                  <span>{item.people} people</span>
                  <span>{item.time}</span>
                  <span className="rounded-md border border-[#D9E2EC] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#486581]">{item.status}</span>
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
                <div key={shelter.name} className="rounded-lg border border-[#D9E2EC] bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[#173B5E]">{shelter.name}</div>
                      <div className="mt-1 text-xs text-[#627D98]">{shelter.location}</div>
                    </div>
                    <StatusBadge label={shelter.status} tone={priorityTone[shelter.status] ?? 'neutral'} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#486581]">
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
                <span className="text-sm font-medium text-[#173B5E]">{sensor.name}</span>
                <StatusBadge label={sensor.status} tone={sensor.status === 'CRITICAL' ? 'critical' : sensor.status === 'WARNING' ? 'warning' : 'neutral'} />
              </div>
              <div className="mt-4 flex items-end gap-1 text-2xl font-bold text-[#173B5E]">
                <span>{sensor.value}</span>
                <span className="pb-1 text-xs font-medium uppercase tracking-[0.14em] text-[#627D98]">{sensor.unit}</span>
              </div>
              <div className="mt-4">
                <ProgressBar value={(sensor.data.at(-1) ?? 0) * 0.9} tone={sensor.status === 'CRITICAL' ? 'red' : sensor.status === 'WARNING' ? 'amber' : 'blue'} />
              </div>
              <div className="mt-3 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#627D98]">
                <Icon name="Clock3" size={12} />
                Live · 12 sec ago
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel className="p-5">
          <SectionHeader eyebrow="Recent alerts" title="What needs attention" icon="BellRing" />
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.title} className="flex flex-col gap-2 border-b border-slate-800 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge label={alert.severity} tone={priorityTone[alert.severity] ?? 'neutral'} />
                    <span className="truncate text-sm font-medium text-[#102A43]">{alert.title}</span>
                  </div>
                  <div className="mt-1 text-xs text-[#627D98]">{alert.location} · {alert.action}</div>
                </div>
                <span className="shrink-0 text-xs text-slate-500">{alert.time}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <SectionHeader eyebrow="Operational readiness" title="Response coverage" icon="ShieldCheck" />
          <div className="space-y-4 text-sm">
            <div><div className="mb-2 flex justify-between text-[#486581]"><span>Rescue teams responding</span><strong className="text-[#173B5E]">6 / 8</strong></div><ProgressBar value={75} tone="blue" /></div>
            <div><div className="mb-2 flex justify-between text-[#486581]"><span>Shelter capacity available</span><strong className="text-[#173B5E]">27%</strong></div><ProgressBar value={27} tone="amber" /></div>
            <div className="flex items-center justify-between border-t border-[#D9E2EC] pt-3"><span className="text-[#627D98]">Last system update</span><span className="text-[#18864B]">12 sec ago</span></div>
          </div>
        </Panel>
      </section>
    </div>
  )
}
