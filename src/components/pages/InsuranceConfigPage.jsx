import { useState, useRef, useEffect, useCallback, useId, useMemo, forwardRef } from "react";
import {
  ChevronRight, Building2, FileText, Upload, Clock,
  Plus, Trash2, Edit2, Check, X, Save, AlertCircle, CheckCircle2, ChevronDown,
  FileBadge, FileSpreadsheet, Paperclip, ShieldCheck,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast, useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PREMIUM_MATRIX,
  ageBandsValidationError,
  clonePremiumMatrix,
  coverageColumnLabel,
  coverageColumnsSummary,
  coverageSumInsuredInr,
  defaultNewAgeBand,
  formatMatrixPremiumInr,
  getPremiumMatrixStatus,
  loadPremiumMatrixFromStorage,
  nextCoverageLakh,
  parseMatrixPremiumInput,
  parsePremiumMatrixCsv,
  premiumMatricesEqual,
  premiumMatrixCsvTemplate,
  premiumMatrixValidationError,
  rupeesToLakh,
  savePremiumMatrixToStorage,
  SUGGESTED_COVERAGE_LAKHS,
} from "@/lib/premiumMatrix";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SECTION_NAV = [
  { id: "section-insurer", label: "Insurer & contacts" },
  { id: "section-default-coverage", label: "Default coverage" },
  { id: "section-premium", label: "Premium matrix" },
  { id: "section-windows", label: "Enrollment windows" },
  { id: "section-documents", label: "Supporting documents" },
];

const DISCARD_CHANGES_DIALOG = {
  title: "Discard unsaved changes?",
  message: "You have unsaved edits. If you leave now, your changes will be lost.",
  confirmLabel: "Discard changes",
  cancelLabel: "Keep editing",
};

function fmtINR(n) {
  if (n === "" || n == null || Number.isNaN(Number(n))) return "";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fieldId(section, key) {
  return `insurance-config-${section}-${key}`;
}

function isValidEmail(v) {
  if (!v?.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function draftsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isValidEmailField(v) {
  if (!v?.trim()) return true;
  return isValidEmail(v);
}

function validateInsurer(draft) {
  const errors = {};
  if (!draft.name?.trim()) errors.name = "Enter the insurer name.";
  if (!draft.policyNumber?.trim()) errors.policyNumber = "Enter the policy number.";
  if (!draft.effectiveDate) errors.effectiveDate = "Enter the effective date.";
  if (!draft.expiryDate) errors.expiryDate = "Enter the expiry date.";
  if (draft.effectiveDate && draft.expiryDate && draft.expiryDate < draft.effectiveDate) {
    errors.expiryDate = "Expiry date must be the same as or after the effective date.";
  }
  if (!isValidEmailField(draft.contactEmail)) errors.contactEmail = "Enter a valid email (example@company.com).";
  if (!isValidEmailField(draft.hrContactEmail)) errors.hrContactEmail = "Enter a valid email (example@company.com).";
  return errors;
}

function getPolicyStatusChips(data) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const effective = new Date(data.effectiveDate);
  const expiry = new Date(data.expiryDate);
  effective.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const inForce = effective <= today && today <= expiry;
  const notYetActive = today < effective;
  const expired = today > expiry;
  const expiryFormatted = fmtDate(data.expiryDate);
  const effectiveFormatted = fmtDate(data.effectiveDate);

  return [
    {
      id: "policy",
      label: notYetActive
        ? `Starts ${effectiveFormatted}`
        : inForce
          ? "Coverage active"
          : expired
            ? "Policy expired"
            : "Outside coverage dates",
      ok: inForce,
    },
    {
      id: "expiry",
      label: expired ? `Expired ${expiryFormatted}` : `Valid through ${expiryFormatted}`,
      ok: !expired,
    },
  ];
}

function computeSetupStatus({ insurer, defaultCoverage, premiumMatrix, docs }) {
  const insurerOk = !Object.keys(validateInsurer(insurer)).length;
  const defaultOk = Number(defaultCoverage.sumInsured) > 0;
  const premiumOk = !premiumMatrixValidationError(premiumMatrix);
  const documentsOk = docs.length > 0 && docs.every((d) => d.status === "verified");
  return {
    insurer: insurerOk,
    defaultCoverage: defaultOk,
    premium: premiumOk,
    windows: true,
    documents: documentsOk,
  };
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function SectionCard({ id, icon: Icon, title, subtitle, children, action }) {
  return (
    <section id={id} className="scroll-mt-24 bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon size={16} className="text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function FormField({ id, label, required, children, hint, error }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
        {required && (
          <>
            <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {children}
      {error && <p className="text-[11px] text-destructive" role="alert">{error}</p>}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FormSubsection({ title, subtitle, children }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ReadOnlyValue({ value }) {
  return (
    <p className="text-sm text-foreground min-h-9 flex items-center">
      {value != null && value !== "" ? value : <span className="text-muted-foreground">—</span>}
    </p>
  );
}

function TextInput({ id, value, onChange, placeholder, type = "text", disabled, invalid }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full h-9 px-3 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed",
        invalid ? "border-destructive focus:ring-destructive/30" : "border-border",
      )}
    />
  );
}

function SelectInput({ id, value, onChange, options, disabled }) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

function EditSaveActions({ editing, saved, onEdit, onCancel, onSave, saveDisabled }) {
  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"
        >
          <X size={13} aria-hidden /> Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save size={13} aria-hidden /> Save
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {saved && (
        <span className="flex items-center gap-1 text-xs text-success">
          <CheckCircle2 size={13} aria-hidden /> Changes saved
        </span>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"
      >
        <Edit2 size={13} aria-hidden /> Edit
      </button>
    </div>
  );
}

function SectionJumpNav() {
  return (
    <nav aria-label="Insurance setup sections" className="sticky top-0 z-10 -mx-1 mb-5 px-1 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
      <ul className="flex flex-wrap gap-2">
        {SECTION_NAV.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="inline-flex h-8 items-center px-3 rounded-full text-xs font-medium text-muted-foreground border border-border hover:bg-muted hover:text-foreground transition-colors"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SetupProgress({ status }) {
  const items = [
    { key: "insurer", label: "Insurer & contacts" },
    { key: "defaultCoverage", label: "Default coverage" },
    { key: "premium", label: "Premium matrix" },
    { key: "windows", label: "Enrollment windows" },
    {
      key: "documents",
      label: status.documents ? "All documents verified" : "Review documents",
    },
  ];
  const done = items.filter((i) => status[i.key]).length;

  return (
    <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 mb-5" role="status" aria-label={`Setup progress: ${done} of ${items.length} complete`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs font-semibold text-foreground">Setup progress</p>
        <span className="text-[11px] text-muted-foreground">{done} of {items.length} complete</span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map(({ key, label }) => (
          <li
            key={key}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
              status[key]
                ? "bg-success/10 text-success border-success/25"
                : "bg-background text-muted-foreground border-border",
            )}
          >
            {status[key] ? <CheckCircle2 size={11} aria-hidden /> : <AlertCircle size={11} aria-hidden />}
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Section 1: Insurer & contacts ───────────────────────────────────────────

const DEFAULT_INSURER = {
  name: "Star Health and Allied Insurance",
  policyNumber: "P/161123/01/2026/004821",
  contactPerson: "Ramesh Subramaniam",
  contactEmail: "ramesh.s@starhealth.in",
  contactPhone: "+91 98400 12345",
  hrContactPerson: "Priya Nair",
  hrContactEmail: "priya.nair@company.com",
  hrContactPhone: "+91 98765 43210",
  effectiveDate: "2026-04-01",
  expiryDate: "2027-03-31",
};

function InsurerSection({ onSaved, onDataChange }) {
  const [data, setData] = useState(DEFAULT_INSURER);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    onDataChange?.(data);
  }, [data, onDataChange]);

  const startEdit = () => {
    setDraft(data);
    setErrors({});
    setEditing(true);
  };

  const discardEdit = () => {
    setDraft(data);
    setErrors({});
    setEditing(false);
    setConfirmCancel(false);
  };

  const requestCancel = () => {
    if (!draftsEqual(draft, data)) {
      setConfirmCancel(true);
      return;
    }
    discardEdit();
  };

  const handleSave = () => {
    const nextErrors = validateInsurer(draft);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setData(draft);
    setEditing(false);
    setErrors({});
    setSaved(true);
    onSaved?.(draft);
    setTimeout(() => setSaved(false), 2500);
  };

  const d = editing ? draft : data;
  const chips = !editing ? getPolicyStatusChips(data) : null;

  const renderPolicyField = (key, label, { required, type, placeholder } = {}) => {
    const id = fieldId("insurer", key);
    return (
      <FormField id={id} label={label} required={required} error={errors[key]}>
        {editing ? (
          <TextInput
            id={id}
            type={type}
            value={d[key]}
            onChange={(v) => setDraft((prev) => ({ ...prev, [key]: v }))}
            placeholder={placeholder}
            invalid={!!errors[key]}
          />
        ) : (
          <ReadOnlyValue value={type === "date" ? fmtDate(data[key]) : data[key]} />
        )}
      </FormField>
    );
  };

  const renderContactField = (dataKey, label, { type, placeholder } = {}) => {
    const id = fieldId("insurer", dataKey);
    return (
      <FormField id={id} label={label} error={errors[dataKey]}>
        {editing ? (
          <TextInput
            id={id}
            type={type}
            value={d[dataKey]}
            onChange={(v) => setDraft((prev) => ({ ...prev, [dataKey]: v }))}
            placeholder={placeholder}
            invalid={!!errors[dataKey]}
          />
        ) : (
          <ReadOnlyValue value={data[dataKey]} />
        )}
      </FormField>
    );
  };

  return (
    <>
      <SectionCard
        id="section-insurer"
        icon={Building2}
        title="Insurer & contacts"
        subtitle="Your group policy details and who employees should contact"
        action={
          <EditSaveActions
            editing={editing}
            saved={saved}
            onEdit={startEdit}
            onCancel={requestCancel}
            onSave={handleSave}
          />
        }
      >
        <div className="space-y-8">
          <FormSubsection title="Policy details" subtitle="Insurer identity and coverage period">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {renderPolicyField("name", "Insurer name", { required: true, placeholder: "e.g. Star Health Insurance" })}
              {renderPolicyField("policyNumber", "Policy number", { required: true, placeholder: "e.g. P/161123/01/2026/..." })}
              {renderPolicyField("effectiveDate", "Effective date", { required: true, type: "date" })}
              {renderPolicyField("expiryDate", "Expiry date", { required: true, type: "date" })}
            </div>
            {chips && (
              <div className="flex flex-wrap gap-3 pt-1">
                {chips.map(({ id: chipId, label, ok }) => (
                  <span
                    key={chipId}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                      ok ? "bg-success/10 text-success border-success/25" : "bg-warning/10 text-warning border-warning/25",
                    )}
                  >
                    {ok ? <CheckCircle2 size={11} aria-hidden /> : <AlertCircle size={11} aria-hidden />}
                    {label}
                  </span>
                ))}
              </div>
            )}
          </FormSubsection>

          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend className="sr-only">Insurer contact</legend>
            <FormSubsection title="Insurer contact" subtitle="Primary contact at the insurance provider">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {renderContactField("contactPerson", "Insurer contact name", { placeholder: "e.g. Ramesh Subramaniam" })}
                {renderContactField("contactEmail", "Insurer contact email", { type: "email", placeholder: "rm@insurer.com" })}
                {renderContactField("contactPhone", "Insurer contact phone", { placeholder: "+91 XXXXX XXXXX" })}
              </div>
            </FormSubsection>
          </fieldset>

          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend className="sr-only">HR contact</legend>
            <FormSubsection title="HR contact" subtitle="Internal point of contact for enrollment and benefits questions">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {renderContactField("hrContactPerson", "HR contact name", { placeholder: "e.g. Priya Nair" })}
                {renderContactField("hrContactEmail", "HR contact email", { type: "email", placeholder: "hr@company.com" })}
                {renderContactField("hrContactPhone", "HR contact phone", { placeholder: "+91 XXXXX XXXXX" })}
              </div>
            </FormSubsection>
          </fieldset>
        </div>
      </SectionCard>

      {confirmCancel && (
        <ConfirmDialog
          {...DISCARD_CHANGES_DIALOG}
          confirmClass="flex-1 h-10 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-colors"
          onConfirm={discardEdit}
          onCancel={() => setConfirmCancel(false)}
        />
      )}
    </>
  );
}

// ─── Default coverage ────────────────────────────────────────────────────────

const DEFAULT_FALLBACK_COVERAGE = { sumInsured: 200000 };

function DefaultCoverageSection({ onSaved, onDataChange }) {
  const [data, setData] = useState(DEFAULT_FALLBACK_COVERAGE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const inputId = fieldId("default", "sumInsured");

  useEffect(() => {
    onDataChange?.(data);
  }, [data, onDataChange]);

  const startEdit = () => {
    setDraft(data);
    setError("");
    setEditing(true);
  };

  const discardEdit = () => {
    setDraft(data);
    setError("");
    setEditing(false);
    setConfirmCancel(false);
  };

  const requestCancel = () => {
    if (!draftsEqual(draft, data)) {
      setConfirmCancel(true);
      return;
    }
    discardEdit();
  };

  const handleSave = () => {
    const amount = Number(draft.sumInsured);
    if (!draft.sumInsured && draft.sumInsured !== 0) {
      setError("Enter the sum insured amount.");
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Enter an amount greater than ₹0.");
      return;
    }
    setData({ sumInsured: amount });
    setEditing(false);
    setError("");
    setSaved(true);
    onSaved?.({ sumInsured: amount });
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <section id="section-default-coverage" className="scroll-mt-24 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-5 rounded-2xl bg-card border border-border">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} className="text-primary" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Default coverage if employees miss enrollment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              If someone doesn&apos;t enroll before the window and grace period end, they get this coverage amount automatically. It&apos;s individual cover, paid by the employer.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              For employees who do enroll, premiums come from the premium matrix (saved in setup).
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-2 flex-shrink-0 md:w-[400px]">
          <div className="flex-1">
            <FormField id={inputId} label="Sum insured (₹)" hint={editing ? "Amount in rupees, no commas" : undefined} error={error}>
              {editing ? (
                <TextInput
                  id={inputId}
                  value={draft.sumInsured}
                  onChange={(v) => setDraft({ sumInsured: v === "" ? "" : v })}
                  type="number"
                  placeholder="e.g. 200000"
                  invalid={!!error}
                />
              ) : (
                <ReadOnlyValue value={fmtINR(data.sumInsured)} />
              )}
            </FormField>
          </div>
          <EditSaveActions
            editing={editing}
            saved={saved}
            onEdit={startEdit}
            onCancel={requestCancel}
            onSave={handleSave}
          />
        </div>
      </section>

      {confirmCancel && (
        <ConfirmDialog
          {...DISCARD_CHANGES_DIALOG}
          confirmClass="flex-1 h-10 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-colors"
          onConfirm={discardEdit}
          onCancel={() => setConfirmCancel(false)}
        />
      )}
    </>
  );
}

// ─── Premium by age (matrix) ───────────────────────────────────────────────────

function MatrixNumInput({ value, onChange, ariaLabel, placeholder, align = "right", className, disabled, onKeyDown }) {
  return (
    <input
      type="number"
      value={value ?? ""}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={cn(
        "h-8 min-w-[4.5rem] px-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed",
        align === "right" ? "text-right w-full" : "text-left",
        className,
      )}
    />
  );
}

const MatrixPremiumInput = forwardRef(function MatrixPremiumInput(
  { value, onChange, ariaLabel, disabled, onEnterDown },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!focused) {
      setText(value === "" || value == null ? "" : formatMatrixPremiumInr(value));
    }
  }, [value, focused]);

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      disabled={disabled}
      aria-label={ariaLabel}
      value={focused ? text : (value === "" || value == null ? "" : formatMatrixPremiumInr(value))}
      onFocus={() => {
        setFocused(true);
        setText(value === "" || value == null ? "" : String(value));
      }}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        setFocused(false);
        const parsed = parseMatrixPremiumInput(text);
        onChange(parsed === "" ? "" : parsed);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnterDown?.();
        }
      }}
      placeholder="₹0"
      className={cn(
        "h-8 min-w-[4.5rem] w-full px-2 rounded-lg border border-border bg-background text-xs text-foreground text-right tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed",
      )}
    />
  );
});

function MatrixStatusChip({ matrix }) {
  const { ok, error } = getPremiumMatrixStatus(matrix);
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/25">
        <CheckCircle2 size={10} aria-hidden /> Complete
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/25 max-w-[12rem] truncate"
      title={error ?? undefined}
    >
      <AlertCircle size={10} aria-hidden /> Needs attention
    </span>
  );
}

const COVERAGE_CHIP_INLINE_MAX = 3;

function ManageCoveragesDialog({ open, columns, canRemove, onClose, onAdd, onChangeLakh, onRemove }) {
  const [draftRupees, setDraftRupees] = useState({});
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (open) {
      setDraftRupees(
        Object.fromEntries(columns.map((c) => [c.id, String(Math.round(Number(c.lakh) * 100000))])),
      );
      setLocalError("");
    }
  }, [open, columns]);

  const applyRupees = (colId) => {
    const lakh = rupeesToLakh(draftRupees[colId]);
    if (!lakh || Number.isNaN(lakh) || lakh <= 0) {
      setLocalError("Enter a valid sum insured (e.g. 100000 or 1000000).");
      return;
    }
    const seen = new Set();
    for (const c of columns) {
      const val = c.id === colId ? lakh : rupeesToLakh(draftRupees[c.id] ?? c.lakh * 100000);
      if (seen.has(val)) {
        setLocalError(`${coverageColumnLabel(lakh)} is already used.`);
        return;
      }
      seen.add(val);
    }
    setLocalError("");
    onChangeLakh(colId, lakh);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-lg" showCloseButton>
        <div className="border-b border-border px-6 py-4">
          <DialogTitle className="text-sm font-semibold">Edit sum insured columns</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Enter sum insured in rupees. The premium grid columns update to match.
          </p>
        </div>
        <div className="px-6 py-4 max-h-[min(24rem,60vh)] overflow-y-auto">
          {localError && (
            <p className="mb-3 text-xs text-destructive" role="alert">{localError}</p>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted-foreground">
                <th className="pb-2 text-left font-semibold">Sum insured (₹)</th>
                <th className="pb-2 text-left font-semibold">Label</th>
                <th className="pb-2 w-16"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={100000}
                      step={100000}
                      value={draftRupees[col.id] ?? ""}
                      onChange={(e) => setDraftRupees((d) => ({ ...d, [col.id]: e.target.value }))}
                      onBlur={() => applyRupees(col.id)}
                      onKeyDown={(e) => e.key === "Enter" && applyRupees(col.id)}
                      className="h-8 w-28 px-2 rounded-lg border border-border bg-background text-xs"
                      aria-label={`Sum insured in rupees for column ${col.id}`}
                    />
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {coverageColumnLabel(rupeesToLakh(draftRupees[col.id] ?? col.lakh * 100000) || col.lakh)}
                  </td>
                  <td className="py-2 text-right">
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(col)}
                        className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center"
                        aria-label={`Remove ${coverageColumnLabel(col.lakh)}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 h-9 px-3 rounded-xl text-xs font-medium border border-border hover:bg-muted"
          >
            <Plus size={13} aria-hidden /> Add sum insured
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Sum insured columns — configured outside the premium grid. */
function CoverageColumnsBar({
  columns,
  matrix,
  editing,
  manageOpen,
  onManageOpenChange,
  onChangeLakh,
  onRemove,
  onAdd,
  canRemove,
}) {
  const usedLakhs = new Set(columns.map((c) => Number(c.lakh)));
  const useCompact = columns.length > COVERAGE_CHIP_INLINE_MAX;

  return (
    <>
      <div className="mb-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-foreground">
                <span className="text-muted-foreground font-medium">Step 1 ·</span>{" "}
                {columns.length} sum insured {columns.length === 1 ? "amount" : "amounts"}
              </p>
              <MatrixStatusChip matrix={matrix} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate" title={coverageColumnsSummary(columns)}>
              {coverageColumnsSummary(columns)}
            </p>
          </div>
          {editing && (
            <div className="flex items-center gap-2 shrink-0">
              {useCompact && (
                <>
                  <button
                    type="button"
                    onClick={() => onManageOpenChange(true)}
                    className="h-8 px-3 rounded-xl text-xs font-medium border border-border bg-card hover:bg-muted transition-colors"
                  >
                    Edit sum insured
                  </button>
                  <button
                    type="button"
                    onClick={onAdd}
                    className="flex items-center gap-1 h-8 px-2.5 rounded-xl text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/15"
                  >
                    <Plus size={12} aria-hidden /> Add amount
                  </button>
                </>
              )}
              {!useCompact && (
                <button
                  type="button"
                  onClick={onAdd}
                  className="flex items-center gap-1 h-8 px-2.5 rounded-xl text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/15"
                >
                  <Plus size={12} aria-hidden /> Add amount
                </button>
              )}
            </div>
          )}
        </div>

        {useCompact ? (
          <div
            className="mt-3 flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
            role="list"
            aria-label="Sum insured amounts"
          >
            {columns.map((col) => (
              <span
                key={col.id}
                role="listitem"
                className="shrink-0 px-2.5 py-1 rounded-md border border-border bg-card text-[11px] font-semibold tabular-nums text-foreground"
                title={coverageSumInsuredInr(col.lakh)}
              >
                {coverageColumnLabel(col.lakh)}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {columns.map((col) => (
              <CoverageColumnChip
                key={col.id}
                col={col}
                usedLakhs={usedLakhs}
                canRemove={canRemove && editing}
                editing={editing}
                onChangeLakh={onChangeLakh}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>

      <ManageCoveragesDialog
        open={manageOpen}
        columns={columns}
        canRemove={canRemove}
        onClose={() => onManageOpenChange(false)}
        onAdd={onAdd}
        onChangeLakh={onChangeLakh}
        onRemove={(col) => {
          onRemove(col);
          if (columns.length <= 2) onManageOpenChange(false);
        }}
      />
    </>
  );
}

function CoverageColumnChip({ col, usedLakhs, canRemove, editing, onChangeLakh, onRemove }) {
  const label = coverageColumnLabel(col.lakh);
  const sumInsured = coverageSumInsuredInr(col.lakh);
  const currentLakh = Number(col.lakh);
  const menuOptions = SUGGESTED_COVERAGE_LAKHS.filter(
    (lakh) => lakh === currentLakh || !usedLakhs.has(lakh),
  );

  if (!editing) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs shadow-sm"
        title={sumInsured}
      >
        <span className="font-bold tabular-nums">{label}</span>
        <span className="text-muted-foreground">{sumInsured}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center rounded-lg border border-border bg-card text-xs shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-muted/50 rounded-l-lg transition-colors"
          >
            <span className="font-bold tabular-nums">{label}</span>
            <span className="text-muted-foreground">{sumInsured}</span>
            <ChevronDown size={11} className="text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[10rem]">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
              Sum insured
            </DropdownMenuLabel>
            {menuOptions.map((lakh) => (
              <DropdownMenuItem
                key={lakh}
                onSelect={() => onChangeLakh(col.id, lakh)}
                className={cn(
                  "text-xs justify-between",
                  currentLakh === lakh && "bg-primary/10 text-primary font-semibold",
                )}
              >
                <span>{coverageColumnLabel(lakh)}</span>
                <span className="text-muted-foreground">{coverageSumInsuredInr(lakh)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(col)}
          className="flex size-8 items-center justify-center rounded-r-lg border-l border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Remove ${label}`}
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </div>
  );
}

function AgeBandCell({ band, editing, readOnly, dimmed, onStartEdit, onCancel, onSave, onChange, onDoubleClick }) {
  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <MatrixNumInput
          value={band.ageFrom}
          onChange={(v) => onChange({ ageFrom: v === "" ? "" : Number(v) })}
          ariaLabel="Minimum age"
          placeholder="Min"
          align="left"
          className="w-12 min-w-0"
        />
        <span className="text-xs text-muted-foreground" aria-hidden>–</span>
        <MatrixNumInput
          value={band.ageTo}
          onChange={(v) => onChange({ ageTo: v === "" ? "" : Number(v) })}
          ariaLabel="Maximum age"
          placeholder="Max"
          align="left"
          className="w-12 min-w-0"
        />
        <span className="text-[10px] text-muted-foreground">yrs</span>
        <button type="button" onClick={onSave} className="size-7 rounded-md bg-success/10 text-success flex items-center justify-center ml-0.5" aria-label="Save age band">
          <Check size={11} />
        </button>
        <button type="button" onClick={onCancel} className="size-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center" aria-label="Cancel">
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 min-w-[7rem]",
        dimmed && "opacity-50",
      )}
      onDoubleClick={readOnly ? undefined : onDoubleClick}
    >
      <span className="text-xs font-semibold text-foreground tabular-nums whitespace-nowrap">
        {band.ageFrom}–{band.ageTo} yrs
      </span>
      {!readOnly && (
        <button
          type="button"
          onClick={onStartEdit}
          className="size-7 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary flex items-center justify-center shrink-0"
          aria-label={`Edit age band ${band.ageFrom}–${band.ageTo}`}
        >
          <Edit2 size={11} />
        </button>
      )}
    </div>
  );
}

function PremiumMatrixSection({ onDataChange, onSaved, showToast }) {
  const initialSaved = useMemo(
    () => loadPremiumMatrixFromStorage() ?? DEFAULT_PREMIUM_MATRIX,
    [],
  );
  const [saved, setSaved] = useState(initialSaved);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => clonePremiumMatrix(initialSaved));
  const [matrixError, setMatrixError] = useState("");
  const [addBandMode, setAddBandMode] = useState(false);
  const [newBand, setNewBand] = useState(() =>
    defaultNewAgeBand(initialSaved.ageBands, initialSaved.coverageColumns),
  );
  const [confirmDeleteBand, setConfirmDeleteBand] = useState(null);
  const [confirmDeleteColumn, setConfirmDeleteColumn] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [editingBandId, setEditingBandId] = useState(null);
  const [bandDraft, setBandDraft] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [manageCoveragesOpen, setManageCoveragesOpen] = useState(false);
  const nextBandId = useRef(initialSaved.ageBands.length + 1);
  const nextColId = useRef(
    Math.max(0, ...initialSaved.coverageColumns.map((c) => c.id)) + 1,
  );
  const premiumFocusRefs = useRef({});

  const matrix = editing ? draft : saved;
  const { coverageColumns, ageBands } = matrix;
  const dirty = editing && !premiumMatricesEqual(draft, saved);

  useEffect(() => {
    onDataChange?.(saved);
  }, [saved, onDataChange]);

  useEffect(() => {
    if (!loadPremiumMatrixFromStorage()) {
      savePremiumMatrixToStorage(initialSaved);
    }
  }, [initialSaved]);

  useEffect(() => {
    if (!editing) return;
    const t = setTimeout(() => {
      const err = premiumMatrixValidationError(draft);
      setMatrixError(err ?? "");
    }, 300);
    return () => clearTimeout(t);
  }, [draft, editing]);

  const setDraftMatrix = (updater) => {
    setDraft((m) => (typeof updater === "function" ? updater(m) : updater));
  };

  const applyMatrix = (next, toastMsg) => {
    const err = premiumMatrixValidationError(next);
    if (err) {
      setMatrixError(err);
      return false;
    }
    setDraftMatrix(next);
    setMatrixError("");
    if (toastMsg) showToast?.(toastMsg);
    return true;
  };

  const startEdit = () => {
    setDraft(clonePremiumMatrix(saved));
    setMatrixError("");
    setEditing(true);
  };

  const discardEdit = () => {
    setDraft(clonePremiumMatrix(saved));
    setEditing(false);
    setAddBandMode(false);
    setEditingBandId(null);
    setBandDraft(null);
    setMatrixError("");
    setConfirmCancel(false);
  };

  const requestCancel = () => {
    if (dirty) {
      setConfirmCancel(true);
      return;
    }
    discardEdit();
  };

  const handleSave = () => {
    const err = premiumMatrixValidationError(draft);
    if (err) {
      setMatrixError(err);
      return;
    }
    const next = clonePremiumMatrix(draft);
    setSaved(next);
    savePremiumMatrixToStorage(next);
    setEditing(false);
    setAddBandMode(false);
    setEditingBandId(null);
    setBandDraft(null);
    setMatrixError("");
    setSavedFlash(true);
    onSaved?.();
    showToast?.("Saved: premium matrix");
    setTimeout(() => setSavedFlash(false), 2500);
  };

  const updatePremium = (bandId, colId, raw) => {
    if (!editing) return;
    const val = raw === "" ? "" : Number(raw);
    setDraftMatrix((m) => ({
      ...m,
      ageBands: m.ageBands.map((b) =>
        b.id === bandId
          ? { ...b, premiums: { ...b.premiums, [colId]: val === "" ? "" : val } }
          : b,
      ),
    }));
  };

  const changeColumnLakh = (colId, lakh) => {
    if (!editing) return;
    const next = {
      ...draft,
      coverageColumns: coverageColumns.map((c) =>
        c.id === colId ? { ...c, lakh: Number(lakh) } : c,
      ),
    };
    if (next.coverageColumns.filter((c) => Number(c.lakh) === Number(lakh)).length > 1) {
      setMatrixError(`Duplicate coverage column: ${coverageColumnLabel(lakh)}.`);
      return;
    }
    setDraftMatrix(next);
    setMatrixError("");
    showToast?.("Sum insured updated");
  };

  const focusPremiumBelow = (bandId, colId) => {
    const bandIdx = ageBands.findIndex((b) => b.id === bandId);
    if (bandIdx < 0 || bandIdx >= ageBands.length - 1) return;
    const nextBand = ageBands[bandIdx + 1];
    const key = `${nextBand.id}-${colId}`;
    premiumFocusRefs.current[key]?.focus();
  };

  const addCoverageColumn = () => {
    const lakh = nextCoverageLakh(coverageColumns);
    const id = nextColId.current;
    nextColId.current += 1;
    const lastColId = coverageColumns[coverageColumns.length - 1]?.id;
    const next = {
      coverageColumns: [...coverageColumns, { id, lakh }],
      ageBands: ageBands.map((b) => ({
        ...b,
        premiums: {
          ...b.premiums,
          [id]:
            lastColId != null && b.premiums[lastColId] != null && b.premiums[lastColId] !== ""
              ? b.premiums[lastColId]
              : 5000,
        },
      })),
    };
    setDraftMatrix(next);
    setMatrixError("");
    showToast?.("Sum insured column added");
  };

  const saveBandEdit = () => {
    if (editingBandId == null || !bandDraft) return;
    const next = {
      ...draft,
      ageBands: ageBands.map((b) =>
        b.id === editingBandId
          ? { ...b, ageFrom: +bandDraft.ageFrom, ageTo: +bandDraft.ageTo }
          : b,
      ),
    };
    const ageErr = ageBandsValidationError(next.ageBands);
    if (ageErr) {
      setMatrixError(ageErr);
      return;
    }
    setDraftMatrix(next);
    setEditingBandId(null);
    setBandDraft(null);
    setMatrixError("");
    showToast?.("Age band updated");
  };

  const removeCoverageColumn = (colId) => {
    if (coverageColumns.length <= 1) return;
    const next = {
      coverageColumns: coverageColumns.filter((c) => c.id !== colId),
      ageBands: ageBands.map((b) => {
        const { [colId]: _removed, ...premiums } = b.premiums ?? {};
        return { ...b, premiums };
      }),
    };
    applyMatrix(next, "Coverage column removed");
    setConfirmDeleteColumn(null);
  };

  const addAgeBand = () => {
    const id = nextBandId.current + 1;
    const premiums = {};
    for (const col of coverageColumns) {
      premiums[col.id] = newBand.premiums[col.id] === "" ? "" : +newBand.premiums[col.id];
    }
    const candidate = {
      id,
      ageFrom: +newBand.ageFrom,
      ageTo: +newBand.ageTo,
      premiums,
    };
    const next = { ...draft, ageBands: [...ageBands, candidate] };
    const ageErr = ageBandsValidationError(next.ageBands);
    if (ageErr) {
      setMatrixError(ageErr);
      return;
    }
    const fullErr = premiumMatrixValidationError(next);
    if (fullErr) {
      setMatrixError(fullErr);
      return;
    }
    nextBandId.current = id;
    setDraftMatrix(next);
    setNewBand(defaultNewAgeBand(next.ageBands, coverageColumns));
    setAddBandMode(false);
    setMatrixError("");
    showToast?.("Age band added");
  };

  const removeAgeBand = (id) => {
    const next = { ...draft, ageBands: ageBands.filter((b) => b.id !== id) };
    applyMatrix(next, "Age band removed");
    setConfirmDeleteBand(null);
  };

  const openImport = () => {
    if (!editing) startEdit();
    setImportText(premiumMatrixCsvTemplate(editing ? draft : saved));
    setImportError("");
    setImportOpen(true);
  };

  const runImport = () => {
    const existingIds = coverageColumns.map((c) => c.id);
    const result = parsePremiumMatrixCsv(importText, existingIds);
    if (result.error) {
      setImportError(result.error);
      return;
    }
    const maxBand = Math.max(0, ...result.matrix.ageBands.map((b) => b.id));
    const maxCol = Math.max(0, ...result.matrix.coverageColumns.map((c) => c.id));
    nextBandId.current = maxBand;
    nextColId.current = maxCol + 1;
    setDraftMatrix(result.matrix);
    if (!editing) setEditing(true);
    setMatrixError("");
    setImportOpen(false);
    showToast?.("Premium matrix imported — save to apply");
  };

  return (
    <>
      <SectionCard
        id="section-premium"
        icon={FileSpreadsheet}
        title="Premium matrix"
        subtitle="Step 1: Configure sum insured amounts. Step 2: Enter annual premiums (₹) for each age band. Ranges include both endpoints (e.g. 26–35 includes 26 and 35). Employee enrollment uses the saved matrix."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {editing && (
              <>
                <button
                  type="button"
                  onClick={openImport}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"
                >
                  <Upload size={13} aria-hidden /> Import spreadsheet
                </button>
                <button
                  type="button"
                  onClick={() => setManageCoveragesOpen(true)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"
                >
                  Edit sum insured
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewBand(defaultNewAgeBand(ageBands, coverageColumns));
                    setMatrixError("");
                    setAddBandMode(true);
                  }}
                  disabled={addBandMode}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors disabled:opacity-40"
                >
                  <Plus size={13} aria-hidden /> Add age band
                </button>
              </>
            )}
            {dirty && (
              <span className="text-[10px] font-medium text-warning px-2 py-0.5 rounded-full bg-warning/10 border border-warning/25">
                Unsaved changes
              </span>
            )}
            <EditSaveActions
              editing={editing}
              saved={savedFlash}
              onEdit={startEdit}
              onCancel={requestCancel}
              onSave={handleSave}
              saveDisabled={!!premiumMatrixValidationError(draft)}
            />
          </div>
        }
      >
        {matrixError && editing && (
          <p className="mb-3 text-xs text-destructive flex items-center gap-1.5" role="alert">
            <AlertCircle size={14} aria-hidden /> {matrixError}
          </p>
        )}

        <CoverageColumnsBar
          columns={coverageColumns}
          matrix={matrix}
          editing={editing}
          manageOpen={manageCoveragesOpen}
          onManageOpenChange={setManageCoveragesOpen}
          onChangeLakh={changeColumnLakh}
          onAdd={addCoverageColumn}
          onRemove={(col) =>
            setConfirmDeleteColumn({ id: col.id, label: coverageColumnLabel(col.lakh) })
          }
          canRemove={coverageColumns.length > 1}
        />

        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          <span className="text-foreground">Step 2 ·</span> Premium grid
        </p>

        <div
          className="overflow-x-auto rounded-xl border border-border max-h-[min(28rem,55vh)] overflow-y-auto"
          role="region"
          aria-label="Premium matrix by age band and coverage"
        >
          <table className="w-full text-sm border-collapse">
            <colgroup>
              <col className="w-[9.5rem]" />
              {coverageColumns.map((col) => (
                <col key={col.id} className="min-w-[5.5rem]" />
              ))}
              <col className="w-10" />
            </colgroup>
            <thead className="sticky top-0 z-[3]">
              <tr className="border-b border-border/60 bg-muted/20">
                <th
                  rowSpan={2}
                  scope="col"
                  className="sticky left-0 z-[4] bg-muted/30 px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground align-middle border-r border-border"
                >
                  Age band
                </th>
                <th
                  colSpan={coverageColumns.length}
                  scope="colgroup"
                  className="sticky top-0 bg-muted/20 px-3 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Annual premium (₹)
                </th>
                <th rowSpan={2} scope="col" className="sticky top-0 w-10 border-l border-border/60 bg-muted/20" aria-hidden />
              </tr>
              <tr className="border-b border-border bg-muted/30">
                {coverageColumns.map((col, idx) => (
                  <th
                    key={col.id}
                    scope="col"
                    title={`${coverageSumInsuredInr(col.lakh)} sum insured`}
                    className={cn(
                      "sticky top-[1.625rem] bg-muted/30 px-3 py-2 text-right text-xs font-bold text-foreground tabular-nums",
                      idx > 0 && "border-l border-border/40",
                      idx % 2 === 1 && "bg-muted/50",
                    )}
                  >
                    {coverageColumnLabel(col.lakh)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ageBands.map((band) => {
                const rowActive = editingBandId === band.id;
                const rowDimmed = editingBandId != null && !rowActive;
                return (
                  <tr
                    key={band.id}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors group",
                      rowActive ? "bg-primary/5" : "hover:bg-muted/15",
                      rowDimmed && "opacity-60",
                    )}
                  >
                    <td className="sticky left-0 z-[1] bg-card group-hover:bg-muted/15 px-3 py-2.5 border-r border-border shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                      <AgeBandCell
                        band={rowActive && bandDraft ? bandDraft : band}
                        editing={rowActive}
                        readOnly={!editing}
                        dimmed={rowDimmed}
                        onStartEdit={() => {
                          setEditingBandId(band.id);
                          setBandDraft({ ageFrom: band.ageFrom, ageTo: band.ageTo });
                        }}
                        onDoubleClick={() => {
                          if (!editing) return;
                          setEditingBandId(band.id);
                          setBandDraft({ ageFrom: band.ageFrom, ageTo: band.ageTo });
                        }}
                        onCancel={() => {
                          setEditingBandId(null);
                          setBandDraft(null);
                        }}
                        onSave={saveBandEdit}
                        onChange={(patch) => setBandDraft((d) => ({ ...d, ...patch }))}
                      />
                    </td>
                    {coverageColumns.map((col, colIdx) => (
                      <td
                        key={col.id}
                        className={cn("px-3 py-2.5 text-right tabular-nums", colIdx % 2 === 1 && "bg-muted/10")}
                      >
                        {editing ? (
                          <MatrixPremiumInput
                            ref={(el) => {
                              premiumFocusRefs.current[`${band.id}-${col.id}`] = el;
                            }}
                            value={band.premiums?.[col.id] ?? ""}
                            onChange={(v) => updatePremium(band.id, col.id, v)}
                            onEnterDown={() => focusPremiumBelow(band.id, col.id)}
                            ariaLabel={`Premium for ages ${band.ageFrom}–${band.ageTo}, ${coverageColumnLabel(col.lakh)}`}
                          />
                        ) : (
                          <span className="text-xs text-foreground">
                            {formatMatrixPremiumInr(band.premiums?.[col.id]) || "—"}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-2.5 text-right">
                      {editing && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDeleteBand({
                              id: band.id,
                              label: `${band.ageFrom}–${band.ageTo}`,
                            })
                          }
                          aria-label={`Delete age band ${band.ageFrom}–${band.ageTo}`}
                          title="Delete row"
                          className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {addBandMode && (
                <tr className="border-b border-primary/20 bg-primary/5">
                  <td className="sticky left-0 z-[1] bg-primary/5 px-4 py-2.5 border-r border-border">
                    <div className="flex items-center gap-1.5">
                      <MatrixNumInput
                        value={newBand.ageFrom}
                        onChange={(v) => setNewBand((d) => ({ ...d, ageFrom: v }))}
                        ariaLabel="Minimum age for new band"
                        placeholder="Min"
                        align="left"
                        className="w-14 min-w-0"
                      />
                      <span className="text-xs text-muted-foreground" aria-hidden>–</span>
                      <MatrixNumInput
                        value={newBand.ageTo}
                        onChange={(v) => setNewBand((d) => ({ ...d, ageTo: v }))}
                        ariaLabel="Maximum age for new band"
                        placeholder="Max"
                        align="left"
                        className="w-14 min-w-0"
                      />
                      <span className="text-[10px] text-muted-foreground">yrs</span>
                    </div>
                  </td>
                  {coverageColumns.map((col, colIdx) => (
                    <td key={col.id} className={cn("px-3 py-2.5", colIdx % 2 === 1 && "bg-primary/5")}>
                      <MatrixPremiumInput
                        value={newBand.premiums[col.id] ?? ""}
                        onChange={(v) =>
                          setNewBand((d) => ({
                            ...d,
                            premiums: { ...d.premiums, [col.id]: v },
                          }))
                        }
                        ariaLabel={`Premium for new band, ${coverageColumnLabel(col.lakh)}`}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={addAgeBand}
                        aria-label="Save new age band"
                        className="size-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddBandMode(false);
                          setNewBand(defaultNewAgeBand(ageBands, coverageColumns));
                          setMatrixError("");
                        }}
                        aria-label="Cancel new age band"
                        className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-border"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          All amounts are annual premiums in INR. The 0–35 band includes age 0 where your policy covers newborns. Overlapping age ranges are blocked when you add or change bands. Save to apply rates in employee enrollment.
        </p>
      </SectionCard>

      {confirmCancel && (
        <ConfirmDialog
          {...DISCARD_CHANGES_DIALOG}
          confirmClass="flex-1 h-10 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-colors"
          onConfirm={discardEdit}
          onCancel={() => setConfirmCancel(false)}
        />
      )}

      {confirmDeleteBand && (
        <ConfirmDialog
          title="Delete age band?"
          message={`Remove the age band ${confirmDeleteBand.label}? Employees in that range won't have a premium until you add a new band.`}
          confirmLabel="Delete"
          onConfirm={() => removeAgeBand(confirmDeleteBand.id)}
          onCancel={() => setConfirmDeleteBand(null)}
        />
      )}

      {confirmDeleteColumn && (
        <ConfirmDialog
          title="Remove coverage column?"
          message={`Remove ${confirmDeleteColumn.label} coverage from the matrix? Premiums in that column will be deleted.`}
          confirmLabel="Remove"
          onConfirm={() => removeCoverageColumn(confirmDeleteColumn.id)}
          onCancel={() => setConfirmDeleteColumn(null)}
        />
      )}

      <Dialog open={importOpen} onOpenChange={(open) => !open && setImportOpen(false)}>
        <DialogContent className="max-w-lg gap-0 p-0 sm:max-w-xl" showCloseButton>
          <div className="border-b border-border px-6 py-4">
            <DialogTitle className="text-sm font-semibold">Import premium matrix</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Paste CSV or tab-separated values. Use Age Band (e.g. 0-35) or Age From / Age To, then sum insured in rupees (100000, 200000) or lakhs (1, 2).
            </p>
          </div>
          <div className="px-6 py-4 space-y-3">
            {importError && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <AlertCircle size={14} aria-hidden /> {importError}
              </p>
            )}
            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError("");
              }}
              rows={10}
              spellCheck={false}
              className="w-full font-mono text-xs px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              aria-label="Premium matrix CSV"
            />
            <p className="text-[11px] text-muted-foreground">
              Example: <code className="text-foreground">0-35,4852,9145,12758</code> for ages 0–35 at ₹1L / ₹2L / ₹3L.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="h-9 px-4 rounded-xl text-xs font-medium border border-border hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={runImport}
              className="h-9 px-4 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Import matrix
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Documents ───────────────────────────────────────────────────────────────

const DEFAULT_DOCS = [
  { id: 1, name: "Group_Mediclaim_Policy_2026.pdf", type: "Policy Document", size: "2.4 MB", date: "2026-03-28", status: "verified" },
  { id: 2, name: "SLA_StarHealth_FY2026.pdf", type: "Insurer SLA", size: "1.1 MB", date: "2026-03-28", status: "verified" },
  { id: 3, name: "Employee_Enrollment_Form.docx", type: "Enrollment Form", size: "340 KB", date: "2026-04-01", status: "verified" },
  { id: 4, name: "Claim_Procedure_Handbook.pdf", type: "Claims Guide", size: "5.2 MB", date: "2026-04-01", status: "pending" },
];

const DOC_ICONS = {
  "Policy Document": FileBadge,
  "Insurer SLA": FileText,
  "Service Agreement": FileText,
  "Enrollment Form": FileText,
  "Claims Guide": FileText,
  Other: Paperclip,
};

const DOC_TYPE_OPTIONS = [
  "Policy Document", "Insurer SLA", "Enrollment Form", "Claims Guide", "Other",
];

function DocumentsSection({ onDataChange, showToast }) {
  const [docs, setDocs] = useState(DEFAULT_DOCS);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileRef = useRef();
  const nextDocId = useRef(docs.length + 1);
  const uploadId = useId();

  useEffect(() => {
    onDataChange?.(docs);
  }, [docs, onDataChange]);

  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      const id = ++nextDocId.current;
      setUploading(file.name);
      setTimeout(() => {
        setDocs((d) => [
          ...d,
          {
            id,
            name: file.name,
            type: "Policy Document",
            size: file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
            date: new Date().toISOString().split("T")[0],
            status: "pending",
          },
        ]);
        setUploading(null);
        showToast?.("Uploaded. Choose a document type if needed.");
      }, 900);
    });
  };

  const removeDoc = (id) => {
    setDocs((d) => d.filter((doc) => doc.id !== id));
    setConfirmDelete(null);
    showToast?.("Document removed");
  };

  const updateDocType = (id, type) => {
    setDocs((d) => d.map((doc) => (doc.id === id ? { ...doc, type } : doc)));
  };

  return (
    <>
      <SectionCard
        id="section-documents"
        icon={Upload}
        title="Supporting documents"
        subtitle="Upload policy, SLA, enrollment, and claims documents for your records"
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 mb-4 transition-all",
            dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30",
          )}
        >
          <input
            ref={fileRef}
            id={uploadId}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg"
            className="sr-only"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
          <div className={cn("size-12 rounded-2xl flex items-center justify-center transition-colors", dragging ? "bg-primary/15" : "bg-muted")}>
            <Upload size={22} className={dragging ? "text-primary" : "text-muted-foreground"} aria-hidden />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{dragging ? "Drop files here" : "Drag files here or choose files"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">PDF, Word, or images · up to 20 MB each</p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 h-9 px-4 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Choose files
          </button>
          {uploading && (
            <div className="absolute inset-0 rounded-2xl bg-background/80 flex items-center justify-center gap-2">
              <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden />
              <span className="text-xs text-foreground">Uploading {uploading}…</span>
            </div>
          )}
        </div>

        {docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <Paperclip size={24} className="mx-auto text-muted-foreground mb-2" aria-hidden />
            <p className="text-sm font-medium text-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your policy PDF, insurer SLA, and enrollment form to finish setup.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => {
              const Icon = DOC_ICONS[doc.type] ?? Paperclip;
              const typeSelectId = fieldId("doc-type", doc.id);
              return (
                <div key={doc.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/20 transition-colors">
                  <div className="size-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-primary" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{doc.size}</span>
                      <span className="text-[11px] text-muted-foreground" aria-hidden>·</span>
                      <span className="text-[11px] text-muted-foreground">{doc.date}</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto sm:min-w-[160px]">
                    <label htmlFor={typeSelectId} className="sr-only">Document type for {doc.name}</label>
                    <SelectInput
                      id={typeSelectId}
                      value={doc.type}
                      onChange={(v) => updateDocType(doc.id, v)}
                      options={DOC_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
                    />
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0",
                      doc.status === "verified"
                        ? "bg-success/10 text-success border-success/25"
                        : "bg-warning/10 text-warning border-warning/25",
                    )}
                  >
                    {doc.status === "verified" ? "Verified" : "Pending review"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ id: doc.id, name: doc.name })}
                    aria-label={`Remove ${doc.name}`}
                    title="Remove"
                    className="size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {confirmDelete && (
        <ConfirmDialog
          title="Remove document?"
          message={`Remove "${confirmDelete.name}" from supporting documents?`}
          confirmLabel="Remove"
          onConfirm={() => removeDoc(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

// ─── Enrollment windows ──────────────────────────────────────────────────────

const DEFAULT_BATCH_CFG = {
  durationDays: 15,
  cycleType: "bimonthly",
  firstBatchStart: 1,
  autoReminders: true,
  reminderDaysBefore: 3,
  gracePeriodDays: 2,
  notes: "Two windows per month: 1–15 and 16–end of month. Enrollments close after the grace period.",
};

const ENROLLMENT_FREQUENCY_LABEL = "Twice per month (1st–15th and 16th–end)";

function BatchDurationSection({ onSaved, onDataChange }) {
  const [cfg, setCfg] = useState(DEFAULT_BATCH_CFG);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cfg);
  const [saved, setSaved] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    onDataChange?.(cfg);
  }, [cfg, onDataChange]);

  const startEdit = () => {
    setDraft(cfg);
    setEditing(true);
  };

  const discardEdit = () => {
    setDraft(cfg);
    setEditing(false);
    setConfirmCancel(false);
  };

  const requestCancel = () => {
    if (!draftsEqual(draft, cfg)) {
      setConfirmCancel(true);
      return;
    }
    discardEdit();
  };

  const handleSave = () => {
    setCfg(draft);
    setEditing(false);
    setSaved(true);
    onSaved?.(draft);
    setTimeout(() => setSaved(false), 2500);
  };

  const c = editing ? draft : cfg;
  const f = (key) => ({
    id: fieldId("windows", key),
    value: c[key],
    onChange: (v) => setDraft((d) => ({ ...d, [key]: v })),
    disabled: !editing,
  });

  return (
    <>
      <SectionCard
        id="section-windows"
        icon={Clock}
        title="Enrollment windows"
        subtitle="How long employees have to enroll each period, and when reminders go out"
        action={
          <EditSaveActions editing={editing} saved={saved} onEdit={startEdit} onCancel={requestCancel} onSave={handleSave} />
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id={fieldId("windows", "frequency")} label="Enrollment schedule" required>
              <ReadOnlyValue value={ENROLLMENT_FREQUENCY_LABEL} />
            </FormField>
            <FormField id={f("durationDays").id} label="Window length (days)" hint="How many days each enrollment period stays open">
              {editing ? (
                <TextInput {...f("durationDays")} type="number" placeholder="15" />
              ) : (
                <ReadOnlyValue value={`${cfg.durationDays} days`} />
              )}
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id={f("firstBatchStart").id} label="First window starts on" hint="Day of month (1 = 1st)">
              {editing ? (
                <TextInput {...f("firstBatchStart")} type="number" placeholder="1" />
              ) : (
                <ReadOnlyValue value={`Day ${cfg.firstBatchStart} of the month`} />
              )}
            </FormField>
            <FormField id={f("gracePeriodDays").id} label="Grace period (days)" hint="Extra days you still accept late enrollments">
              {editing ? (
                <TextInput {...f("gracePeriodDays")} type="number" placeholder="2" />
              ) : (
                <ReadOnlyValue value={`${cfg.gracePeriodDays} days`} />
              )}
            </FormField>
          </div>

          <div className="flex items-start justify-between p-4 rounded-xl border border-border bg-muted/20 gap-4">
            <div>
              <p className="text-xs font-semibold text-foreground">Send email reminders</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Remind employees who haven&apos;t enrolled before the window closes</p>
            </div>
            <button
              type="button"
              disabled={!editing}
              aria-label={c.autoReminders ? "Turn off email reminders" : "Turn on email reminders"}
              onClick={() => setDraft((d) => ({ ...d, autoReminders: !d.autoReminders }))}
              className={cn(
                "relative inline-flex h-5 w-9 min-w-[36px] items-center rounded-full border transition-colors flex-shrink-0 mt-0.5",
                c.autoReminders ? "bg-primary border-primary" : "bg-muted border-border",
                !editing && "opacity-60 cursor-not-allowed",
              )}
            >
              <span className={cn("inline-block size-3.5 rounded-full bg-background shadow transition-transform", c.autoReminders ? "translate-x-[18px]" : "translate-x-[2px]")} />
            </button>
          </div>

          {c.autoReminders && (
            <FormField id={f("reminderDaysBefore").id} label="Reminder lead time (days)" hint="Employees receive an email this many days before the window closes">
              {editing ? (
                <TextInput {...f("reminderDaysBefore")} type="number" placeholder="3" />
              ) : (
                <ReadOnlyValue value={`${cfg.reminderDaysBefore} days before the window closes`} />
              )}
            </FormField>
          )}

          <FormField id={fieldId("windows", "notes")} label="Internal notes">
            {editing ? (
              <textarea
                id={fieldId("windows", "notes")}
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                rows={2}
                placeholder="Notes for your team (not shown to employees)"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            ) : (
              <ReadOnlyValue value={cfg.notes} />
            )}
          </FormField>
        </div>
      </SectionCard>

      {confirmCancel && (
        <ConfirmDialog
          {...DISCARD_CHANGES_DIALOG}
          confirmClass="flex-1 h-10 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-colors"
          onConfirm={discardEdit}
          onCancel={() => setConfirmCancel(false)}
        />
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InsuranceConfigPage({ onNavigate }) {
  const { toasts, showToast, dismissToast } = useToast();
  const [insurerData, setInsurerData] = useState(DEFAULT_INSURER);
  const [defaultCoverage, setDefaultCoverage] = useState(DEFAULT_FALLBACK_COVERAGE);
  const [premiumMatrix, setPremiumMatrix] = useState(DEFAULT_PREMIUM_MATRIX);
  const [docs, setDocs] = useState(DEFAULT_DOCS);

  const setupStatus = computeSetupStatus({
    insurer: insurerData,
    defaultCoverage,
    premiumMatrix,
    docs,
  });

  const notifySaved = useCallback((message) => {
    showToast(message ?? "Changes saved");
  }, [showToast]);

  return (
    <main className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="insurance-config" onNavigate={onNavigate} />

      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-border" aria-hidden />
            <span className="text-sm text-muted-foreground">Admin</span>
            <ChevronRight size={14} className="text-muted-foreground" aria-hidden />
            <button
              type="button"
              onClick={() => onNavigate("insurance-management")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Insurance
            </button>
            <ChevronRight size={14} className="text-muted-foreground" aria-hidden />
            <span className="text-sm text-foreground font-medium">Setup</span>
          </div>
        </AppHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="flex flex-col gap-4 px-6 py-4 pb-10">
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="type-page-title">Insurance setup</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/25">
                  Plan year 2026
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Set up your group policy, premiums, enrollment windows, and documents so employees can enroll.
              </p>
            </div>

            <SectionJumpNav />
            <SetupProgress status={setupStatus} />

            <div className="space-y-5">
              <InsurerSection
                onDataChange={setInsurerData}
                onSaved={() => notifySaved("Saved: insurer & contacts")}
              />
              <DefaultCoverageSection
                onDataChange={setDefaultCoverage}
                onSaved={() => notifySaved("Saved: default coverage")}
              />
              <PremiumMatrixSection
                onDataChange={setPremiumMatrix}
                onSaved={() => notifySaved("Saved: premium matrix")}
                showToast={showToast}
              />
              <BatchDurationSection onSaved={() => notifySaved("Saved: enrollment windows")} />
              <DocumentsSection onDataChange={setDocs} showToast={showToast} />
            </div>
          </div>
        </div>
      </div>

      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} actionLabel={t.actionLabel} onAction={t.onAction} onDismiss={() => dismissToast(t.id)} />
      ))}
    </main>
  );
}
