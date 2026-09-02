"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import {
  AlertCircle,
  Activity,
  Droplet,
  Gauge,
  Thermometer,
  Wind,
  Radio,
  Zap,
  Clock,
  Leaf,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"

// Mock data for sensor readings (will be replaced with real API data)
const MOCK_SENSOR_DATA = {
  waterLevel: 2.35,
  soilMoisture: 78,
  rainfall: 24.7,
  temperature: 28.5,
  movement: 0.12,
  sensorStatus: "9 sensors connected",
}

const MOCK_CHART_DATA = [
  { time: "00:00", waterLevel: 1.8, rainfall: 2, soilMoisture: 65, movement: 0.08 },
  { time: "04:00", waterLevel: 1.95, rainfall: 5, soilMoisture: 70, movement: 0.1 },
  { time: "08:00", waterLevel: 2.1, rainfall: 8, soilMoisture: 74, movement: 0.11 },
  { time: "12:00", waterLevel: 2.25, rainfall: 15, soilMoisture: 76, movement: 0.12 },
  { time: "16:00", waterLevel: 2.3, rainfall: 20, soilMoisture: 77, movement: 0.12 },
  { time: "20:00", waterLevel: 2.35, rainfall: 24.7, soilMoisture: 78, movement: 0.12 },
]

const MOCK_RISK_TREND = [
  { time: "Now", risk: 78 },
  { time: "+4h", risk: 82 },
  { time: "+8h", risk: 85 },
  { time: "+12h", risk: 88 },
  { time: "+16h", risk: 80 },
  { time: "+20h", risk: 70 },
  { time: "+24h", risk: 60 },
]

const MOCK_ALERTS = [
  { id: 1, severity: "CRITICAL", title: "High flood risk detected", timestamp: "2 min ago" },
  { id: 2, severity: "WARNING", title: "Water level rising rapidly", timestamp: "5 min ago" },
  { id: 3, severity: "WARNING", title: "Heavy rainfall detected", timestamp: "8 min ago" },
]

export default function Dashboard() {
  const [floodRiskData, setFloodRiskData] = useState({
    riskLabel: "HIGH",
    probability: 78,
    confidence: 0.94,
  })

  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Function to get color based on risk level
  const getRiskColor = (label: string) => {
    switch (label) {
      case "LOW":
        return "text-green-600 bg-green-50 border-green-200"
      case "MODERATE":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "HIGH":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "CRITICAL":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getRiskIndicatorColor = (label: string) => {
    switch (label) {
      case "LOW":
        return "from-green-400 to-green-600"
      case "MODERATE":
        return "from-yellow-400 to-yellow-600"
      case "HIGH":
        return "from-orange-400 to-orange-600"
      case "CRITICAL":
        return "from-red-400 to-red-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-green-600">
                FloodGuard AI
              </div>
              <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                Flood Prediction Dashboard
              </h1>
            </div>
            <div className="flex flex-col gap-2 text-right text-sm sm:gap-1">
              <div className="flex items-center gap-2 justify-end">
                <Radio className="h-4 w-4 text-green-600 animate-pulse" />
                <span className="text-gray-600">Live</span>
              </div>
              <div className="text-gray-700 font-medium">{currentTime.toLocaleTimeString()}</div>
              <div className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Live Sensor Readings Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Live Sensor Readings</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {/* Water Level Card */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Water Level
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {MOCK_SENSOR_DATA.waterLevel}
                  </p>
                  <p className="text-xs text-gray-500">meters</p>
                </div>
                <Droplet className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mt-3 text-xs text-orange-600 font-medium">⚠ Rising</div>
            </div>

            {/* Soil Moisture Card */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Soil Moisture
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {MOCK_SENSOR_DATA.soilMoisture}
                  </p>
                  <p className="text-xs text-gray-500">percent</p>
                </div>
                <Leaf className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-3 text-xs text-gray-600">High saturation</div>
            </div>

            {/* Rainfall Card */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Rainfall
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {MOCK_SENSOR_DATA.rainfall}
                  </p>
                  <p className="text-xs text-gray-500">mm</p>
                </div>
                <Wind className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mt-3 text-xs text-orange-600 font-medium">⚠ Heavy</div>
            </div>

            {/* Ground Movement Card */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Movement / Tilt
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {MOCK_SENSOR_DATA.movement}
                  </p>
                  <p className="text-xs text-gray-500">g</p>
                </div>
                <Gauge className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="mt-3 text-xs text-green-600">Normal</div>
            </div>

            {/* Temperature Card */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Temperature
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {MOCK_SENSOR_DATA.temperature}
                  </p>
                  <p className="text-xs text-gray-500">°C</p>
                </div>
                <Thermometer className="h-5 w-5 text-red-500" />
              </div>
              <div className="mt-3 text-xs text-green-600">Stable</div>
            </div>

            {/* Sensor Status Card */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Sensor Status
                  </p>
                  <p className="mt-2 text-lg font-bold text-green-600">Connected</p>
                  <p className="text-xs text-gray-500">{MOCK_SENSOR_DATA.sensorStatus}</p>
                </div>
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div className="mt-3 text-xs text-green-600 font-medium">✓ Operational</div>
            </div>
          </div>
        </section>

        {/* Flood Risk Prediction - Most Important */}
        <section className="mb-8">
          <div className={`rounded-lg border-2 p-6 ${getRiskColor(floodRiskData.riskLabel)}`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold">Flood Risk Prediction</h2>
                <p className="mt-2 text-sm opacity-80">
                  Based on real-time sensor data and ML model analysis
                </p>
              </div>
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-xs uppercase tracking-widest opacity-75">Risk Level</div>
                  <div className="mt-1 text-3xl font-bold">{floodRiskData.riskLabel}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest opacity-75">Probability</div>
                  <div className="mt-1 text-3xl font-bold">{floodRiskData.probability}%</div>
                </div>
                <div className={`h-24 w-24 rounded-full border-4 flex items-center justify-center bg-white/30 ${getRiskColor(floodRiskData.riskLabel)}`}>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{floodRiskData.probability}%</div>
                    <div className="text-xs uppercase tracking-widest">Risk</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded bg-white/40 p-3">
                <div className="text-xs text-gray-600">Model Confidence</div>
                <div className="mt-1 text-xl font-bold">{(floodRiskData.confidence * 100).toFixed(0)}%</div>
              </div>
              <div className="rounded bg-white/40 p-3">
                <div className="text-xs text-gray-600">Model Used</div>
                <div className="mt-1 text-sm font-semibold">best_flood_risk_model.joblib</div>
              </div>
              <div className="rounded bg-white/40 p-3">
                <div className="text-xs text-gray-600">Prediction Time</div>
                <div className="mt-1 text-sm font-semibold">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ML Prediction Pipeline */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">How The Prediction Works</h2>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="grid gap-4 sm:grid-cols-5 items-center">
              {/* Input Data */}
              <div className="text-center">
                <div className="rounded-lg bg-white border border-gray-300 p-4 mb-2">
                  <p className="font-semibold text-gray-900 text-sm mb-2">Sensor Data</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Water Level: {MOCK_SENSOR_DATA.waterLevel}m</p>
                    <p>Rainfall: {MOCK_SENSOR_DATA.rainfall}mm</p>
                    <p>Soil Moisture: {MOCK_SENSOR_DATA.soilMoisture}%</p>
                    <p>Movement: {MOCK_SENSOR_DATA.movement}g</p>
                  </div>
                </div>
                <Activity className="h-5 w-5 text-gray-400 mx-auto" />
              </div>

              {/* Arrow */}
              <div className="text-center hidden sm:block">
                <div className="text-2xl text-gray-400">→</div>
              </div>

              {/* Feature Processing */}
              <div className="text-center">
                <div className="rounded-lg bg-white border border-gray-300 p-4 mb-2">
                  <p className="font-semibold text-gray-900 text-sm">Feature Processing</p>
                  <p className="text-xs text-gray-600 mt-2">Normalization & Scaling</p>
                </div>
                <Activity className="h-5 w-5 text-gray-400 mx-auto" />
              </div>

              {/* Arrow */}
              <div className="text-center hidden sm:block">
                <div className="text-2xl text-gray-400">→</div>
              </div>

              {/* ML Model */}
              <div className="text-center">
                <div className="rounded-lg bg-white border border-gray-300 p-4 mb-2">
                  <p className="font-semibold text-gray-900 text-sm">ML Model</p>
                  <p className="text-xs text-gray-600 mt-2">best_flood_risk_model</p>
                </div>
                <Zap className="h-5 w-5 text-yellow-500 mx-auto" />
              </div>

              {/* Arrow */}
              <div className="text-center hidden sm:block">
                <div className="text-2xl text-gray-400">→</div>
              </div>

              {/* Output */}
              <div className="text-center">
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 mb-2">
                  <p className="font-semibold text-gray-900 text-sm">Flood Risk</p>
                  <p className="text-xs text-orange-600 mt-2 font-bold">{floodRiskData.riskLabel}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-orange-600 mx-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* Sensor Data Charts */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Sensor Data & Trends</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Water Level Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Level Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="waterLevel"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: "#2563eb", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Rainfall Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rainfall Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="rainfall" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Soil Moisture Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Soil Moisture Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="soilMoisture"
                    fill="#22c55e"
                    stroke="#16a34a"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Movement / Tilt Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ground Movement (MPU6050)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="movement"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Flood Risk Trend */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Flood Risk Trend — Next 24 Hours</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={MOCK_RISK_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: "Risk (%)", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="risk"
                  fill="#f97316"
                  stroke="#ea580c"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Sensor Summary & Alerts */}
        <section className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Today's Summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Today's Sensor Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">Average Water Level</span>
                <span className="font-semibold text-gray-900">2.1 m</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">Maximum Water Level</span>
                <span className="font-semibold text-gray-900">2.35 m</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">Total Rainfall</span>
                <span className="font-semibold text-gray-900">24.7 mm</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">Average Soil Moisture</span>
                <span className="font-semibold text-gray-900">72%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">Max Movement/Tilt</span>
                <span className="font-semibold text-gray-900">0.12 g</span>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Alerts</h2>
            <div className="space-y-3">
              {MOCK_ALERTS.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-lg p-3 ${
                    alert.severity === "CRITICAL"
                      ? "bg-red-50 border border-red-200"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  {alert.severity === "CRITICAL" ? (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${alert.severity === "CRITICAL" ? "text-red-900" : "text-yellow-900"}`}>
                      {alert.title}
                    </p>
                    <p className={`text-xs mt-1 ${alert.severity === "CRITICAL" ? "text-red-700" : "text-yellow-700"}`}>
                      {alert.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Flood Risk Heatmap */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Flood Risk Heatmap</h2>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="relative aspect-video bg-gradient-to-br from-green-100 via-yellow-100 to-red-100 rounded-lg overflow-hidden">
              {/* Heatmap visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900">Regional Flood Risk Distribution</h3>
                    <p className="text-sm text-gray-600 mt-1">Risk intensity increases from green to red</p>
                  </div>
                  
                  {/* Heatmap grid */}
                  <div className="inline-grid grid-cols-5 gap-1">
                    {Array.from({ length: 25 }).map((_, idx) => {
                      const intensity = idx / 25
                      const hue = 120 - intensity * 120 // Green to Red
                      const saturation = 70 + intensity * 30
                      const lightness = 80 - intensity * 40
                      return (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-sm border border-gray-300"
                          style={{
                            backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                          }}
                          title={`Risk: ${Math.round(intensity * 100)}%`}
                        />
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-green-500" />
                      <span>Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-yellow-500" />
                      <span>Moderate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-orange-500" />
                      <span>High</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-red-500" />
                      <span>Critical</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Status */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">System Status</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">ML Model</p>
                  <p className="text-xs text-green-600 mt-1">Operational</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">API</p>
                  <p className="text-xs text-green-600 mt-1">Connected</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Sensor Network</p>
                  <p className="text-xs text-green-600 mt-1">Operational</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">LoRa</p>
                  <p className="text-xs text-green-600 mt-1">Connected</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-4 text-sm">
              <span className="text-gray-600">Last System Check</span>
              <span className="font-semibold text-gray-900">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
