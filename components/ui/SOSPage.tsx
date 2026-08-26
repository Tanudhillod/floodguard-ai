"use client"

import { sos } from '@/lib/mock-data'
import { Icon, Panel, SectionHeader, StatusBadge } from '@/components/ui/shared'

const priorityTone: Record<string, 'critical' | 'high' | 'medium' | 'good' | 'neutral'> = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'neutral',
}

export default function SOSPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <SectionHeader eyebrow="Incoming alerts" title="Emergency request queue" icon="Siren" action={<button className="text-xs font-medium text-sky-300">Refresh</button>} />

        <div className="space-y-3">
          {sos.map((request) => (
            <div key={request.id} className={`rounded-2xl border p-4 ${request.priority === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700 bg-slate-950/60'}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{request.id}</span>
                    <StatusBadge label={request.priority} tone={priorityTone[request.priority] ?? 'neutral'} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                    <Icon name="MapPin" size={15} />
                    {request.location}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 md:justify-end">
                  <span>{request.people} people</span>
                  <span>{request.time}</span>
                  <StatusBadge label={request.status} tone={request.status === 'Pending' ? 'warning' : request.status === 'Rescue Assigned' ? 'medium' : 'good'} />
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-300">
                <span className="font-medium text-white">Risk factors:</span> {request.factors}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
