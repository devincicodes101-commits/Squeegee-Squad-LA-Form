"use client";

import { useRef, useState } from "react";
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

const MAX_FILE_BYTES = 5_000_000; // 5 MB

/**
 * Read a File as a data URL ("data:image/jpeg;base64,…") — the format the
 * /api/analyze-photo route expects and the format the OpenAI Vision API accepts.
 */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export function PhotoAnalyzer({
  service,
  setValue,
}: {
  service: string;
  setValue: UseFormSetValue<FormSchema>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [applied, setApplied] = useState(false);

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    setApplied(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setValue("photos", false, { shouldDirty: true });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (jpg, png, webp, heic).");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image is too large. Max 5 MB.");
      return;
    }

    setError(null);
    setResult(null);
    setApplied(false);
    setAnalyzing(true);

    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(dataUrl);

      const res = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          service_context: service,
        }),
      });
      const body = (await res.json()) as
        | { ok: true; data: AnalysisResult }
        | { ok: false; error: string };

      if (!body.ok) {
        setError(body.error);
        return;
      }
      setResult(body.data);
      // Mark the §10 confidence-boost flag the moment we have a valid analysis.
      setValue("photos", true, { shouldDirty: true });
    } catch {
      setError("Couldn't analyze the photo. Try again or skip.");
    } finally {
      setAnalyzing(false);
    }
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
      // The condition string from the model already matches the engine canonical form.
      setValue(
        "condition",
        result.condition as FormSchema["condition"],
        { shouldDirty: true, shouldValidate: true }
      );
    }
    if (result.access) {
      setValue(
        "access",
        result.access as FormSchema["access"],
        { shouldDirty: true, shouldValidate: true }
      );
    }
    if (result.risk_factors.length > 0) {
      const note = `[AI photo analysis] ${result.reasoning} — Risk: ${result.risk_factors.join("; ")}`;
      setValue("notes", note, { shouldDirty: true });
    }
    setApplied(true);
  };

  return (
    <div className="flex flex-col gap-3">
      {!preview && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="photo-upload"
            className="cursor-pointer rounded-xl border-2 border-dashed border-line bg-canvas/40 p-6 text-center text-sm text-muted transition hover:border-primary hover:bg-canvas/70"
          >
            <div className="font-medium text-ink">📸 Upload a site photo</div>
            <div className="mt-1 text-xs">
              AI will read condition, access, stories, and quantity — then you can apply or override.
            </div>
            <input
              ref={fileInputRef}
              id="photo-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {preview && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <img
            src={preview}
            alt="Site photo preview"
            className="h-32 w-32 flex-shrink-0 rounded-lg border border-line object-cover"
          />
          <div className="flex-1">
            {analyzing && (
              <p className="text-sm text-muted">
                <span className="inline-block animate-pulse">●</span> Analyzing photo…
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
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
        </div>
      )}

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
            Try another
          </button>
        </div>
      )}
    </div>
  );
}
