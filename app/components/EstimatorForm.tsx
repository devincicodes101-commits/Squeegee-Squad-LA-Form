"use client";

import { useState, type ReactNode } from "react";
import {
  Controller,
  useForm,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { formSchema, type FormSchema } from "@/lib/schema";
import type { EstimateApiResponse, EstimateResult } from "@/lib/types";
import {
  CONFIDENCE_OVERRIDE,
  ESTIMATE_MODES,
  LA_LOGISTICS_OPTIONS,
  LEAD_SOURCES,
  LOGISTICS_ADDON_OPTIONS,
  PASS_THROUGH_COVERED_BY,
  PASS_THROUGH_TYPES,
  PROPERTY_TYPES,
  RECURRING_OPTIONS,
  REVIEW_OVERRIDE,
  SERVICES,
  URGENCY_OPTIONS,
  YES_NO_BLANK,
} from "@/lib/constants";
import { getField, type FieldDef } from "@/lib/fieldRegistry";
import {
  SERVICE_FIELD_CONFIG,
  fieldsForService,
} from "@/lib/serviceFieldConfig";
import {
  MultiSelectChips,
  Segmented,
  SelectField,
  TextAreaField,
  TextField,
  Toggle,
} from "./fields";

/** Animated reveal for conditional sections (grid-rows 0fr → 1fr). */
function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid transition-all duration-300 ease-out ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6">
      {title && (
        <div className="mb-4">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

const DEFAULTS: Partial<FormSchema> = {
  estimateMode: "Quick",
  leadSource: "door knocking",
  address: "",
  propertyType: "Residential",
  service: "Residential Window Cleaning",
  // Neutral so project-based / dedicated-key services (no quantity field) pass
  // base validation; feeder services require ≥ 1 via the schema superRefine.
  quantity: 0,
  condition: "Standard",
  access: "Easy",
  urgency: "Standard",
  laLogistics: "None/Route-friendly",
  recurring: "One-Time",
  additionalServices: [],
  passThroughType: "None / Not applicable",
  passThroughCost: 0,
  passThroughCoveredBy: "Sub covers (default)",
  logisticsAddon: "None / Route-friendly",
  crewHours: 0,
  notes: "",
  floors: 0,
  chutes: 0,
  spaces: 0,
  levels: 0,
  cleaningPhase: "",
  debrisLevel: "",
  extras: {},
  photos: false,
  // Christiana §13 — Fixed Subcontractor Quote (all blank by default)
  hasFixedSubQuote: "",
  fixedSubQuoteAmount: 0,
  fixedSubQuoteIncludesPassThrough: "",
  // Christiana §16 — Manual Overrides (all blank/zero by default)
  overrideLow: 0,
  overrideHigh: 0,
  overrideConfidence: "",
  overrideReviewRequired: "",
  overrideReviewReason: "",
  overrideSubPayout: 0,
  overridePassThrough: 0,
  overrideCustomerMessage: "",
};

/**
 * Render one dynamic service field from its registry definition, binding it to
 * the correct react-hook-form path:
 *  - feedsQuantity → the generic `quantity` field (numeric, required).
 *  - formField     → a wire-backed FormState field (condition, access, …).
 *  - otherwise     → `extras.<key>`, folded into Notes at send time.
 */
function DynamicField({
  def,
  register,
  errors,
}: {
  def: FieldDef;
  register: UseFormRegister<FormSchema>;
  errors: FieldErrors<FormSchema>;
}) {
  if (def.feedsQuantity) {
    return (
      <TextField
        id="quantity"
        label={def.label}
        required
        inputMode="numeric"
        placeholder="e.g. 40"
        hint={def.hint}
        error={errors.quantity?.message}
        {...register("quantity", { valueAsNumber: true })}
      />
    );
  }

  if (def.formField) {
    const name = def.formField;
    const numeric = def.control === "number";
    const error = errors[name]?.message;
    if (def.control === "select") {
      return (
        <SelectField
          id={name}
          label={def.label}
          options={def.options ?? []}
          placeholder={def.placeholder}
          hint={def.hint}
          error={error}
          {...register(name)}
        />
      );
    }
    return (
      <TextField
        id={name}
        label={def.label}
        inputMode={numeric ? "numeric" : undefined}
        placeholder={def.placeholder}
        hint={def.hint}
        error={error}
        {...register(name, numeric ? { valueAsNumber: true } : {})}
      />
    );
  }

  // Notes-folded extra (includes severity/odor, which also map onto Condition).
  const path = `extras.${def.key}` as const;
  if (def.control === "select") {
    return (
      <SelectField
        id={path}
        label={def.label}
        options={def.options ?? []}
        placeholder="—"
        hint={def.hint}
        {...register(path)}
      />
    );
  }
  return (
    <TextField
      id={path}
      label={def.label}
      placeholder={def.placeholder}
      hint={def.hint}
      {...register(path)}
    />
  );
}

export function EstimatorForm({
  onSuccess,
}: {
  onSuccess: (result: EstimateResult) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULTS,
    mode: "onTouched",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const estimateMode = watch("estimateMode");
  const service = watch("service");
  const detailed = estimateMode === "Detailed";

  const quickFields = fieldsForService(service, false);
  const detailedAdds = SERVICE_FIELD_CONFIG[service].detailed;

  const onValid = async (data: FormSchema) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json()) as EstimateApiResponse;
      if (body.ok) {
        onSuccess(body.data);
      } else {
        setSubmitError(body.error);
      }
    } catch {
      setSubmitError(
        "Couldn't reach the estimator. Check your connection and retry — your inputs are saved."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-5 pb-28 sm:pb-0">
      <Card>
        <Controller
          control={control}
          name="estimateMode"
          render={({ field }) => (
            <Segmented
              label="Estimate Mode"
              options={ESTIMATE_MODES}
              value={field.value}
              onChange={field.onChange}
              hint="Quick = fewest taps. Detailed reveals add-ons, pass-through costs, and logistics."
            />
          )}
        />
      </Card>

      <Card title="Job basics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            id="leadSource"
            label="Lead Source"
            required
            options={LEAD_SOURCES}
            error={errors.leadSource?.message}
            {...register("leadSource")}
          />
          <TextField
            id="zip"
            label="ZIP Code"
            required
            inputMode="numeric"
            placeholder="90046"
            error={errors.zip?.message}
            {...register("zip", { valueAsNumber: true })}
          />
          <SelectField
            id="propertyType"
            label="Property Type"
            required
            options={PROPERTY_TYPES}
            error={errors.propertyType?.message}
            {...register("propertyType")}
          />
          <TextField
            id="address"
            label="Property Address"
            placeholder="Optional"
            error={errors.address?.message}
            {...register("address")}
          />
        </div>
      </Card>

      <Card
        title="Service & scope"
        subtitle="Pick a service — the fields below adjust to exactly what it needs."
      >
        <div className="mb-4">
          <SelectField
            id="service"
            label="Service"
            required
            options={SERVICES}
            error={errors.service?.message}
            {...register("service")}
          />
        </div>

        {/* Dynamic, per-service quick fields. `key={service}` gives a light
            fade as the field set swaps when the service changes. */}
        <div key={service} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickFields.map((fieldKey) => (
            <DynamicField
              key={fieldKey}
              def={getField(fieldKey)}
              register={register}
              errors={errors}
            />
          ))}
        </div>

        {/* Detailed-mode service-specific adds (all captured into Notes). */}
        {detailedAdds.length > 0 && (
          <Reveal open={detailed}>
            <div className="mt-4 rounded-xl bg-primary-light/60 p-4">
              <p className="mb-3 text-sm font-semibold text-ink">
                More detail (optional)
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {detailedAdds.map((fieldKey) => (
                  <DynamicField
                    key={fieldKey}
                    def={getField(fieldKey)}
                    register={register}
                    errors={errors}
                  />
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </Card>

      <Card title="Logistics & scheduling">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            id="urgency"
            label="Urgency"
            required
            options={URGENCY_OPTIONS}
            error={errors.urgency?.message}
            {...register("urgency")}
          />
          <SelectField
            id="laLogistics"
            label="LA Logistics"
            required
            options={LA_LOGISTICS_OPTIONS}
            error={errors.laLogistics?.message}
            {...register("laLogistics")}
          />
          <SelectField
            id="recurring"
            label="Recurring / Frequency"
            required
            options={RECURRING_OPTIONS}
            hint="Cadence for this account — also covers per-service frequency."
            error={errors.recurring?.message}
            {...register("recurring")}
          />
        </div>
      </Card>

      {/* Photos — never blocks submit. v1 = presence-only boolean.
          UPLOAD SEAM: replace this toggle with a real file input + upload,
          then set `photos` true when ≥1 file is attached and send file refs
          alongside the payload. The engine only checks truthiness today. */}
      <Card title="Photos" subtitle="Optional — tightens the range and bumps confidence.">
        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <Toggle
              label="Photos attached"
              hint="Toggle on if the rep has site photos. (Real upload coming later.)"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Card>

      {/* Detailed-only global section */}
      <Reveal open={detailed}>
        <Card title="Detailed estimate" subtitle="Extra factors for a tighter range.">
          <div className="flex flex-col gap-4">
            <Controller
              control={control}
              name="additionalServices"
              render={({ field }) => (
                <MultiSelectChips
                  label="Additional Services"
                  hint="Tap any extra services to bundle."
                  options={SERVICES}
                  selected={field.value ?? []}
                  onToggle={(value) => {
                    const set = new Set(field.value ?? []);
                    if (set.has(value as never)) set.delete(value as never);
                    else set.add(value as never);
                    field.onChange(Array.from(set));
                  }}
                />
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                id="passThroughType"
                label="Pass-through Type"
                options={PASS_THROUGH_TYPES}
                error={errors.passThroughType?.message}
                {...register("passThroughType")}
              />
              <TextField
                id="passThroughCost"
                label="Pass-through Costs ($)"
                inputMode="numeric"
                error={errors.passThroughCost?.message}
                {...register("passThroughCost", { valueAsNumber: true })}
              />
              <SelectField
                id="passThroughCoveredBy"
                label="Who Covers Pass-through?"
                options={PASS_THROUGH_COVERED_BY}
                error={errors.passThroughCoveredBy?.message}
                {...register("passThroughCoveredBy")}
              />
              <SelectField
                id="logisticsAddon"
                label="Logistics Add-On"
                options={LOGISTICS_ADDON_OPTIONS}
                error={errors.logisticsAddon?.message}
                {...register("logisticsAddon")}
              />
              <TextField
                id="crewHours"
                label="Estimated Crew Hours"
                inputMode="numeric"
                error={errors.crewHours?.message}
                {...register("crewHours", { valueAsNumber: true })}
              />
            </div>
            <TextAreaField
              id="notes"
              label="Notes"
              placeholder="Anything the pricing engine should know…"
              hint="Service-specific details you enter above are added here automatically."
              error={errors.notes?.message}
              {...register("notes")}
            />
          </div>
        </Card>

        {/* Christiana §13 — Fixed Subcontractor Quote (internal only) */}
        <Card
          title="Fixed Subcontractor Quote"
          subtitle="Internal — protects sell price when we have a fixed quote from a sub. Leave blank if not applicable."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              id="hasFixedSubQuote"
              label="Have a fixed sub quote?"
              options={YES_NO_BLANK}
              placeholder="—"
              error={errors.hasFixedSubQuote?.message}
              {...register("hasFixedSubQuote")}
            />
            <TextField
              id="fixedSubQuoteAmount"
              label="Fixed quote amount ($)"
              inputMode="numeric"
              placeholder="e.g. 900"
              hint="Sub's fixed quote — used to calculate protected sell price ÷ 0.45."
              error={errors.fixedSubQuoteAmount?.message}
              {...register("fixedSubQuoteAmount", { valueAsNumber: true })}
            />
            <SelectField
              id="fixedSubQuoteIncludesPassThrough"
              label="Quote includes pass-through?"
              options={YES_NO_BLANK}
              placeholder="—"
              hint="If Yes, sub's quote covers disposal/equipment/etc."
              error={errors.fixedSubQuoteIncludesPassThrough?.message}
              {...register("fixedSubQuoteIncludesPassThrough")}
            />
          </div>
        </Card>

        {/* Christiana §16 — Manual Override Fields (internal only) */}
        <Card
          title="Manual Overrides"
          subtitle="Internal — override any computed value. Original values are preserved in the result. Leave all blank to use the engine's numbers."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="overrideLow"
              label="Override low estimate ($)"
              inputMode="numeric"
              placeholder="—"
              error={errors.overrideLow?.message}
              {...register("overrideLow", { valueAsNumber: true })}
            />
            <TextField
              id="overrideHigh"
              label="Override high estimate ($)"
              inputMode="numeric"
              placeholder="—"
              error={errors.overrideHigh?.message}
              {...register("overrideHigh", { valueAsNumber: true })}
            />
            <SelectField
              id="overrideConfidence"
              label="Override confidence"
              options={CONFIDENCE_OVERRIDE}
              placeholder="—"
              error={errors.overrideConfidence?.message}
              {...register("overrideConfidence")}
            />
            <SelectField
              id="overrideReviewRequired"
              label="Override review required"
              options={REVIEW_OVERRIDE}
              placeholder="—"
              error={errors.overrideReviewRequired?.message}
              {...register("overrideReviewRequired")}
            />
            <TextField
              id="overrideSubPayout"
              label="Override sub payout ($)"
              inputMode="numeric"
              placeholder="—"
              error={errors.overrideSubPayout?.message}
              {...register("overrideSubPayout", { valueAsNumber: true })}
            />
            <TextField
              id="overridePassThrough"
              label="Override pass-through ($)"
              inputMode="numeric"
              placeholder="—"
              error={errors.overridePassThrough?.message}
              {...register("overridePassThrough", { valueAsNumber: true })}
            />
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <TextAreaField
              id="overrideReviewReason"
              label="Override review reason"
              placeholder="Why this estimate needs (or doesn't need) review…"
              error={errors.overrideReviewReason?.message}
              {...register("overrideReviewReason")}
            />
            <TextAreaField
              id="overrideCustomerMessage"
              label="Override customer-facing message"
              placeholder="Custom wording to send the customer — leave blank to use the default template."
              error={errors.overrideCustomerMessage?.message}
              {...register("overrideCustomerMessage")}
            />
          </div>
        </Card>
      </Reveal>

      {submitError && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-red-700">{submitError}</p>
          <button
            type="submit"
            disabled={submitting}
            className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            Retry
          </button>
        </div>
      )}

      {/* Sticky submit on mobile; inline on desktop. */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto w-full max-w-4xl">
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Generating estimate…
              </>
            ) : (
              "Generate Estimate"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
