import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  IndianRupee,
  Info,
  Sparkles,
  Stethoscope,
  Users,
  Shield,
} from "lucide-react";
import {
  buildReadinessLines,
  computeEnrollmentPercent,
  familyDependentRelationLabel,
  familyDependentEffectiveGender,
  coverageSumInsuredDisplay,
  computeFloaterAnnualPremiumINR,
  formatEnrollmentPremiumInr,
} from "@/components/features/insurance/enrollmentPreviewUtils";

function formatDisplayDateSafe(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PreviewRow({ label, value, empty = "Not added yet" }) {
  const show = value !== undefined && value !== null && String(value).trim() !== "";
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-border/60 last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-right leading-snug ${show ? "text-foreground font-medium" : "text-muted-foreground/60 italic"}`}>
        {show ? value : empty}
      </span>
    </div>
  );
}

function SectionShell({ title, icon, focused, statusDot, children, defaultOpen = true }) {
  const IconGlyph = icon;
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        focused ? "border-primary/25 bg-primary/5 shadow-sm" : "border-border/80 bg-muted/30"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
            <IconGlyph size={15} />
          </div>
          <span className="truncate text-xs font-bold uppercase tracking-wide text-foreground/80">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {statusDot}
          <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && <div className="border-t border-border/60 px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

function statusIcon(status) {
  if (status === "done") return <CheckCircle2 size={14} className="text-success" aria-hidden />;
  if (status === "partial") return <AlertTriangle size={13} className="text-warning" aria-hidden />;
  return <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden />;
}

export function EnrollmentLivePreview({
  policy,
  deadline,
  form,
  status,
  previewFocusKey,
  canSubmit,
  warnings,
  compact,
  onNavigateToSection,
}) {
  const pct = useMemo(() => computeEnrollmentPercent(status, form), [status, form]);
  const readiness = useMemo(() => buildReadinessLines(status, form, canSubmit, warnings), [status, form, canSubmit, warnings]);
  const dependentCount = (form.familyDependents ?? []).filter((d) => d.saved).length;
  const floaterPremium = useMemo(
    () => computeFloaterAnnualPremiumINR(form.coverageLakh, dependentCount),
    [form.coverageLakh, dependentCount],
  );

  const selfComplete = status.self === "done";

  return (
    <div
      className={`flex flex-col gap-3 ${compact ? "" : "rounded-2xl border border-border/90 bg-gradient-to-b from-card to-muted/50 p-4 shadow-xl shadow-border/25"}`}
    >
      {/* Policy identity strip */}
      <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
          <Sparkles size={13} className="text-primary shrink-0" aria-hidden />
          {policy.name} ({policy.year})
        </div>
        {!form.coverageLakh && (
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Numbers below update after you choose coverage.
          </p>
        )}
      </div>

      <SectionShell title="Self insurance" icon={Stethoscope} focused={previewFocusKey === "self"} statusDot={statusIcon(status.self)}>
        <PreviewRow label="Name (Gov. ID)" value={form.legalNameAsPerId} />
        <PreviewRow label="DOB" value={form.dob ? formatDisplayDateSafe(form.dob) : ""} />
        <PreviewRow label="Age" value={form.age} />
        <PreviewRow label="Mobile" value={form.mobile} />
        <PreviewRow label="Gender" value={form.gender} />
        {!selfComplete && <p className="mt-1 text-[10px] font-medium text-warning">Required: gender & mobile (name & DOB from records)</p>}
      </SectionShell>

      {(form.familyDependents ?? []).length > 0 && (
        <SectionShell title="Family" icon={Users} focused={previewFocusKey === "family"} statusDot={statusIcon(status.family)} defaultOpen>
          {(form.familyDependents ?? []).map((d) => (
            <div key={d.id} className="mb-2 rounded-lg border border-border/80 bg-card/80 px-2 py-2 last:mb-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">{familyDependentRelationLabel(d.relation)}</p>
                {!d.saved && (
                  <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-warning">Draft</span>
                )}
              </div>
              <PreviewRow label="Name" value={d.name} />
              <PreviewRow label="DOB" value={d.dob ? formatDisplayDateSafe(d.dob) : ""} />
              <PreviewRow label="Age" value={d.age} />
              <PreviewRow label="Gender" value={familyDependentEffectiveGender(d.relation, d.gender, form.gender)} />
            </div>
          ))}
        </SectionShell>
      )}

      <SectionShell title="Coverage" icon={Shield} focused={previewFocusKey === "coverage"} statusDot={statusIcon(status.coverage)} defaultOpen>
        <PreviewRow label="Sum insured" value={form.coverageLakh ? coverageSumInsuredDisplay(form.coverageLakh) : ""} />
        <PreviewRow
          label="Annual premium (est.)"
          value={floaterPremium != null ? formatEnrollmentPremiumInr(floaterPremium) : ""}
          empty="Select coverage amount"
        />
      </SectionShell>

      {/* Submission readiness */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Submission readiness</p>
        {onNavigateToSection && (
          <p className="mt-1 text-[10px] text-muted-foreground">Click a row below to jump to that part of the form.</p>
        )}
        <ul className="mt-2 space-y-1.5">
          {readiness.map((line, i) => {
            if (line.anchor && onNavigateToSection) {
              return (
                <li key={i}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 rounded-md px-1 py-0.5 text-left text-[11px] leading-snug text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    onClick={() => onNavigateToSection(line.anchor)}
                  >
                    {line.tone === "ok" ? (
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" aria-hidden />
                    ) : (
                      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                    )}
                    <span className={line.tone === "ok" ? "text-foreground" : "text-warning"}>{line.text}</span>
                  </button>
                </li>
              );
            }
            return (
              <li key={i} className="flex items-start gap-2 text-[11px] leading-snug">
                {line.tone === "ok" ? (
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" aria-hidden />
                ) : (
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                )}
                <span className={line.tone === "ok" ? "text-foreground" : "text-warning"}>{line.text}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-muted px-2 py-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground">Readiness score</span>
          <span className="text-sm font-bold tabular-nums text-foreground">{canSubmit ? 100 : pct}</span>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar size={11} />
          HR batch: {deadline.cycle} · closes {deadline.label}
        </p>
        {canSubmit && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">
            <CheckCircle2 size={12} />
            Ready for review
          </p>
        )}
      </div>

      {/* ── Estimated premium total (cart-style) ───────────────────── */}
      <div
        className="rounded-xl border border-primary/20 px-4 py-3"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, var(--card)) 0%, color-mix(in srgb, var(--primary) 12%, var(--card)) 100%)",
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/70 mb-2">
          Estimated premium
        </p>
        {floaterPremium != null ? (
          <>
            <div className="flex items-end justify-between gap-2">
              <div className="flex items-baseline gap-0.5">
                <IndianRupee size={18} className="text-primary mb-0.5" strokeWidth={2.5} />
                <span className="text-2xl font-bold tabular-nums text-primary leading-none">
                  {floaterPremium.toLocaleString("en-IN")}
                </span>
              </div>
              <span className="text-[11px] font-medium text-primary/60 mb-0.5">/ year</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between border-t border-primary/10 pt-1.5">
              <span className="text-[10px] text-primary/60">Monthly equivalent</span>
              <span className="text-[11px] font-semibold tabular-nums text-primary/80">
                ₹{Math.round(floaterPremium / 12).toLocaleString("en-IN")} / mo
              </span>
            </div>
            {dependentCount > 0 && (
              <p className="mt-1 text-[10px] text-primary/50">
                Floater · {dependentCount + 1} member{dependentCount + 1 !== 1 ? "s" : ""}
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <IndianRupee size={16} className="text-primary/30" />
            <span className="text-sm font-semibold text-muted-foreground">— Select coverage to see total</span>
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2 py-2 text-[10px] text-foreground">
          <Info size={12} className="mt-0.5 shrink-0 text-primary" />
          Preview updates live as you edit. Open a form section to highlight it here.
        </div>
      )}
    </div>
  );
}
