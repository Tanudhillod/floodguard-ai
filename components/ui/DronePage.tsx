"use client"

import { useState } from 'react'
import { droneAnalysis, missions } from '@/lib/mock-data'
import { Icon, Panel, ProgressBar, SectionHeader, StatusBadge } from '@/components/ui/shared'

export default function DronePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setSelectedImage(objectUrl)
  }

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    window.setTimeout(() => setIsAnalyzing(false), 900)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel className="flex min-h-[360px] flex-col items-center justify-center p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/25 bg-sky-500/10 text-sky-200">
            <Icon name="ScanLine" size={32} />
          </div>
          <h3 className="mt-5 text-2xl font-semibold text-white">Upload drone image</h3>
          <p className="mt-2 max-w-md text-sm text-slate-300">Drag and drop an image, or select a mission capture from the current field team feed.</p>

          <div className="mt-5 flex w-full max-w-sm flex-col items-stretch gap-3 sm:flex-row">
            <label className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
              Select image
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            <button className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-200">
              Drone mission
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15"
          >
            <Icon name="Sparkles" size={16} />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </Panel>

        <Panel className="p-5">
          <SectionHeader eyebrow="Latest analysis" title="Detection summary" action={<StatusBadge label={isAnalyzing ? 'Processing' : 'Completed'} tone={isAnalyzing ? 'medium' : 'good'} />} icon="Radar" />

          <div className="relative mt-3 h-[260px] overflow-hidden rounded-2xl border border-slate-700 bg-[linear-gradient(135deg,#0b1d2b,#0c2431_40%,#071622)]">
            {selectedImage ? (
              <img src={selectedImage} alt="Uploaded drone scene" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-[0.18em] text-slate-500">No image selected</div>
            )}

            <span className="absolute left-6 top-7 rounded-full border border-red-400/40 bg-red-500/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Person · Critical</span>
            <span className="absolute right-8 top-20 rounded-full border border-amber-400/40 bg-amber-500/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-950">Person · High</span>
            <span className="absolute left-10 bottom-12 rounded-full border border-sky-400/40 bg-sky-500/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Vehicle · Medium</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-center">
              <div className="text-2xl font-bold text-white">{droneAnalysis.peopleDetected}</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Detected</div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
              <div className="text-2xl font-bold text-red-200">{droneAnalysis.critical}</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-red-200">Critical</div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <div className="text-2xl font-bold text-amber-200">{droneAnalysis.high}</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-200">High</div>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-center">
              <div className="text-2xl font-bold text-sky-200">{droneAnalysis.medium}</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-sky-200">Medium</div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionHeader eyebrow="Model confidence" title="Analysis metrics" icon="ShieldCheck" />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
              <span>Detection confidence</span>
              <span className="font-semibold text-white">{droneAnalysis.confidence}%</span>
            </div>
            <ProgressBar value={droneAnalysis.confidence} tone="green" />
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Recommendation</div>
            <p className="mt-2 text-sm text-slate-200">{droneAnalysis.recommendation}</p>
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionHeader eyebrow="Recent missions" title="Mission feed" icon="Plane" />
        <div className="space-y-3">
          {missions.map((mission) => (
            <div key={mission[0]} className="flex flex-col gap-2 rounded-2xl border border-slate-700 bg-slate-950/60 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{mission[0]}</div>
                <div className="text-xs text-slate-400">{mission[1]}</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <StatusBadge label={mission[2]} tone={mission[2] === 'Completed' ? 'good' : 'medium'} />
                <span>{mission[3]} people detected</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
