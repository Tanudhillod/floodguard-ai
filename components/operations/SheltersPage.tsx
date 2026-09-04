"use client"

import { useEffect, useState } from 'react'
import { Panel, ProgressBar, SectionHeader, StatusBadge } from '@/components/ui/shared'
import { apiGet, apiPost } from '@/lib/api'

interface Shelter {
  shelter_id: string
  name: string
  location_text: string
  latitude?: number
  longitude?: number
  capacity_remaining: number
  current_occupancy: number
  status: string
  [key: string]: any
}

const statusTone: Record<string, 'critical' | 'high' | 'medium' | 'good' | 'neutral' | 'warning'> = {
  OPEN: 'good',
  FULL: 'critical',
}

export default function SheltersPage() {
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<{ shelters: Shelter[] }>('/api/shelters-live')
      setShelters(data.shelters || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const runAllocation = async () => {
    setRunning(true)
    setError(null)
    try {
      await apiPost('/api/module7/run')
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={runAllocation}
          disabled={running}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run Shelter Allocation (Module 7)'}
        </button>
      </div>

      {error && (
        <Panel className="p-4 bg-red-950 border-red-800 text-red-300 text-sm">{error}</Panel>
      )}

      <Panel className="p-5 bg-[#1a3a52] border-[#2d5a7b]">
        <SectionHeader eyebrow="Shelter network" title="Available rescue shelters (live)" icon="House" />

        {loading ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : shelters.length === 0 ? (
          <div className="text-sm text-slate-400">No shelters found in Supabase yet.</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {shelters.map((shelter) => {
              const total = (shelter.capacity_remaining || 0) + (shelter.current_occupancy || 0)
              const occupiedPercent = total > 0 ? Math.round((shelter.current_occupancy / total) * 100) : 0
              return (
                <div key={shelter.shelter_id} className="rounded-lg border border-[#2d5a7b] bg-[#173b5e] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-white">{shelter.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>{shelter.location_text}</span>
                        {shelter.latitude && shelter.longitude ? (
                          <a
                            href={"https://www.google.com/maps?q=" + shelter.latitude + "," + shelter.longitude}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-[#2d5a7b] bg-[#1a3a52] px-2 py-0.5 text-blue-400 transition hover:border-blue-500 hover:text-blue-300"
                          >
                            View on map
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <StatusBadge label={shelter.status} tone={statusTone[shelter.status] ?? 'neutral'} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-[#2d5a7b] bg-[#1a3a52] p-3">
                      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Capacity Remaining</div>
                      <div className="mt-2 text-xl font-bold text-white">{shelter.capacity_remaining}</div>
                    </div>
                    <div className="rounded-md border border-[#2d5a7b] bg-[#1a3a52] p-3">
                      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Occupancy</div>
                      <div className="mt-2 text-xl font-bold text-white">{shelter.current_occupancy}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Occupied</span>
                      <span>{occupiedPercent}%</span>
                    </div>
                    <ProgressBar value={occupiedPercent} tone={occupiedPercent > 85 ? 'amber' : 'green'} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}