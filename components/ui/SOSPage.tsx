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
        <SectionHeader eyebrow="Incoming alerts" title="Emergency request queue" icon="Siren" action={<button className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-[#2563eb]">Refresh</button>} />

        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-[1.1fr_1.4fr_.6fr_.7fr_1fr] gap-4 border-b border-slate-200 px-4 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            <span>Priority / ID</span><span>Location</span><span>People</span><span>Time</span><span>Status / action</span>
          </div>
          <div className="min-w-[720px] divide-y divide-slate-200">
          {sos.map((request) => (
            <div key={request.id} className={`grid grid-cols-[1.1fr_1.4fr_.6fr_.7fr_1fr] items-center gap-4 px-4 py-4 ${request.priority === 'CRITICAL' ? 'bg-red-50' : 'bg-white'}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${request.priority === 'CRITICAL' ? 'bg-[#d92d20]' : request.priority === 'HIGH' ? 'bg-[#e58a00]' : 'bg-[#2563eb]'}`} />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#102A43]">{request.id}</span>
                    <StatusBadge label={request.priority} tone={priorityTone[request.priority] ?? 'neutral'} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                    <Icon name="MapPin" size={15} />
                    {request.location}
                  </div>
                </div>

                <span className="text-sm text-slate-700">{request.location}</span>
                <span className="text-sm font-semibold text-[#0f2742]">{request.people}</span>
                <span className="text-xs text-slate-500">{request.time}</span>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <StatusBadge label={request.status} tone={request.status === 'Pending' ? 'warning' : request.status === 'Rescue Assigned' ? 'medium' : 'good'} />
                  <span className="hidden xl:inline">{request.factors}</span>
                </div>
            </div>
          ))}
          </div>
        </div>
      </Panel>
    </div>
  )
}
