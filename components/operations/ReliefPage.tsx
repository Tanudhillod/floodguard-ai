"use client"

import { useEffect, useState } from 'react'
import { Panel, ProgressBar, SectionHeader, StatusBadge } from '@/components/ui/shared'
import { apiGet, apiPost } from '@/lib/api'

interface ReliefAssessment {
  shelter_id: string
  shelter_name?: string
  population: number
  total_required_cost: number
  amount_funded: number
  status: string
  [key: string]: any
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function ReliefPage() {
  const [assessments, setAssessments] = useState<ReliefAssessment[]>([])
  const [allocated, setAllocated] = useState(0)
  const [spent, setSpent] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<{ assessments: ReliefAssessment[]; allocated: number; spent: number; remaining: number }>('/api/relief-status')
      setAssessments(data.assessments || [])
      setAllocated(data.allocated || 0)
      setSpent(data.spent || 0)
      setRemaining(data.remaining || 0)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const runPlanning = async () => {
    setRunning(true)
    setError(null)
    try {
      await apiPost('/api/module8/run')
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
          onClick={runPlanning}
          disabled={running}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run Relief Planning (Module 8)'}
        </button>
      </div>

      {error && (
        <Panel className="p-4 bg-red-950 border-red-800 text-red-300 text-sm">{error}</Panel>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Panel className="p-5 bg-[#1a3a52] border-[#2d5a7b]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Allocated</div>
          <div className="mt-3 text-3xl font-bold text-white">{currency.format(allocated)}</div>
        </Panel>
        <Panel className="p-5 bg-[#1a3a52] border-[#2d5a7b]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Spent</div>
          <div className="mt-3 text-3xl font-bold text-amber-400">{currency.format(spent)}</div>
        </Panel>
        <Panel className="p-5 bg-[#1a3a52] border-[#2d5a7b]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Remaining</div>
          <div className="mt-3 text-3xl font-bold text-green-400">{currency.format(remaining)}</div>
        </Panel>
      </section>

      <Panel className="p-5 bg-[#1a3a52] border-[#2d5a7b]">
        <SectionHeader eyebrow="Resource allocation" title="Relief assessments (live)" icon="WalletCards" />

        {loading ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : assessments.length === 0 ? (
          <div className="text-sm text-slate-400">No relief assessments yet — click "Run Relief Planning" above.</div>
        ) : (
          <div className="space-y-4">
            {assessments.map((a, idx) => {
              const percentage = a.total_required_cost > 0 ? Math.round((a.amount_funded / a.total_required_cost) * 100) : 0
              return (
                <div key={`${a.shelter_id}-${idx}`} className="rounded-lg border border-[#2d5a7b] bg-[#173b5e] p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-base font-semibold text-white">{a.shelter_name || a.shelter_id}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {currency.format(a.amount_funded)} funded of {currency.format(a.total_required_cost)} — {a.population} people
                      </div>
                    </div>
                    <StatusBadge
                      label={a.status}
                      tone={a.status === 'SHORTAGE' ? 'warning' : a.status === 'FULLY_COVERED' ? 'good' : 'medium'}
                    />
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={percentage} tone={percentage > 85 ? 'amber' : 'blue'} />
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