"use client"

import { shelters } from '@/lib/mock-data'
import { Panel, ProgressBar, SectionHeader, StatusBadge } from '@/components/ui/shared'

const statusTone: Record<string, 'critical' | 'high' | 'medium' | 'good' | 'neutral' | 'warning'> = {
  OPEN: 'good',
  'NEAR CAPACITY': 'warning',
  FULL: 'critical',
  EMERGENCY: 'critical',
}

export default function SheltersPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <SectionHeader eyebrow="Shelter network" title="Available rescue shelters" icon="House" />

        <div className="grid gap-4 xl:grid-cols-2">
          {shelters.map((shelter) => {
            const occupiedPercent = Math.round((shelter.occupancy / shelter.capacity) * 100)
            return (
              <div key={shelter.name} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-white">{shelter.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span>{shelter.location}</span>
                    </div>
                  </div>
                  <StatusBadge label={shelter.status} tone={statusTone[shelter.status] ?? 'neutral'} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Capacity</div>
                    <div className="mt-2 text-xl font-bold text-white">{shelter.capacity}</div>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Occupancy</div>
                    <div className="mt-2 text-xl font-bold text-white">{shelter.occupancy}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                    <span>Occupied</span>
                    <span>{occupiedPercent}%</span>
                  </div>
                  <ProgressBar value={occupiedPercent} tone={occupiedPercent > 85 ? 'amber' : 'green'} />
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-300">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                    <span className="font-medium text-white">Available resources:</span> {shelter.availableResources}
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                    <span className="font-medium text-white">Required resources:</span> {shelter.requiredResources}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
