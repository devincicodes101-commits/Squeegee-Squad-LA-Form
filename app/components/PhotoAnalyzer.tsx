"use client";

import { useEffect, useRef, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";

import type { FormSchema } from "@/lib/schema";

type AnalysisResult = {
  service_guess: string;
  quantity_estimate: number | null;
  quantity_unit: string;
  stories: number | null;
  condition: string;
  access: string;
  risk_factors: string[];
  confidence: string;
  reasoning: string;
};

type PhotoItem = {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
};

const MAX_FILE_BYTES = 5_000_000; // 5 MB per photo

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function PhotoAnalyzer({
  service,
  setValue,
}: {
  service: string;
  setValue: UseFormSetValue<FormSchema>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyzeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAnalyzeIdRef = useRef<number>(0);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [applied, setApplied] = useState(false);

  const reset = () => {
    setPhotos([]);
    setResult(null);
    setError(null);
    setApplied(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setValue("photos", false, { shouldDirty: true });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setApplied(false);
  };

  /** Analyze all currently-queued photos in one combined GPT-4o Vision call. */
  const analyzePhotos = async (items: PhotoItem[]) => {
    if (items.length === 0) {
      setResult(null);
      setError(null);
      return;
    }

    // Cancel any prior in-flight analyzer by bumping the token.
    const runId = activeAnalyzeIdRef.current + 1;
    activeAnalyzeIdRef.current = runId;

    setError(null);
    setResult(null);
    setApplied(false);
    setAnalyzing(true);

    try {
      const res = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: items.map((p) => p.dataUrl),
          service_context: service,
        }),
      });

      // Ignore stale responses.
      if (activeAnalyzeIdRef.current !== runId) return;

      const body = (await res.json()) as
        | { ok: true; data: AnalysisResult }
        | { ok: false; error: string };

      if (!body.ok) {
        setError(body.error);
        return;
      }
      setResult(body.data);
      setValue("photos", true, { shouldDirty: true });
    } catch {
      if (activeAnalyzeIdRef.current !== runId) return;
      setError("Couldn't analyze the photos. Try again or skip.");
    } finally {
      if (activeAnalyzeIdRef.current === runId) setAnalyzing(false);
    }
  };

  /** Debounced re-analyze whenever the photos array changes. */
  useEffect(() => {
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    if (photos.length === 0) {
      setResult(null);
      setError(null);
      setValue("photos", false, { shouldDirty: true });
      return;
    }
    analyzeTimerRef.current = setTimeout(() => {
      analyzePhotos(photos);
    }, 600);
    return () => {
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nextErrors: string[] = [];
    const accepted: PhotoItem[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        nextErrors.push(`${file.name}: not an image`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        nextErrors.push(`${file.name}: over 5 MB`);
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        accepted.push({
          id: makeId(),
          dataUrl,
          name: file.name,
          size: file.size,
        });
      } catch {
        nextErrors.push(`${file.name}: failed to read`);
      }
    }

    // Clear the file input so re-selecting the same file works.
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (accepted.length > 0) {
      setPhotos((prev) => [...prev, ...accepted]);
    }
    setError(nextErrors.length > 0 ? nextErrors.join(" · ") : null);
  };

  /** Auto-fill the AI-detected values into the form. Rep can still override. */
  const applyToForm = () => {
    if (!result) return;
    if (result.quantity_estimate && result.quantity_estimate > 0) {
      setValue("quantity", result.quantity_estimate, { shouldDirty: true, shouldValidate: true });
    }
    if (result.stories && result.stories > 0) {
      setValue("extras.stories", String(result.stories), { shouldDirty: true });
    }
    if (result.condition) {
      setValue(
        "condition",
        result.condition as FormSchema["condition"],
        { shouldDirty: true, shouldValidate: true },
      );
    }
    if (result.access) {
      setValue(
        "access",
        result.access as FormSchema["access"],
        { shouldDirty: true, shouldValidate: true },
      );
    }
    if (result.risk_factors.length > 0) {
      const note = `[AI photo analysis · ${photos.length} photo${photos.length > 1 ? "s" : ""}] ${result.reasoning} — Risk: ${result.risk_factors.join("; ")}`;
      setValue("notes", note, { shouldDirty: true });
    }
    setApplied(true);
  };

  const photoCount = photos.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Uploader — always visible so reps can keep adding photos */}
      <label
        htmlFor="photo-upload"
        className="cursor-pointer rounded-xl border-2 border-dashed border-line bg-canvas/40 p-6 text-center text-sm text-muted transition hover:border-primary hover:bg-canvas/70"
      >
        <div className="font-medium text-ink">
          📸 {photoCount === 0 ? "Upload site photo(s)" : `Add more photos (${photoCount} attached)`}
        </div>
        <div className="mt-1 text-xs">
          {photoCount === 0
            ? "AI reads condition, access, stories & quantity across ALL photos, then you apply or override."
            : "AI re-analyzes across every attached photo together."}
        </div>
        <input
          ref={fileInputRef}
          id="photo-upload"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Thumbnail grid */}
      {photoCount > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-canvas"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.dataUrl}
                alt={p.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                aria-label={`Remove ${p.name}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-semibold text-white transition hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Analysis status + result */}
      {photoCount > 0 && (
        <div className="rounded-lg bg-canvas/50 p-3">
          {analyzing && (
            <p className="text-sm text-muted">
              <span className="inline-block animate-pulse">●</span> Analyzing {photoCount} photo{photoCount > 1 ? "s" : ""}…
            </p>
          )}
          {result && !analyzing && (
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                {result.service_guess && (
                  <span><span className="text-muted">Service:</span> <strong>{result.service_guess}</strong></span>
                )}
                {result.quantity_estimate !== null && (
                  <span><span className="text-muted">Qty:</span> <strong>~{result.quantity_estimate} {result.quantity_unit}</strong></span>
                )}
                {result.stories !== null && (
                  <span><span className="text-muted">Stories:</span> <strong>{result.stories}</strong></span>
                )}
                {result.condition && (
                  <span><span className="text-muted">Condition:</span> <strong>{result.condition}</strong></span>
                )}
                {result.access && (
                  <span><span className="text-muted">Access:</span> <strong>{result.access}</strong></span>
                )}
                <span><span className="text-muted">Confidence:</span> <strong>{result.confidence}</strong></span>
              </div>
              {result.reasoning && (
                <p className="text-xs italic text-muted">"{result.reasoning}"</p>
              )}
              {result.risk_factors.length > 0 && (
                <p className="text-xs text-muted">
                  Risk: {result.risk_factors.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {result && !analyzing && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyToForm}
            disabled={applied}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {applied ? "✓ Applied to form" : "Apply to form"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-canvas"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
