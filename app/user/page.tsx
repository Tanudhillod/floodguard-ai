"use client"

import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  MapPin,
  ShieldAlert,
  Users,
} from "lucide-react"

export default function UserDashboard() {
  return (
    <main className="min-h-screen bg-[#f7fafc] text-[#102a43]">

      {/* ============================================================
          HEADER
      ============================================================ */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f2742] text-white">
              <ShieldAlert size={18} />
            </div>

            <div>
              <div className="text-base font-semibold tracking-tight">
                FloodGuard
              </div>

              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Emergency assistance
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Network online
          </div>

        </div>
      </header>


      {/* ============================================================
          DASHBOARD
      ============================================================ */}

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">

        {/* GREETING */}

        <div className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Emergency dashboard
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f2742]">
            How can we help?
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Request emergency assistance, check your requests,
            or access safety information.
          </p>

        </div>


        {/* ============================================================
            SOS CARD
        ============================================================ */}

        <div className="overflow-hidden rounded-2xl border border-red-100 bg-white">

          <div className="p-6 sm:p-8">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <ShieldAlert size={24} />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-red-500">
                    Emergency
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-[#0f2742]">
                    Need immediate help?
                  </h2>

                  <p className="mt-1 max-w-lg text-sm leading-6 text-slate-500">
                    Send an SOS request to the FloodGuard response
                    network. Your location and situation can be
                    shared with emergency responders.
                  </p>

                </div>

              </div>


              <Link
                href="/user/sos"
                className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#c62828] px-6 text-sm font-semibold text-white transition hover:bg-[#ad2020] active:scale-[0.98]"
              >
                <ShieldAlert size={17} />
                Send SOS
              </Link>

            </div>

          </div>


          {/* STATUS STRIP */}

          <div className="grid border-t border-red-100 bg-red-50/40 sm:grid-cols-3">

            <DashboardStatus
              icon={<MapPin size={16} />}
              title="Location"
              value="Shared securely"
            />

            <DashboardStatus
              icon={<Users size={16} />}
              title="Response"
              value="Live network"
            />

            <DashboardStatus
              icon={<CheckCircle2 size={16} />}
              title="Availability"
              value="24 / 7"
            />

          </div>

        </div>


        {/* ============================================================
            OTHER USER OPTIONS
        ============================================================ */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          {/* MY REQUESTS */}

          <button
            disabled
            className="group rounded-xl border border-slate-200 bg-white p-5 text-left opacity-90"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <FileText size={18} />
              </div>

              <ArrowRight
                size={17}
                className="text-slate-300"
              />

            </div>

            <h3 className="mt-4 text-sm font-semibold text-[#0f2742]">
              My requests
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              View the status of emergency requests you have sent.
            </p>

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Coming soon
            </p>

          </button>


          {/* SAFETY */}

          <button
            disabled
            className="group rounded-xl border border-slate-200 bg-white p-5 text-left opacity-90"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <ShieldAlert size={18} />
              </div>

              <ArrowRight
                size={17}
                className="text-slate-300"
              />

            </div>

            <h3 className="mt-4 text-sm font-semibold text-[#0f2742]">
              Safety information
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Access flood safety guidance and emergency instructions.
            </p>

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Coming soon
            </p>

          </button>

        </div>


        {/* ============================================================
            FOOTER NOTE
        ============================================================ */}

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4">

          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0 text-green-600"
          />

          <p className="text-xs leading-5 text-slate-500">
            FloodGuard emergency assistance is available around
            the clock. Only send an SOS when you genuinely need
            emergency assistance.
          </p>

        </div>

      </section>

    </main>
  )
}


/* ================================================================
   DASHBOARD STATUS
================================================================ */

function DashboardStatus({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode
  title: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 border-b border-red-100 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">

      <div className="text-slate-400">
        {icon}
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </div>

        <div className="mt-0.5 text-xs font-medium text-[#0f2742]">
          {value}
        </div>
      </div>

    </div>
  )
}