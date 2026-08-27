"use client"

import { useEffect, useState } from "react"
import { droneAnalysis } from "@/lib/mock-data"
import {
  Icon,
  Panel,
  ProgressBar,
  SectionHeader,
  StatusBadge,
} from "@/components/ui/shared"

type Detection = {
  x1: number
  y1: number
  x2: number
  y2: number
  confidence: number
}

type DetectionHistory = {
  id: string
  droneId: string
  filename: string
  peopleCount: number
  confidence: number
  timestamp: string
  status: "Completed"
}

const HISTORY_KEY = "floodguard_detection_history"

export default function DronePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [droneId, setDroneId] = useState("DG-001")

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [peopleCount, setPeopleCount] = useState<number | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [error, setError] = useState<string | null>(null)

  const [history, setHistory] = useState<DetectionHistory[]>([])

  // ============================================================
  // LOAD DETECTION HISTORY
  // ============================================================

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY)

      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch (error) {
      console.error(
        "Could not load detection history:",
        error
      )
    }
  }, [])

  // ============================================================
  // SELECT IMAGE
  // ============================================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    setSelectedFile(file)

    const objectUrl = URL.createObjectURL(file)

    setSelectedImage(objectUrl)
    setResultImage(null)

    setPeopleCount(null)
    setDetections([])
    setError(null)
  }

  // ============================================================
  // ANALYZE IMAGE
  // ============================================================

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a drone image first.")
      return
    }

    if (!droneId.trim()) {
      setError("Please enter a drone ID.")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()

      formData.append(
        "file",
        selectedFile
      )

      const response = await fetch(
        "http://127.0.0.1:8000/predict",
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        const errorText = await response.text()

        throw new Error(
          errorText || "Drone analysis failed."
        )
      }

      const contentType =
        response.headers.get("content-type")

      if (!contentType) {
        throw new Error(
          "Backend did not return a content type."
        )
      }

      const boundaryMatch =
        contentType.match(
          /boundary=([^;]+)/
        )

      if (!boundaryMatch) {
        throw new Error(
          "Could not find multipart boundary in response."
        )
      }

      const boundary =
        boundaryMatch[1]

      const responseBuffer =
        await response.arrayBuffer()

      const responseText =
        new TextDecoder(
          "latin1"
        ).decode(responseBuffer)

      const delimiter =
        `--${boundary}`

      const parts =
        responseText.split(
          delimiter
        )

      // ========================================================
      // READ METADATA
      // ========================================================

      let metadata: {
        success: boolean
        filename: string
        people_count: number
        detections: Detection[]
      } | null = null

      for (const part of parts) {
        if (
          part.includes(
            "application/json"
          ) &&
          part.includes(
            "metadata"
          )
        ) {
          const jsonStart =
            part.indexOf(
              "\r\n\r\n"
            )

          if (jsonStart !== -1) {
            const jsonText =
              part
                .substring(
                  jsonStart + 4
                )
                .trim()

            try {
              metadata =
                JSON.parse(
                  jsonText
                )
            } catch {
              throw new Error(
                "Could not parse detection metadata."
              )
            }
          }
        }
      }

      if (!metadata) {
        throw new Error(
          "No detection metadata received from backend."
        )
      }

      // ========================================================
      // UPDATE CURRENT RESULT
      // ========================================================

      setPeopleCount(
        metadata.people_count
      )

      setDetections(
        metadata.detections
      )

      // ========================================================
      // CALCULATE AVERAGE CONFIDENCE
      // ========================================================

      const averageConfidence =
        metadata.detections.length > 0
          ? Math.round(
              (
                metadata.detections.reduce(
                  (
                    sum,
                    detection
                  ) =>
                    sum +
                    detection.confidence,
                  0
                ) /
                  metadata.detections.length
              ) * 100
            )
          : 0

      // ========================================================
      // SAVE TO DETECTION HISTORY
      // ========================================================

      const newHistoryItem: DetectionHistory = {
        id:
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`,

        droneId:
          droneId.trim(),

        filename:
          selectedFile.name,

        peopleCount:
          metadata.people_count,

        confidence:
          averageConfidence,

        timestamp:
          new Date().toISOString(),

        status:
          "Completed",
      }

      setHistory(
        (previousHistory) => {
          const updatedHistory = [
            newHistoryItem,
            ...previousHistory,
          ]

          // Keep latest 20 detections
          const limitedHistory =
            updatedHistory.slice(
              0,
              20
            )

          localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(
              limitedHistory
            )
          )

          return limitedHistory
        }
      )

      // ========================================================
      // EXTRACT ANNOTATED IMAGE
      // ========================================================

      const bytes =
        new Uint8Array(
          responseBuffer
        )

      let jpegStart = -1
      let jpegEnd = -1

      // JPEG START: FF D8
      for (
        let i = 0;
        i < bytes.length - 1;
        i++
      ) {
        if (
          bytes[i] === 0xff &&
          bytes[i + 1] === 0xd8
        ) {
          jpegStart = i
          break
        }
      }

      // JPEG END: FF D9
      if (jpegStart !== -1) {
        for (
          let i =
            jpegStart + 2;
          i <
            bytes.length - 1;
          i++
        ) {
          if (
            bytes[i] === 0xff &&
            bytes[i + 1] === 0xd9
          ) {
            jpegEnd =
              i + 2
            break
          }
        }
      }

      if (
        jpegStart !== -1 &&
        jpegEnd !== -1
      ) {
        const imageBytes =
          bytes.slice(
            jpegStart,
            jpegEnd
          )

        const blob =
          new Blob(
            [imageBytes],
            {
              type:
                "image/jpeg",
            }
          )

        const imageUrl =
          URL.createObjectURL(
            blob
          )

        setResultImage(
          imageUrl
        )
      }
    } catch (err) {
      console.error(
        "Drone analysis error:",
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the image."
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ============================================================
  // CURRENT AVERAGE CONFIDENCE
  // ============================================================

  const currentConfidence =
    detections.length > 0
      ? Math.round(
          (
            detections.reduce(
              (
                sum,
                detection
              ) =>
                sum +
                detection.confidence,
              0
            ) /
              detections.length
          ) * 100
        )
      : 0

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    timestamp: string
  ) => {
    return new Date(
      timestamp
    ).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    )
  }

  return (
    <div className="space-y-6">

      {/* ==================================================
          UPLOAD + RESULT
      ================================================== */}

      <div className="grid gap-5 xl:grid-cols-2">

        {/* UPLOAD PANEL */}

        <Panel className="flex min-h-[360px] flex-col items-center justify-center p-6 text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/25 bg-sky-500/10 text-sky-200">
            <Icon
              name="ScanLine"
              size={32}
            />
          </div>

          <h3 className="mt-5 text-2xl font-semibold text-white">
            Upload drone image
          </h3>

          <p className="mt-2 max-w-md text-sm text-slate-300">
            Upload a drone image to detect people using the FloodGuard AI model.
          </p>

          {/* DRONE ID */}

          <div className="mt-4 w-full max-w-sm text-left">

            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Drone ID
            </label>

            <input
              type="text"
              value={droneId}
              onChange={(event) =>
                setDroneId(
                  event.target.value
                )
              }
              placeholder="Example: DG-001"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500"
            />

          </div>

          <div className="mt-4 flex w-full max-w-sm flex-col items-stretch gap-3 sm:flex-row">

            <label className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">

              Select image

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={
                  handleFileChange
                }
              />

            </label>

            <button
              type="button"
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-200"
            >
              Drone mission
            </button>

          </div>

          <button
            type="button"
            onClick={
              handleAnalyze
            }
            disabled={
              isAnalyzing ||
              !selectedFile
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <Icon
              name="Sparkles"
              size={16}
            />

            {isAnalyzing
              ? "Analyzing..."
              : "Analyze Image"}

          </button>

          {error && (
            <div className="mt-4 max-w-sm rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

        </Panel>


        {/* RESULT PANEL */}

        <Panel className="p-5">

          <SectionHeader
            eyebrow="Latest analysis"
            title="Detection summary"
            action={
              <StatusBadge
                label={
                  isAnalyzing
                    ? "Processing"
                    : peopleCount !== null
                      ? "Completed"
                      : "Waiting"
                }
                tone={
                  isAnalyzing
                    ? "medium"
                    : peopleCount !== null
                      ? "good"
                      : "medium"
                }
              />
            }
            icon="Radar"
          />

          <div className="relative mt-3 h-[260px] overflow-hidden rounded-2xl border border-slate-700 bg-[linear-gradient(135deg,#0b1d2b,#0c2431_40%,#071622)]">

            {resultImage ? (

              <img
                src={resultImage}
                alt="FloodGuard AI detection result"
                className="h-full w-full object-contain"
              />

            ) : selectedImage ? (

              <img
                src={selectedImage}
                alt="Uploaded drone scene"
                className="h-full w-full object-cover"
              />

            ) : (

              <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-[0.18em] text-slate-500">
                No image selected
              </div>

            )}

          </div>


          {/* STATISTICS */}

          <div className="mt-5 grid gap-3 sm:grid-cols-4">

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-center">

              <div className="text-2xl font-bold text-white">
                {peopleCount ?? 0}
              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                People detected
              </div>

            </div>


            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">

              <div className="text-2xl font-bold text-red-200">
                {peopleCount !== null &&
                peopleCount > 0
                  ? "HIGH"
                  : "—"}
              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-red-200">
                Rescue priority
              </div>

            </div>


            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">

              <div className="text-2xl font-bold text-amber-200">
                {detections.length}
              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-200">
                Detection boxes
              </div>

            </div>


            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-center">

              <div className="text-2xl font-bold text-sky-200">
                {peopleCount !== null
                  ? currentConfidence
                  : "—"}
                {peopleCount !== null &&
                  "%"}
              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-sky-200">
                Avg. confidence
              </div>

            </div>

          </div>

        </Panel>

      </div>


      {/* ==================================================
          AI SUMMARY
      ================================================== */}

      <Panel className="p-5">

        <SectionHeader
          eyebrow="AI analysis"
          title="Detection metrics"
          icon="ShieldCheck"
        />

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">

          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">

            <div className="mb-3 flex items-center justify-between text-sm text-slate-300">

              <span>
                Average detection confidence
              </span>

              <span className="font-semibold text-white">

                {peopleCount !== null
                  ? `${currentConfidence}%`
                  : "Awaiting analysis"}

              </span>

            </div>

            <ProgressBar
              value={
                peopleCount !== null
                  ? currentConfidence
                  : 0
              }
              tone="green"
            />

            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              This value represents the average confidence of the individual person detections. It is not the overall model accuracy.
            </p>

          </div>


          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">

            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              AI recommendation
            </div>

            <p className="mt-2 text-sm text-slate-200">

              {peopleCount !== null
                ? peopleCount > 0
                  ? `${peopleCount} person${
                      peopleCount > 1
                        ? "s"
                        : ""
                    } detected. Review the location for rescue prioritization.`
                  : "No people detected in this image."
                : droneAnalysis.recommendation}

            </p>

          </div>

        </div>

      </Panel>


      {/* ==================================================
          DETECTION HISTORY
      ================================================== */}

      <Panel className="p-5">

        <SectionHeader
          eyebrow="Historical detections"
          title="Detection history"
          icon="Plane"
        />

        {history.length === 0 ? (

          <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">

            <Icon
              name="Radar"
              size={28}
            />

            <p className="mt-3 text-sm text-slate-400">
              No drone detections recorded yet.
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Analyze a drone image to create the first detection record.
            </p>

          </div>

        ) : (

          <div className="mt-4 space-y-3">

            {history.map(
              (item) => (

                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4 lg:flex-row lg:items-center lg:justify-between"
                >

                  {/* LEFT */}

                  <div className="min-w-0">

                    <div className="flex items-center gap-3">

                      <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-200">
                        {item.droneId}
                      </div>

                      <StatusBadge
                        label={
                          item.status
                        }
                        tone="good"
                      />

                    </div>

                    <div className="mt-2 truncate text-sm font-semibold text-white">
                      {item.filename}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {formatDate(
                        item.timestamp
                      )}
                    </div>

                  </div>


                  {/* RIGHT */}

                  <div className="grid grid-cols-3 gap-3 lg:min-w-[420px]">

                    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-center">

                      <div className="text-lg font-bold text-white">
                        {item.peopleCount}
                      </div>

                      <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">
                        People
                      </div>

                    </div>


                    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-center">

                      <div className="text-lg font-bold text-sky-200">
                        {item.confidence}%
                      </div>

                      <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">
                        Avg. confidence
                      </div>

                    </div>


                    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-center">

                      <div className="text-lg font-bold text-emerald-200">
                        AI
                      </div>

                      <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">
                        Detection
                      </div>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </Panel>

    </div>
  )
}