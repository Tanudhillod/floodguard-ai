"use client"

import { useEffect, useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle2,
  Droplet,
  Gauge,
  Home,
  Leaf,
  MapPin,
  Megaphone,
  Radio,
  Shield,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react"

/*
 * IMPORTANT:
 * This Dashboard component intentionally DOES NOT render a sidebar or top header.
 * Your application layout should render those globally.
 * This prevents the duplicate header/sidebar problem visible in the screenshot.
 *
 * Keep your existing API/Supabase/model hooks in the marked data section below.
 * The UI structure is independent of those data sources.
 */

const SENSOR_DATA = {
  waterLevel: 2.35,
  rainfall: 24.7,
  soilMoisture: 78,
  temperature: 28.5,
  movement: 0.12,
  waterFlow: 3.4,
}

const SENSOR_HISTORY = [
  { time: "08:00", waterLevel: 1.8, rainfall: 8, soilMoisture: 65, temperature: 26.2, movement: 0.08, waterFlow: 1.8 },
  { time: "10:00", waterLevel: 1.95, rainfall: 11, soilMoisture: 69, temperature: 27.0, movement: 0.09, waterFlow: 2.1 },
  { time: "12:00", waterLevel: 2.08, rainfall: 14, soilMoisture: 72, temperature: 27.8, movement: 0.10, waterFlow: 2.7 },
  { time: "14:00", waterLevel: 2.2, rainfall: 17, soilMoisture: 74, temperature: 28.1, movement: 0.11, waterFlow: 3.0 },
  { time: "16:00", waterLevel: 2.28, rainfall: 21, soilMoisture: 76, temperature: 28.4, movement: 0.11, waterFlow: 3.2 },
  { time: "18:00", waterLevel: 2.35, rainfall: 24.7, soilMoisture: 78, temperature: 28.5, movement: 0.12, waterFlow: 3.4 },
]

const SOS_REQUESTS = [
  { id: "SOS-1024", location: "Yamuna Bank", people: 5, severity: "CRITICAL", status: "PENDING", time: "2 min ago" },
  { id: "SOS-1025", location: "Laxmi Nagar", people: 2, severity: "HIGH", status: "RESCUE ASSIGNED", time: "5 min ago" },
  { id: "SOS-1026", location: "Mayur Vihar", people: 1, severity: "MEDIUM", status: "PENDING", time: "8 min ago" },
  { id: "SOS-1027", location: "Shahdara", people: 7, severity: "HIGH", status: "RESPONDING", time: "11 min ago" },
]

const SHELTERS = [
  { name: "Community Shelter A", location: "Mayur Vihar", occupied: 372, capacity: 500, status: "OPEN" },
  { name: "Relief Center B", location: "Laxmi Nagar", occupied: 284, capacity: 300, status: "NEAR CAPACITY" },
  { name: "School Shelter C", location: "Shahdara", occupied: 250, capacity: 250, status: "FULL" },
]

const ALERTS = [
  { severity: "CRITICAL", title: "Rapid water-level increase detected", description: "Yamuna Bank · Deploy rescue team to affected zone.", time: "2 min ago" },
  { severity: "HIGH", title: "Heavy rainfall detected", description: "East Delhi sensor grid · Review flood-risk assessment.", time: "8 min ago" },
  { severity: "WARNING", title: "Shelter approaching capacity", description: "Community Shelter A · Prepare overflow shelter B.", time: "14 min ago" },
]

type SensorKey = keyof typeof SENSOR_DATA

const SENSOR_META: Record<SensorKey, { title: string; unit: string }> = {
  waterLevel: { title: "Water Level", unit: "m" },
  rainfall: { title: "Rainfall", unit: "mm" },
  soilMoisture: { title: "Soil Moisture", unit: "%" },
  temperature: { title: "Temperature", unit: "°C" },
  movement: { title: "Movement / Tilt", unit: "g" },
  waterFlow: { title: "Water Flow", unit: "m/s" },
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedSensor, setSelectedSensor] = useState<SensorKey>("waterLevel")

  // Replace this object with your existing Model 1 API/Supabase state.
  const [floodRiskData] = useState({
    riskLabel: "HIGH",
    probability: 78,
    confidence: 0.94,
  })

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const graph = useMemo(() => SENSOR_META[selectedSensor], [selectedSensor])

  const risk = floodRiskData.riskLabel
  const riskColor =
    risk === "CRITICAL"
      ? "text-red-600"
      : risk === "HIGH"
        ? "text-orange-600"
        : risk === "MODERATE"
          ? "text-yellow-600"
          : "text-green-600"

  const riskBadge =
    risk === "CRITICAL"
      ? "bg-red-50 text-red-600"
      : risk === "HIGH"
        ? "bg-orange-50 text-orange-600"
        : risk === "MODERATE"
          ? "bg-yellow-50 text-yellow-600"
          : "bg-green-50 text-green-600"

  const broadcastAlert = () => {
    window.alert("Broadcast alert initiated.")
  }

  return (
    <main className="min-h-screen bg-[#eef4f8] text-slate-800">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">

        {/* PAGE TITLE */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-[0.2em] text-blue-600">
                FLOODGUARD
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-[28px]">
                Emergency Response Dashboard
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
                Current flood-risk predictions, live sensor conditions,
                emergency requests and shelter infrastructure.
              </p>
            </div>

            <button
              onClick={broadcastAlert}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Megaphone className="h-4 w-4" />
              Broadcast Alert
            </button>
          </div>
        </section>

        {/* KPI ROW */}
        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Droplet />}
            label="Flood Risk"
            value={`${floodRiskData.probability}%`}
            badge="HIGH RISK"
            badgeClass="bg-red-50 text-red-600"
            valueClass={riskColor}
          />
          <StatCard
            icon={<AlertCircle />}
            label="Active SOS"
            value="34"
            badge="8 CRITICAL"
            badgeClass="bg-orange-50 text-orange-600"
            valueClass="text-orange-500"
          />
          <StatCard
            icon={<Shield />}
            label="Rescue Teams"
            value="08"
            badge="6 RESPONDING"
            badgeClass="bg-green-50 text-green-600"
            valueClass="text-green-600"
          />
          <StatCard
            icon={<Home />}
            label="Available Shelters"
            value="12"
            badge="3 NEAR CAPACITY"
            badgeClass="bg-slate-100 text-slate-600"
            valueClass="text-slate-800"
          />
          <StatCard
            icon={<Bell />}
            label="Critical Alerts"
            value="05"
            badge="+2 THIS HOUR"
            badgeClass="bg-orange-50 text-orange-600"
            valueClass="text-orange-500"
          />
        </section>

        {/* HEATMAP + MODEL */}
        <section className="mb-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">

          {/* HEATMAP */}
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                  LIVE FLOOD MAP
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-700">
                  Flood Risk Heatmap
                </h2>
              </div>
              <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                Expand
              </button>
            </div>

            <div className="relative h-[390px] overflow-hidden rounded-lg border border-slate-200 bg-[#e6eef5]">

              {/* map background */}
              <div className="absolute inset-0">
                <div className="absolute left-[14%] top-0 h-full w-px rotate-[4deg] bg-slate-300/50" />
                <div className="absolute left-[31%] top-0 h-full w-px rotate-[18deg] bg-slate-300/40" />
                <div className="absolute left-[51%] top-0 h-full w-[18px] -skew-x-[10deg] bg-blue-400/40" />
                <div className="absolute left-[72%] top-0 h-full w-px -rotate-[12deg] bg-slate-300/40" />
                <div className="absolute left-0 top-[27%] h-px w-full rotate-[3deg] bg-slate-300/35" />
                <div className="absolute left-0 top-[58%] h-px w-full -rotate-[5deg] bg-slate-300/35" />
              </div>

              {/* heat zones */}
              <HeatZone left="17%" top="15%" size="medium" risk="LOW" />
              <HeatZone left="37%" top="44%" size="large" risk="MODERATE" />
              <HeatZone left="57%" top="51%" size="large" risk="CRITICAL" />
              <HeatZone left="71%" top="23%" size="medium" risk="HIGH" />
              <HeatZone left="78%" top="62%" size="medium" risk="CRITICAL" />

              <MapPoint left="31%" top="35%" label="Mayur Vihar" />
              <MapPoint left="59%" top="62%" label="Yamuna Bank" />
              <MapPoint left="70%" top="35%" label="Laxmi Nagar" />
              <MapPoint left="79%" top="65%" label="Shahdara" />

              <div className="absolute bottom-3 left-3 rounded-md bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm">
                EAST DELHI · LIVE RISK ZONES
              </div>

              <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-x-3 gap-y-1 rounded-md bg-white px-3 py-2 text-[10px] shadow-sm">
                <LegendItem label="Low" className="bg-green-500" />
                <LegendItem label="Moderate" className="bg-yellow-400" />
                <LegendItem label="High" className="bg-orange-500" />
                <LegendItem label="Critical" className="bg-red-600" />
              </div>
            </div>
          </section>

          {/* MODEL 1 */}
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                  MODEL 1
                </div>
                <h2 className="text-lg font-bold text-slate-700">
                  Flood Risk Prediction
                </h2>
              </div>
            </div>

            <div className="flex justify-center py-7">
              <div className={`flex h-40 w-40 flex-col items-center justify-center rounded-full border-[10px] border-slate-200 bg-orange-50 ${riskColor}`}>
                <div className="text-4xl font-bold leading-none">
                  {floodRiskData.probability}%
                </div>
                <div className="mt-2 text-[11px] font-bold tracking-[0.16em]">
                  {risk} RISK
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Model confidence</span>
                <span className="font-bold text-slate-700">
                  {(floodRiskData.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${floodRiskData.confidence * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-100">
              <InfoRow label="Prediction" value={risk} valueClass={riskBadge} />
              <InfoRow label="Model" value="Model 1" />
              <InfoRow
                label="Last prediction"
                value={currentTime.toLocaleTimeString("en-IN")}
              />
            </div>

            <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              Prediction is generated using the current sensor readings and
              the trained flood-risk model.
            </div>
          </section>
        </section>

        {/* SOS + SHELTERS */}
        <section className="mb-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">

          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                  PRIORITY QUEUE
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-700">
                  Emergency Requests
                </h2>
              </div>
              <button className="text-xs font-medium text-slate-500 hover:text-blue-600">
                View all
              </button>
            </div>

            <div className="space-y-2">
              {SOS_REQUESTS.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">
                        {request.id}
                      </span>
                      <span className={`rounded border px-1.5 py-0.5 text-[8px] font-bold ${severityClass(request.severity)}`}>
                        {request.severity}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {request.location}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 text-xs text-slate-500">
                    <span>{request.people} people</span>
                    <span>{request.time}</span>
                    <span className="rounded border border-slate-200 px-2 py-1 text-[8px] font-bold text-slate-500">
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                SHELTER STATUS
              </div>
              <h2 className="mt-1 text-lg font-bold text-slate-700">
                Network Summary
              </h2>
            </div>

            <div className="space-y-3">
              {SHELTERS.map((shelter) => {
                const percentage = Math.round((shelter.occupied / shelter.capacity) * 100)
                const barClass =
                  percentage >= 100
                    ? "bg-red-500"
                    : percentage >= 90
                      ? "bg-orange-500"
                      : "bg-green-600"

                return (
                  <div key={shelter.name} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-700">
                          {shelter.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {shelter.location}
                        </div>
                      </div>
                      <span className={`rounded px-2 py-1 text-[8px] font-bold ${shelterClass(shelter.status)}`}>
                        {shelter.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {shelter.occupied}/{shelter.capacity}
                      </span>
                      <span className="font-medium text-slate-500">
                        {percentage}% occupied
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${barClass}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </section>

        {/* SENSOR CARDS */}
        <section className="mb-5">
          <div className="mb-3">
            <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
              SENSOR NETWORK
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-700">
              Live Monitoring
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <SensorCard icon={<Droplet />} title="Water Level" value={SENSOR_DATA.waterLevel} unit="m" status="HIGH" statusClass="bg-orange-50 text-orange-600" />
            <SensorCard icon={<Wind />} title="Rainfall" value={SENSOR_DATA.rainfall} unit="mm" status="WARNING" statusClass="bg-orange-50 text-orange-600" />
            <SensorCard icon={<Leaf />} title="Soil Moisture" value={SENSOR_DATA.soilMoisture} unit="%" status="HIGH" statusClass="bg-blue-50 text-blue-600" />
            <SensorCard icon={<Thermometer />} title="Temperature" value={SENSOR_DATA.temperature} unit="°C" status="NORMAL" statusClass="bg-slate-100 text-slate-600" />
            <SensorCard icon={<Gauge />} title="Movement / Tilt" value={SENSOR_DATA.movement} unit="g" status="NORMAL" statusClass="bg-green-50 text-green-600" />
            <SensorCard icon={<Activity />} title="Water Flow" value={SENSOR_DATA.waterFlow} unit="m/s" status="CRITICAL" statusClass="bg-red-50 text-red-600" />
          </div>
        </section>

        {/* SENSOR TREND */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                SENSOR ANALYTICS
              </div>
              <h2 className="mt-1 text-lg font-bold text-slate-700">
                Live Sensor Trends
              </h2>
            </div>

            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value as SensorKey)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500 sm:w-48"
            >
              <option value="waterLevel">Water Level</option>
              <option value="rainfall">Rainfall</option>
              <option value="soilMoisture">Soil Moisture</option>
              <option value="temperature">Temperature</option>
              <option value="movement">Ground Movement</option>
              <option value="waterFlow">Water Flow</option>
            </select>
          </div>

          <div className="mt-4 h-[310px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SENSOR_HISTORY} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={selectedSensor}
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-1 border-t border-slate-100 pt-3 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {graph.title} readings · Unit: {graph.unit}
            </span>
            <span className="inline-flex items-center gap-1">
              <Radio className="h-3 w-3 text-green-600" />
              Updated {currentTime.toLocaleTimeString("en-IN")}
            </span>
          </div>
        </section>

        {/* ALERTS + READINESS */}
        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                  RECENT ALERTS
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-700">
                  What needs attention
                </h2>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {ALERTS.map((alert) => (
                <div key={alert.title} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 gap-3">
                    <span className={`mt-0.5 rounded px-2 py-1 text-[8px] font-bold ${severityClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{alert.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{alert.description}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400">{alert.time}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                  OPERATIONAL READINESS
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-700">
                  Response Coverage
                </h2>
              </div>
            </div>

            <CoverageBar label="Rescue teams responding" value="6 / 8" percentage={75} />
            <CoverageBar label="Shelter capacity available" value="27%" percentage={27} />

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <span className="text-slate-400">Last system update</span>
              <span className="font-semibold text-green-600">12 sec ago</span>
            </div>
          </section>
        </section>

        {/* Keep this only if you want the infrastructure footer section. */}
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                SYSTEM STATUS
              </div>
              <h2 className="mt-1 text-lg font-bold text-slate-700">
                FloodGuard Infrastructure
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              All systems operational
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SystemStatus title="ML Model" status="Operational" />
            <SystemStatus title="API" status="Connected" />
            <SystemStatus title="Sensor Network" status="Operational" />
            <SystemStatus title="LoRa" status="Connected" />
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({
  icon,
  label,
  value,
  badge,
  badgeClass,
  valueClass,
}: {
  icon: React.ReactNode
  label: string
  value: string
  badge: string
  badgeClass: string
  valueClass: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-blue-600">
          {icon}
        </div>
        <span className={`max-w-[120px] rounded px-2 py-1 text-center text-[8px] font-bold leading-3 ${badgeClass}`}>
          {badge}
        </span>
      </div>
      <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</div>
    </div>
  )
}

function SensorCard({
  icon,
  title,
  value,
  unit,
  status,
  statusClass,
}: {
  icon: React.ReactNode
  title: string
  value: number
  unit: string
  status: string
  statusClass: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-h-[38px] items-start justify-between gap-2">
        <div className="min-w-0 text-xs font-medium leading-4 text-slate-500">{title}</div>
        <span className={`shrink-0 rounded px-2 py-1 text-[8px] font-bold ${statusClass}`}>{status}</span>
      </div>

      <div className="mt-3 flex items-end gap-1">
        <span className="text-2xl font-bold text-slate-700">{value}</span>
        <span className="mb-1 text-xs text-slate-400">{unit}</span>
      </div>

      <div className="mt-3 flex items-center gap-1 text-[9px] font-medium text-green-600">
        <Radio className="h-3 w-3" />
        LIVE · 12 SEC AGO
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  valueClass = "",
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={`rounded px-1.5 py-0.5 font-semibold text-slate-700 ${valueClass}`}>{value}</span>
    </div>
  )
}

function CoverageBar({
  label,
  value,
  percentage,
}: {
  label: string
  value: string
  percentage: number
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function SystemStatus({ title, status }: { title: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 p-3">
      <div>
        <div className="text-xs font-semibold text-slate-700">{title}</div>
        <div className="mt-1 text-[10px] text-green-600">{status}</div>
      </div>
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    </div>
  )
}

function severityClass(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "border-red-100 bg-red-50 text-red-600"
    case "HIGH":
      return "border-orange-100 bg-orange-50 text-orange-600"
    case "MEDIUM":
      return "border-blue-100 bg-blue-50 text-blue-600"
    default:
      return "border-slate-100 bg-slate-50 text-slate-600"
  }
}

function shelterClass(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-green-50 text-green-700"
    case "NEAR CAPACITY":
      return "bg-orange-50 text-orange-700"
    case "FULL":
      return "bg-red-50 text-red-700"
    default:
      return "bg-slate-50 text-slate-600"
  }
}

function LegendItem({ label, className }: { label: string; className: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      <span className="text-slate-500">{label}</span>
    </span>
  )
}

function HeatZone({
  left,
  top,
  size,
  risk,
}: {
  left: string
  top: string
  size: "small" | "medium" | "large"
  risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
}) {
  const sizes = {
    small: "h-12 w-12",
    medium: "h-20 w-20",
    large: "h-32 w-32",
  }

  const colors = {
    LOW: "bg-green-400/25",
    MODERATE: "bg-yellow-400/30",
    HIGH: "bg-orange-500/35",
    CRITICAL: "bg-red-500/45",
  }

  return (
    <div
      className={`absolute rounded-full blur-2xl ${sizes[size]} ${colors[risk]}`}
      style={{ left, top }}
    />
  )
}

function MapPoint({
  left,
  top,
  label,
}: {
  left: string
  top: string
  label: string
}) {
  return (
    <div className="absolute" style={{ left, top }}>
      <div className="relative">
        <div className="h-3 w-3 rounded-full border-2 border-white bg-red-600 shadow-sm" />
        <div className="absolute left-4 top-[-5px] whitespace-nowrap rounded bg-white px-2 py-1 text-[9px] font-semibold text-slate-600 shadow-sm">
          {label}
        </div>
      </div>
    </div>
  )
}
