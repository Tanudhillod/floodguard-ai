"use client"

import { useEffect, useState } from "react"
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
  averageConfidence: number
  highestConfidence: number
  timestamp: string
  status: "Completed"
  latitude?: number | null
  longitude?: number | null
  location?: string | null
  modelName?: string
  analysisStatus?: string
}

const HISTORY_KEY = "floodguard_detection_history"

export default function DronePage() {
  // ============================================================
  // CURRENT IMAGE / ANALYSIS STATE
  // ============================================================

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null)

  const [resultImage, setResultImage] =
    useState<string | null>(null)

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  // ============================================================
  // LOCATION
  // ============================================================

  const [latitude, setLatitude] =
    useState<number | null>(null)

  const [longitude, setLongitude] =
    useState<number | null>(null)

  const [location, setLocation] =
    useState<string | null>(null)

  // ============================================================
  // DRONE / ANALYSIS
  // ============================================================

  const [droneId, setDroneId] =
    useState("DG-001")

  const [isAnalyzing, setIsAnalyzing] =
    useState(false)

  const [peopleCount, setPeopleCount] =
    useState<number | null>(null)

  const [detections, setDetections] =
    useState<Detection[]>([])

  const [error, setError] =
    useState<string | null>(null)

  // ============================================================
  // HISTORY
  // ============================================================

  const [history, setHistory] =
    useState<DetectionHistory[]>([])

  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<DetectionHistory | null>(null)

  // ============================================================
  // LOAD DETECTION HISTORY
  // ============================================================

  useEffect(() => {
    try {
      const savedHistory =
        localStorage.getItem(HISTORY_KEY)

      if (savedHistory) {
        setHistory(
          JSON.parse(savedHistory)
        )
      }
    } catch (error) {
      console.error(
        "Could not load detection history:",
        error
      )
    }
  }, [])

  // ============================================================
  // DETECT BROWSER LOCATION
  // ============================================================

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(
        "Location unavailable"
      )
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat =
          position.coords.latitude

        const lon =
          position.coords.longitude

        setLatitude(lat)
        setLongitude(lon)

        setLocation(
          `Lat ${lat.toFixed(6)}, Lon ${lon.toFixed(6)}`
        )
      },
      () => {
        setLocation(
          "Location unavailable"
        )
      }
    )
  }, [])

  // ============================================================
  // SELECT IMAGE
  // ============================================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) return

    setSelectedFile(file)

    const objectUrl =
      URL.createObjectURL(file)

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
      setError(
        "Please select a drone image first."
      )
      return
    }

    if (!droneId.trim()) {
      setError(
        "Please enter a drone ID."
      )
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // ========================================================
      // FORM DATA
      // ========================================================

      const formData =
        new FormData()

      formData.append(
        "file",
        selectedFile
      )

      if (latitude !== null) {
        formData.append(
          "latitude",
          String(latitude)
        )
      }

      if (longitude !== null) {
        formData.append(
          "longitude",
          String(longitude)
        )
      }

      if (location) {
        formData.append(
          "location",
          location
        )
      }

      // ========================================================
      // BACKEND REQUEST
      // ========================================================

      const response =
        await fetch(
          "http://127.0.0.1:8000/predict",
          {
            method: "POST",
            body: formData,
          }
        )

      if (!response.ok) {
        const errorText =
          await response.text()

        throw new Error(
          errorText ||
            "Drone analysis failed."
        )
      }

      // ========================================================
      // CONTENT TYPE
      // ========================================================

      const contentType =
        response.headers.get(
          "content-type"
        )

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

      // ========================================================
      // READ RESPONSE
      // ========================================================

      const responseBuffer =
        await response.arrayBuffer()

      const responseText =
        new TextDecoder(
          "latin1"
        ).decode(
          responseBuffer
        )

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
        latitude?: number | null
        longitude?: number | null
        location?: string | null
        model_name?: string
        analysis_status?: string
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
      // CALCULATE HIGHEST CONFIDENCE
      // ========================================================

      const highestConfidence =
        metadata.detections.length > 0
          ? Math.round(
              Math.max(
                ...metadata.detections.map(
                  (detection) =>
                    detection.confidence
                )
              ) * 100
            )
          : 0

      // ========================================================
      // SAVE DETECTION HISTORY
      // ========================================================

      const newHistoryItem:
        DetectionHistory = {
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

          averageConfidence:
            averageConfidence,

          highestConfidence:
            highestConfidence,

          timestamp:
            new Date().toISOString(),

          status:
            "Completed",

          latitude:
            metadata.latitude ??
            latitude,

          longitude:
            metadata.longitude ??
            longitude,

          location:
            metadata.location ??
            location,

          modelName:
            metadata.model_name ||
            "floodguard_person_v2.pt",

          analysisStatus:
            metadata.analysis_status ||
            "COMPLETED",
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
        i <
        bytes.length - 1;
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
  // HIGHEST CURRENT CONFIDENCE
  // ============================================================

  const highestDetectionConfidence =
    detections.length > 0
      ? Math.round(
          Math.max(
            ...detections.map(
              (detection) =>
                detection.confidence
            )
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

        {/* ==================================================
            UPLOAD PANEL
        ================================================== */}

        <Panel className="flex min-h-[360px] flex-col items-center justify-center p-6 text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-[#2563eb]">

            <Icon
              name="ScanLine"
              size={32}
            />

          </div>

          <h3 className="mt-5 text-2xl font-semibold text-[#0f2742]">
            Upload drone image
          </h3>

          <p className="mt-2 max-w-md text-sm text-[#486581]">
            Upload a drone image to run person detection for an active mission.
          </p>

          {/* DRONE ID */}

          <div className="mt-4 w-full max-w-sm text-left">

            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#627D98]">
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
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#0f2742] outline-none transition placeholder:text-slate-400 focus:border-[#2563eb]"
            />

          </div>

          {/* LOCATION */}

          <div className="mt-3 w-full max-w-sm text-left text-sm">

            <span className="text-slate-500">
              Location:{" "}
            </span>

            <span className="font-medium text-[#0f2742]">
              {location ||
                "Detecting location..."}
            </span>

          </div>

          {/* BUTTONS */}

          <div className="mt-4 flex w-full max-w-sm flex-col items-stretch gap-3 sm:flex-row">

            <label className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-md bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]">

              Upload Image

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
              className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-[#0f2742]"
            >
              Mission Details
            </button>

          </div>

          {/* ANALYZE */}

          <button
            type="button"
            onClick={
              handleAnalyze
            }
            disabled={
              isAnalyzing ||
              !selectedFile
            }
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
          >

            {isAnalyzing
              ? "Running analysis..."
              : "Analyze Image"}

          </button>

          {error && (
            <div className="mt-4 max-w-sm rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

        </Panel>


        {/* ==================================================
            RESULT PANEL
        ================================================== */}

        <Panel className="p-5">

          <SectionHeader
            eyebrow="Latest result"
            title="Detection result"
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

          <div className="relative mt-3 h-[260px] overflow-hidden rounded-lg border border-[#173B5E] bg-[#0B1F33]">

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

            {/* PEOPLE */}

            <div className="rounded-md border border-[#D6E2EE] bg-white p-3 text-center">

              <div className="text-2xl font-bold text-[#0f2742]">
                {peopleCount ?? 0}
              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#627D98]">
                People detected
              </div>

            </div>


            {/* PRIORITY */}

            <div className="rounded-lg border border-red-200 bg-[#FFF1F2] p-3 text-center">

              <div className="text-2xl font-bold text-[#C62828]">

                {peopleCount !== null &&
                peopleCount > 0
                  ? "HIGH"
                  : "—"}

              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#C62828]">
                Rescue priority
              </div>

            </div>


            {/* DETECTIONS */}

            <div className="rounded-lg border border-amber-200 bg-[#FFF7ED] p-3 text-center">

              <div className="text-2xl font-bold text-[#D97706]">
                {detections.length}
              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#D97706]">
                Detections
              </div>

            </div>


            {/* CONFIDENCE */}

            <div className="rounded-lg border border-blue-200 bg-[#EAF3F8] p-3 text-center">

              <div className="text-2xl font-bold text-[#1261A0]">

                {peopleCount !== null
                  ? highestDetectionConfidence
                  : "—"}

                {peopleCount !== null &&
                  "%"}

              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#1261A0]">
                Highest confidence
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
          eyebrow="Analysis metrics"
          title="Person detection metrics"
          icon="ShieldCheck"
        />

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">

          {/* CONFIDENCE */}

          <div className="rounded-lg border border-slate-200 bg-white p-4">

            <div className="mb-3 flex items-center justify-between text-sm text-[#486581]">

              <span>
                Average detection confidence
              </span>

              <span className="font-semibold text-[#173B5E]">

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


          {/* OPERATIONAL NOTE */}

          <div className="rounded-lg border border-slate-200 bg-white p-4">

            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#627D98]">
              Operational note
            </div>

            <p className="mt-2 text-sm text-[#486581]">

              {peopleCount !== null
                ? peopleCount > 0
                  ? `${peopleCount} person${
                      peopleCount > 1
                        ? "s"
                        : ""
                    } detected. Review the location for rescue prioritization.`
                  : "No people detected in this image."
                : "Analyze an image to generate an operational result."}

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

          <div className="mt-4 rounded-lg border border-dashed border-[#D6E2EE] bg-[#EAF3F8] p-8 text-center">

            <Icon
              name="Radar"
              size={28}
            />

            <p className="mt-3 text-sm text-[#486581]">
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
                  className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
                >

                  {/* LEFT */}

                  <div className="min-w-0">

                    <div className="flex items-center gap-3">

                      <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-[#1261A0]">
                        {item.droneId}
                      </div>

                      <StatusBadge
                        label={
                          item.status
                        }
                        tone="good"
                      />

                    </div>

                    <div className="mt-2 truncate text-sm font-semibold text-[#0f2742]">
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

                    {/* PEOPLE */}

                    <div className="rounded-md border border-[#D6E2EE] bg-white p-3 text-center">

                      <div className="text-lg font-bold text-[#0f2742]">
                        {item.peopleCount}
                      </div>

                      <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">
                        People
                      </div>

                    </div>


                    {/* CONFIDENCE */}

                    <div className="rounded-md border border-[#D6E2EE] bg-white p-3 text-center">

                      <div className="text-lg font-bold text-[#1261A0]">
                        {item.highestConfidence ??
                          item.averageConfidence}
                        %
                      </div>

                      <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">
                        Highest confidence
                      </div>

                    </div>


                    {/* REVIEW */}

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          item.peopleCount >
                          0
                        ) {
                          setSelectedHistoryItem(
                            item
                          )
                        }
                      }}
                      disabled={
                        item.peopleCount ===
                        0
                      }
                      className="rounded-md border border-[#D6E2EE] bg-white p-3 text-center transition hover:border-[#18864B] hover:bg-[#F0FDF4] disabled:cursor-default disabled:hover:border-[#D6E2EE] disabled:hover:bg-white"
                    >

                      <div className="text-lg font-bold text-[#18864B]">
                        {item.peopleCount >
                        0
                          ? "Review"
                          : "Clear"}
                      </div>

                      <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">
                        Response
                      </div>

                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </Panel>


      {/* ==================================================
          DETECTION REVIEW MODAL
          NO IMAGE / IMAGE PATH
      ================================================== */}

      {selectedHistoryItem && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            setSelectedHistoryItem(
              null
            )
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>

                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#627D98]">
                  Detection review
                </div>

                <h2 className="mt-1 text-xl font-semibold text-[#0f2742]">
                  {selectedHistoryItem.filename}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedHistoryItem(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-[#0f2742]"
              >
                ×
              </button>

            </div>


            {/* CONTENT */}

            <div className="space-y-4 p-6">

              {/* DETECTION INFORMATION */}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">

                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#627D98]">
                  Detection information
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">

                  {/* DRONE ID */}

                  <div className="rounded-md border border-slate-200 bg-white p-3">

                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
                      Drone ID
                    </div>

                    <div className="mt-1 text-sm font-semibold text-[#0f2742]">
                      {selectedHistoryItem.droneId}
                    </div>

                  </div>


                  {/* STATUS */}

                  <div className="rounded-md border border-slate-200 bg-white p-3">

                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
                      Status
                    </div>

                    <div className="mt-1 text-sm font-semibold text-[#18864B]">
                      {selectedHistoryItem.analysisStatus ||
                        selectedHistoryItem.status}
                    </div>

                  </div>


                  {/* PEOPLE */}

                  <div className="rounded-md border border-slate-200 bg-white p-3">

                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
                      People detected
                    </div>

                    <div className="mt-1 text-xl font-bold text-[#0f2742]">
                      {selectedHistoryItem.peopleCount}
                    </div>

                  </div>


                  {/* AVERAGE */}

                  <div className="rounded-md border border-slate-200 bg-white p-3">

                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
                      Average confidence
                    </div>

                    <div className="mt-1 text-xl font-bold text-[#1261A0]">
                      {selectedHistoryItem.averageConfidence}%
                    </div>

                  </div>


                  {/* HIGHEST */}

                  <div className="rounded-md border border-slate-200 bg-white p-3">

                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
                      Highest confidence
                    </div>

                    <div className="mt-1 text-xl font-bold text-[#1261A0]">
                      {selectedHistoryItem.highestConfidence}%
                    </div>

                  </div>


                  {/* MODEL */}

                  <div className="rounded-md border border-slate-200 bg-white p-3">

                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
                      Model
                    </div>

                    <div className="mt-1 break-all text-sm font-semibold text-[#0f2742]">
                      {selectedHistoryItem.modelName ||
                        "floodguard_person_v2.pt"}
                    </div>

                  </div>

                </div>

              </div>


              {/* LOCATION */}

              <div className="rounded-lg border border-slate-200 bg-white p-4">

                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#627D98]">
                  Location
                </div>

                <div className="mt-3">

                  <div className="text-sm font-medium text-[#0f2742]">
                    {selectedHistoryItem.location ||
                      "Location unavailable"}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">

                    {/* LATITUDE */}

                    <div className="rounded-md border border-slate-200 p-3">

                      <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
                        Latitude
                      </div>

                      <div className="mt-1 text-sm font-semibold text-[#0f2742]">

                        {selectedHistoryItem.latitude !==
                          null &&
                        selectedHistoryItem.latitude !==
                          undefined
                          ? selectedHistoryItem.latitude.toFixed(
                              6
                            )
                          : "—"}

                      </div>

                    </div>


                    {/* LONGITUDE */}

                    <div className="rounded-md border border-slate-200 p-3">

                      <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
                        Longitude
                      </div>

                      <div className="mt-1 text-sm font-semibold text-[#0f2742]">

                        {selectedHistoryItem.longitude !==
                          null &&
                        selectedHistoryItem.longitude !==
                          undefined
                          ? selectedHistoryItem.longitude.toFixed(
                              6
                            )
                          : "—"}

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* ANALYSIS TIME */}

              <div className="rounded-lg border border-slate-200 bg-white p-4">

                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#627D98]">
                  Analysis time
                </div>

                <div className="mt-2 text-sm font-medium text-[#0f2742]">
                  {formatDate(
                    selectedHistoryItem.timestamp
                  )}
                </div>

              </div>

            </div>


            {/* FOOTER */}

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">

              <button
                type="button"
                onClick={() =>
                  setSelectedHistoryItem(
                    null
                  )
                }
                className="rounded-md bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}