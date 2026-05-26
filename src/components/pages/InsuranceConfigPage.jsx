import { useState, useRef, useEffect, useCallback, useId } from "react";
import {
  ChevronRight, Building2, FileText, Upload, Clock,
  Plus, Trash2, Edit2, Check, X, Save, AlertCircle, CheckCircle2,
  FileBadge, FileSpreadsheet, Paperclip, ArrowLeft, ShieldCheck,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast, useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SECTION_NAV = [
  { id: "section-insurer", label: "Insurer & contacts" },
  { id: "section-default-coverage", label: "Default coverage" },
  { id: "section-premium", label: "Premium by age" },
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

function slabsValidationError(slabs) {
  const sorted = [...slabs].sort((a, b) => Number(a.ageFrom) - Number(b.ageFrom));
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const from = Number(s.ageFrom);
    const to = Number(s.ageTo);
    if (Number.isNaN(from) || Number.isNaN(to) || from > to) {
      return `Age band ${s.ageFrom}–${s.ageTo} is invalid. Minimum age must be less than or equal to maximum.`;
    }
    if (Number(s.premium) <= 0) return "Enter a premium greater than ₹0 for each age band.";
    if (i > 0) {
      const prev = sorted[i - 1];
      if (from <= Number(prev.ageTo)) {
        return `Age band ${from}–${to} overlaps with ${prev.ageFrom}–${prev.ageTo}. Adjust the ranges so they don't overlap.`;
      }
      if (from > Number(prev.ageTo) + 1) {
        const missingFrom = Number(prev.ageTo) + 1;
        const missingTo = from - 1;
        if (missingFrom === missingTo) {
          return `Age ${missingFrom} isn't covered. Extend a band or add a new one.`;
        }
        return `Ages ${missingFrom}–${missingTo} aren't covered. Extend a band or add a new one.`;
      }
    }
  }
  return null;
}

function computeSetupStatus({ insurer, defaultCoverage, slabs, docs }) {
  const insurerOk = !Object.keys(validateInsurer(insurer)).length;
  const defaultOk = Number(defaultCoverage.sumInsured) > 0;
  const premiumOk = slabs.length > 0 && !slabsValidationError(slabs);
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
    { key: "premium", label: "Premium by age" },
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
              For employees who do enroll, premiums come from the age table in Premium by age.
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

// ─── Premium by age ──────────────────────────────────────────────────────────

const DEFAULT_SLABS = [
  { id: 1, ageFrom: 18, ageTo: 25, premium: 12000 },
  { id: 2, ageFrom: 26, ageTo: 35, premium: 18000 },
  { id: 3, ageFrom: 36, ageTo: 45, premium: 26000 },
  { id: 4, ageFrom: 46, ageTo: 55, premium: 38000 },
  { id: 5, ageFrom: 56, ageTo: 65, premium: 54000 },
  { id: 6, ageFrom: 66, ageTo: 75, premium: 78000 },
  { id: 7, ageFrom: 76, ageTo: 99, premium: 112000 },
];

function defaultNewSlab(slabs) {
  if (!slabs.length) return { ageFrom: "18", ageTo: "25", premium: "12000" };
  const last = slabs.reduce((a, b) => (a.ageTo >= b.ageTo ? a : b));
  const ageFrom = last.ageTo + 1;
  const ageTo = Math.min(ageFrom + 9, 99);
  if (ageFrom > ageTo) return { ageFrom: "18", ageTo: "25", premium: String(last.premium) };
  return { ageFrom: String(ageFrom), ageTo: String(ageTo), premium: String(Math.round(last.premium * 1.12)) };
}

function PremiumSlabsSection({ onDataChange, showToast }) {
  const [slabs, setSlabs] = useState(DEFAULT_SLABS);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [addMode, setAddMode] = useState(false);
  const [newSlab, setNewSlab] = useState(() => defaultNewSlab(DEFAULT_SLABS));
  const [slabError, setSlabError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const nextId = useRef(DEFAULT_SLABS.length + 1);

  useEffect(() => {
    onDataChange?.(slabs);
  }, [slabs, onDataChange]);

  const startEdit = (slab) => {
    setSlabError("");
    setEditingId(slab.id);
    setDraft({ ...slab });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
    setSlabError("");
  };

  const saveEdit = () => {
    const next = slabs.map((r) => (r.id === editingId ? { ...draft, id: editingId, ageFrom: +draft.ageFrom, ageTo: +draft.ageTo, premium: +draft.premium } : r));
    const err = slabsValidationError(next);
    if (err) {
      setSlabError(err);
      return;
    }
    setSlabs(next);
    setEditingId(null);
    setSlabError("");
    showToast?.("Saved: age band updated");
  };

  const deleteSlab = (id) => {
    setSlabs((s) => s.filter((r) => r.id !== id));
    setConfirmDelete(null);
    showToast?.("Age band removed");
  };

  const addSlab = () => {
    const candidate = {
      ...newSlab,
      id: nextId.current + 1,
      ageFrom: +newSlab.ageFrom,
      ageTo: +newSlab.ageTo,
      premium: +newSlab.premium,
    };
    const next = [...slabs, candidate];
    const err = slabsValidationError(next);
    if (err) {
      setSlabError(err);
      return;
    }
    nextId.current += 1;
    setSlabs(next);
    setNewSlab(defaultNewSlab(next));
    setAddMode(false);
    setSlabError("");
    showToast?.("Age band added");
  };

  const openAddSlab = () => {
    if (editingId != null) return;
    setNewSlab(defaultNewSlab(slabs));
    setSlabError("");
    setAddMode(true);
  };

  const numInput = (val, onChange, { id, placeholder, align = "right", ariaLabel }) => (
    <input
      id={id}
      type="number"
      value={val}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
        align === "right" ? "text-right" : "text-left",
      )}
    />
  );

  return (
    <>
      <SectionCard
        id="section-premium"
        icon={FileSpreadsheet}
        title="Premium by age"
        subtitle="Annual premium per employee (₹) by age. Both ends of each range count (e.g. 26–35 includes age 26 and 35)."
        action={
          <button
            type="button"
            onClick={openAddSlab}
            disabled={addMode || editingId != null}
            title={editingId != null ? "Finish editing the current band first" : undefined}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors disabled:opacity-40"
          >
            <Plus size={13} aria-hidden /> Add age band
          </button>
        }
      >
        {slabError && (
          <p className="mb-3 text-xs text-destructive flex items-center gap-1.5" role="alert">
            <AlertCircle size={14} aria-hidden /> {slabError}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Age band", "Annual premium (₹)", ""].map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={cn(
                      "px-4 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap",
                      i === 2 ? "text-right pr-4" : i === 0 ? "text-left" : "text-right",
                    )}
                  >
                    {i === 2 ? <span className="sr-only">Actions</span> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slabs.map((slab) => {
                const isEditing = editingId === slab.id;
                return (
                  <tr key={slab.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          {numInput(draft.ageFrom, (v) => setDraft((d) => ({ ...d, ageFrom: v })), { placeholder: "Min age", align: "left", ariaLabel: "Minimum age" })}
                          <span className="text-xs text-muted-foreground" aria-hidden>–</span>
                          {numInput(draft.ageTo, (v) => setDraft((d) => ({ ...d, ageTo: v })), { placeholder: "Max age", align: "left", ariaLabel: "Maximum age" })}
                          <span className="text-xs text-muted-foreground">yrs</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-foreground">{slab.ageFrom}–{slab.ageTo} yrs</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing
                        ? numInput(draft.premium, (v) => setDraft((d) => ({ ...d, premium: v })), { placeholder: "Amount", ariaLabel: "Annual premium" })
                        : <span className="text-xs text-foreground">{fmtINR(slab.premium)}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" onClick={saveEdit} aria-label="Save age band" title="Save" className="size-9 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors"><Check size={13} /></button>
                          <button type="button" onClick={cancelEdit} aria-label="Cancel editing" title="Cancel" className="size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-border transition-colors"><X size={13} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" onClick={() => startEdit(slab)} aria-label={`Edit age band ${slab.ageFrom}–${slab.ageTo}`} title="Edit" className="size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"><Edit2 size={13} /></button>
                          <button type="button" onClick={() => setConfirmDelete({ id: slab.id, label: `${slab.ageFrom}–${slab.ageTo}` })} aria-label={`Delete age band ${slab.ageFrom}–${slab.ageTo}`} title="Delete" className="size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {addMode && (
                <tr className="border-b border-primary/20 bg-primary/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {numInput(newSlab.ageFrom, (v) => setNewSlab((d) => ({ ...d, ageFrom: v })), { placeholder: "Min age", align: "left", ariaLabel: "Minimum age for new band" })}
                      <span className="text-xs text-muted-foreground" aria-hidden>–</span>
                      {numInput(newSlab.ageTo, (v) => setNewSlab((d) => ({ ...d, ageTo: v })), { placeholder: "Max age", align: "left", ariaLabel: "Maximum age for new band" })}
                      <span className="text-xs text-muted-foreground">yrs</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {numInput(newSlab.premium, (v) => setNewSlab((d) => ({ ...d, premium: v })), { placeholder: "e.g. 45000", ariaLabel: "Annual premium for new band" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={addSlab} aria-label="Save new age band" title="Save" className="size-9 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors"><Check size={13} /></button>
                      <button type="button" onClick={() => { setAddMode(false); setNewSlab(defaultNewSlab(slabs)); setSlabError(""); }} aria-label="Cancel new age band" title="Cancel" className="size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-border transition-colors"><X size={13} /></button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">All amounts are annual premiums in Indian rupees (INR).</p>
      </SectionCard>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete age band?"
          message={`Remove the age band ${confirmDelete.label}? Employees in that range won't have a premium until you add a new band.`}
          confirmLabel="Delete"
          onConfirm={() => deleteSlab(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
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
  const [slabs, setSlabs] = useState(DEFAULT_SLABS);
  const [docs, setDocs] = useState(DEFAULT_DOCS);

  const setupStatus = computeSetupStatus({
    insurer: insurerData,
    defaultCoverage,
    slabs,
    docs,
  });

  const notifySaved = useCallback((message) => {
    showToast(message ?? "Changes saved");
  }, [showToast]);

  return (
    <main className="flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
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

        <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col px-6 pt-5 pb-10">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onNavigate?.("insurance-management")}
                  className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={13} aria-hidden />
                  Back to insurance
                </button>
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
              <PremiumSlabsSection onDataChange={setSlabs} showToast={showToast} />
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
