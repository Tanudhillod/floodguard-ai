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
              <div key={shelter.name} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-[#0f2742]">{shelter.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span>{shelter.location}</span>
                    </div>
                  </div>
                  <StatusBadge label={shelter.status} tone={statusTone[shelter.status] ?? 'neutral'} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-[#D6E2EE] bg-white p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Capacity</div>
                    <div className="mt-2 text-xl font-bold text-[#0f2742]">{shelter.capacity}</div>
                  </div>
                  <div className="rounded-md border border-[#D6E2EE] bg-white p-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Occupancy</div>
                    <div className="mt-2 text-xl font-bold text-[#0f2742]">{shelter.occupancy}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                    <span>Occupied</span>
                    <span>{occupiedPercent}%</span>
                  </div>
                  <ProgressBar value={occupiedPercent} tone={occupiedPercent > 85 ? 'amber' : 'green'} />
                </div>

                <div className="mt-4 grid gap-2 text-sm text-[#486581]">
                  <div className="rounded-md border border-[#D6E2EE] bg-[#EAF3F8] p-3 text-[#334E68]">
                    <span className="font-medium text-[#0f2742]">Available resources:</span> {shelter.availableResources}
                  </div>
                  <div className="rounded-md border border-[#D6E2EE] bg-[#FFF7ED] p-3 text-[#334E68]">
                    <span className="font-medium text-[#0f2742]">Required resources:</span> {shelter.requiredResources}
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
