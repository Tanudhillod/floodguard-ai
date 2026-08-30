"use client"

import Link from "next/link"
import {
  ShieldAlert,
  UserRound,
  Building2,
  ArrowRight,
} from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7fafc] text-[#102a43]">

      {/* Header */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f2742] text-white">
              <ShieldAlert size={19} />
            </div>

            <div>
              <div className="text-base font-semibold tracking-tight">
                FloodGuard
              </div>

              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Emergency response network
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Network online
          </div>

        </div>
      </header>


      {/* Main */}

      <section className="flex min-h-[calc(100vh-74px)] items-center justify-center px-5 py-12">

        <div className="w-full max-w-2xl">

          {/* Intro */}

          <div className="mb-10 text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Emergency operations
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0f2742] sm:text-4xl">
              Welcome to FloodGuard
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
              Select how you want to access the emergency
              response network.
            </p>

          </div>


          {/* Role selection */}

          <div className="grid gap-4 sm:grid-cols-2">

            {/* USER */}

            <Link
              href="/user"
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:p-7"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserRound size={23} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500"
                />

              </div>

              <h2 className="mt-6 text-lg font-semibold text-[#0f2742]">
                User
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Request emergency assistance, send an SOS,
                and access safety information.
              </p>

              <div className="mt-5 text-xs font-semibold text-blue-600">
                Continue as user
              </div>

            </Link>


            {/* ADMINISTRATOR */}

            <Link
              href="/dashboard"
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md sm:p-7"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#0f2742]">
                  <Building2 size={23} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#0f2742]"
                />

              </div>

              <h2 className="mt-6 text-lg font-semibold text-[#0f2742]">
                Administrator
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Monitor incidents, analyze risk, manage shelters,
                routes, resources, and emergency response.
              </p>

              <div className="mt-5 text-xs font-semibold text-[#0f2742]">
                Continue as administrator
              </div>

            </Link>

          </div>


          {/* Footer */}

          <div className="mt-8 text-center">

            <p className="text-[11px] text-slate-400">
              FloodGuard Emergency Response System
            </p>

          </div>

        </div>

      </section>

    </main>
  )
}
