import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Info,
  Shield,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import {
  buildReadinessLines,
  computeEnrollmentPercent,
  currentSectionTitle,
  formatEnrollmentSavedRelative,
  remainingSectionsSummary,
} from "@/components/features/insurance/enrollmentPreviewUtils";

function formatSavedClock(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDisplayDateSafe(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PreviewRow({ label, value, empty = "Not added yet" }) {
  const show = value !== undefined && value !== null && String(value).trim() !== "";
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100/90 last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 shrink-0">{label}</span>
      <span className={`text-xs text-right leading-snug ${show ? "text-slate-900 font-medium" : "text-slate-400 italic"}`}>
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
        focused ? "border-blue-200 bg-blue-50/35 shadow-sm" : "border-slate-200/80 bg-slate-50/50"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
            <IconGlyph size={15} />
          </div>
          <span className="truncate text-xs font-bold uppercase tracking-wide text-slate-700">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {statusDot}
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && <div className="border-t border-slate-200/70 px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

function statusIcon(status) {
  if (status === "done") return <CheckCircle2 size={14} className="text-emerald-500" aria-hidden />;
  if (status === "partial") return <AlertTriangle size={13} className="text-amber-500" aria-hidden />;
  return <span className="size-2 rounded-full bg-slate-300" aria-hidden />;
}

export function EnrollmentLivePreview({
  policy,
  deadline,
  form,
  status,
  draftState,
  lastSavedAt,
  previewFocusKey,
  canSubmit,
  warnings,
  urgency,
  compact,
  onNavigateToSection,
}) {
  const pct = useMemo(() => computeEnrollmentPercent(status, form), [status, form]);
  const readiness = useMemo(() => buildReadinessLines(status, form, canSubmit, warnings), [status, form, canSubmit, warnings]);
  const dependentCount =
    (form.includeParents ? 2 : 0) + form.children.filter((c) => c.fullName?.trim()).length + (form.isMarried === true ? 1 : 0);

  const selfComplete = status.self === "done";
  const parentMotherOk = form.includeParents && form.mother.firstName && form.mother.dob;
  const parentFatherOk = form.includeParents && form.father.firstName && form.father.dob;

  return (
    <div
      className={`flex flex-col gap-3 ${compact ? "" : "rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-xl shadow-slate-300/25"}`}
    >
      <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Enrollment progress</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{pct}%</p>
            <p className="mt-0.5 text-[11px] text-slate-600">
              Currently editing:{" "}
              <span className="font-semibold text-slate-900">{currentSectionTitle(previewFocusKey)}</span>
            </p>
            <p className="mt-1 text-[10px] text-slate-500">{remainingSectionsSummary(status)}</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {draftState === "draft_saved" ? "Draft saved" : "In progress"}
            </div>
            {lastSavedAt ? (
              <p className="mt-1 text-[10px] text-slate-500" title={formatSavedClock(lastSavedAt)}>
                Saved {formatEnrollmentSavedRelative(lastSavedAt)}
                <span className="text-slate-400"> · {formatSavedClock(lastSavedAt)}</span>
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-slate-400">—</p>
            )}
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Shield size={11} className="text-slate-400" />
            {policy.name}
          </span>
          <span className="tabular-nums text-amber-700">{urgency.text}</span>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-950">
          <Sparkles size={13} className="text-indigo-500 shrink-0" />
          Coverage overview
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-indigo-900/80">
          Est. sum insured <strong>{policy.sumInsured}</strong> · Premium band <strong>{policy.premiumRange}</strong> · Dependents
          tracked: <strong>{dependentCount}</strong>
        </p>
      </div>

      <SectionShell title="Self insurance" icon={Stethoscope} focused={previewFocusKey === "self"} statusDot={statusIcon(status.self)}>
        <PreviewRow label="DOB" value={form.dob ? formatDisplayDateSafe(form.dob) : ""} />
        <PreviewRow label="Age" value={form.age} />
        <PreviewRow label="Gender" value={form.gender} />
        <PreviewRow label="Blood group" value={form.bloodGroup} />
        {!selfComplete && <p className="mt-1 text-[10px] font-medium text-amber-700">Required: DOB & gender</p>}
      </SectionShell>

      <SectionShell title="Family" icon={Users} focused={previewFocusKey === "family"} statusDot={statusIcon(status.spouse)} defaultOpen>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Spouse</p>
        {form.isMarried === null && <p className="mb-3 text-xs italic text-slate-400">Awaiting marital status</p>}
        {form.isMarried === false && <p className="mb-3 text-xs text-slate-500">Not married — spouse not enrolled</p>}
        {form.isMarried === true && (
          <div className="mb-3 rounded-lg border border-slate-200/80 bg-white/80 px-2 py-2">
            <PreviewRow label="Name" value={form.spouse.fullName} />
            <PreviewRow label="DOB" value={form.spouse.dob ? formatDisplayDateSafe(form.spouse.dob) : ""} />
            <PreviewRow label="Age" value={form.spouse.age} />
          </div>
        )}

        <p className="mb-2 mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Parents</p>
        <p className="mb-2 text-[10px] font-semibold text-slate-600">
          {form.includeParents ? "Included in enrollment" : "Not included"}
        </p>
        {["mother", "father"].map((p) => (
          <div key={p} className="mb-2 rounded-lg border border-slate-200/80 bg-white/80 px-2 py-2 last:mb-0">
            <p className="text-[10px] font-bold uppercase text-slate-500">{p}</p>
            <PreviewRow label="Name" value={[form[p].firstName, form[p].lastName].filter(Boolean).join(" ")} />
            <PreviewRow label="DOB" value={form[p].dob ? formatDisplayDateSafe(form[p].dob) : ""} />
            <PreviewRow label="Age" value={form[p].age} />
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Coverage</span>
              <span
                className={`rounded-full px-1.5 py-0.5 font-semibold ${
                  p === "mother"
                    ? parentMotherOk
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                    : parentFatherOk
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {form.includeParents ? (p === "mother" ? (parentMotherOk ? "OK" : "Incomplete") : parentFatherOk ? "OK" : "Incomplete") : "—"}
              </span>
            </div>
          </div>
        ))}

        <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Children</p>
        <p className="mb-2 text-[10px] font-semibold text-slate-600">{form.children.length} / 2 children added</p>
        {form.children.length === 0 && <p className="mb-2 text-xs italic text-slate-400">No dependents added yet</p>}
        {form.children.map((c, i) => (
          <div key={i} className="mb-2 rounded-lg border border-slate-200/80 bg-white/80 px-2 py-2 last:mb-0">
            <p className="text-[10px] font-bold uppercase text-slate-500">Child {i + 1}</p>
            <PreviewRow label="Name" value={c.fullName} />
            <PreviewRow label="DOB" value={c.dob ? formatDisplayDateSafe(c.dob) : ""} />
            <PreviewRow label="Age" value={c.age} />
            <PreviewRow label="Gender" value={c.gender} />
          </div>
        ))}
      </SectionShell>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Submission readiness</p>
        {onNavigateToSection && (
          <p className="mt-1 text-[10px] text-slate-500">Click a row below to jump to that part of the form.</p>
        )}
        <ul className="mt-2 space-y-1.5">
          {readiness.map((line, i) => {
            if (line.anchor && onNavigateToSection) {
              return (
                <li key={i}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 rounded-md px-1 py-0.5 text-left text-[11px] leading-snug text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                    onClick={() => onNavigateToSection(line.anchor)}
                  >
                    {line.tone === "ok" ? (
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden />
                    ) : (
                      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
                    )}
                    <span className={line.tone === "ok" ? "text-slate-800" : "text-amber-900"}>{line.text}</span>
                  </button>
                </li>
              );
            }
            return (
              <li key={i} className="flex items-start gap-2 text-[11px] leading-snug">
                {line.tone === "ok" ? (
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden />
                ) : (
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
                )}
                <span className={line.tone === "ok" ? "text-slate-800" : "text-amber-900"}>{line.text}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5">
          <span className="text-[10px] font-semibold text-slate-600">Readiness score</span>
          <span className="text-sm font-bold tabular-nums text-slate-900">{canSubmit ? 100 : pct}</span>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
          <Calendar size={11} />
          HR batch: {deadline.cycle} · closes {deadline.label}
        </p>
        {canSubmit && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
            <CheckCircle2 size={12} />
            Ready for review
          </p>
        )}
      </div>

      {!compact && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-2 py-2 text-[10px] text-blue-900">
          <Info size={12} className="mt-0.5 shrink-0 text-blue-600" />
          Preview updates live as you edit. Open a form section to highlight it here.
        </div>
      )}
    </div>
  );
}
