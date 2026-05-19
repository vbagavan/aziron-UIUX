import { useState, useRef } from "react";
import {
  ChevronRight, Settings, Building2, FileText, Upload, Clock,
  Plus, Trash2, Edit2, Check, X, Save, AlertCircle, CheckCircle2,
  FileBadge, FileImage, FileSpreadsheet, Paperclip, ArrowLeft, ShieldCheck,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtINR(n) {
  if (!n && n !== 0) return "";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function SectionCard({ icon: Icon, title, subtitle, children, action }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon size={16} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FormField({ label, required, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Section 1: Health Insurer Details ───────────────────────────────────────

const DEFAULT_INSURER = {
  name: "Star Health and Allied Insurance",
  policyNumber: "P/161123/01/2026/004821",
  policyType: "group",
  contactPerson: "Ramesh Subramaniam",
  contactEmail: "ramesh.s@starhealth.in",
  contactPhone: "+91 98400 12345",
  effectiveDate: "2026-04-01",
  expiryDate: "2027-03-31",
  maxCoverage: 500000,
  tpaName: "Family Health Plan (TPA) Ltd.",
  networkHospitals: "8,200+",
};

function InsurerSection() {
  const [data, setData] = useState(DEFAULT_INSURER);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [saved, setSaved] = useState(false);

  const field = (key) => ({
    value: editing ? draft[key] : data[key],
    onChange: v => setDraft(d => ({ ...d, [key]: v })),
    disabled: !editing,
  });

  const handleSave = () => {
    setData(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <SectionCard
      icon={Building2}
      title="Health Insurer Details"
      subtitle="Primary insurer and policy information for the enrollment program"
      action={
        editing ? (
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditing(false); setDraft(data); }} className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"><X size={13} /> Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"><Save size={13} /> Save</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {saved && <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 size={13} /> Changes saved</span>}
            <button onClick={() => { setEditing(true); setDraft(data); }} className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"><Edit2 size={13} /> Edit</button>
          </div>
        )
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <FormField label="Insurer Name" required>
          <TextInput {...field("name")} placeholder="e.g. Star Health Insurance" />
        </FormField>
        <FormField label="Policy Number" required>
          <TextInput {...field("policyNumber")} placeholder="e.g. P/161123/01/2026/..." />
        </FormField>
        <FormField label="Policy Type" required>
          <SelectInput
            value={editing ? draft.policyType : data.policyType}
            onChange={v => setDraft(d => ({ ...d, policyType: v }))}
            options={[
              { value: "group", label: "Group Mediclaim" },
              { value: "individual", label: "Individual" },
              { value: "family_floater", label: "Family Floater" },
              { value: "top_up", label: "Top-up / Super Top-up" },
            ]}
          />
        </FormField>
        <FormField label="Contact Person">
          <TextInput {...field("contactPerson")} placeholder="e.g. Ramesh Subramaniam" />
        </FormField>
        <FormField label="Contact Email">
          <TextInput {...field("contactEmail")} type="email" placeholder="rm@insurer.com" />
        </FormField>
        <FormField label="Contact Phone">
          <TextInput {...field("contactPhone")} placeholder="+91 XXXXX XXXXX" />
        </FormField>
        <FormField label="Policy Effective Date" required>
          <TextInput {...field("effectiveDate")} type="date" />
        </FormField>
        <FormField label="Policy Expiry Date" required>
          <TextInput {...field("expiryDate")} type="date" />
        </FormField>
        <FormField label="Sum insured per member (₹/year)">
          <TextInput {...field("maxCoverage")} type="number" placeholder="500000" />
        </FormField>
        <FormField label="TPA name" hint="TPA (third-party administrator) handles claims">
          <TextInput {...field("tpaName")} placeholder="e.g. Medi Assist" />
        </FormField>
        <FormField label="Network Hospitals">
          <TextInput {...field("networkHospitals")} placeholder="e.g. 8,200+" />
        </FormField>
      </div>
      {!editing && (() => {
        const expiryDate = new Date(data.expiryDate);
        const expiryOk = expiryDate > new Date();
        const expiryFormatted = expiryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        const chips = [
          { id: "policy", label: "Policy in force", ok: true },
          { id: "expiry", label: expiryOk ? `Renews ${expiryFormatted}` : `Expired ${expiryFormatted}`, ok: expiryOk },
          { id: "tpa", label: data.tpaName ? `TPA: ${data.tpaName}` : "No TPA on file", ok: !!data.tpaName },
        ];
        return (
          <div className="mt-5 flex flex-wrap gap-3">
            {chips.map(({ id, label, ok }) => (
              <span key={id} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border", ok ? "bg-success/10 text-success border-success/25" : "bg-warning/10 text-warning border-warning/25")}>
                {ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />} {label}
              </span>
            ))}
          </div>
        );
      })()}
    </SectionCard>
  );
}

// ─── Section: Default Coverage (auto-applied on missed deadline) ────────────

const DEFAULT_FALLBACK_COVERAGE = { sumInsured: 200000 };

function DefaultCoverageSection() {
  const [data, setData] = useState(DEFAULT_FALLBACK_COVERAGE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setData(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-5 rounded-2xl bg-card border border-border">
      {/* Left: icon + title + description */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={18} className="text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Default coverage for missed enrollments</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-applied when an employee doesn&apos;t enroll before the window plus grace period closes. Individual coverage, employer-paid.
          </p>
        </div>
      </div>

      {/* Right: input + actions */}
      <div className="flex items-center gap-2 flex-shrink-0 md:w-[360px]">
        <div className="flex-1">
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Sum insured (₹)</label>
          <TextInput
            value={editing ? draft.sumInsured : data.sumInsured}
            onChange={v => setDraft(d => ({ ...d, sumInsured: v === "" ? "" : Number(v) }))}
            disabled={!editing}
            type="number"
            placeholder="200000"
          />
        </div>
        <div className="flex items-center gap-1.5 self-end">
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setDraft(data); }}
                aria-label="Cancel"
                className="size-9 rounded-xl text-muted-foreground border border-border hover:bg-muted transition-colors flex items-center justify-center"
              >
                <X size={14} />
              </button>
              <button
                onClick={handleSave}
                aria-label="Save"
                className="size-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center"
              >
                <Save size={14} />
              </button>
            </>
          ) : (
            <>
              {saved && <CheckCircle2 size={14} className="text-success mr-1" aria-label="Saved" />}
              <button
                onClick={() => { setEditing(true); setDraft(data); }}
                aria-label="Edit default coverage"
                className="size-9 rounded-xl text-muted-foreground border border-border hover:bg-muted transition-colors flex items-center justify-center"
              >
                <Edit2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: Age-wise Premium Slabs ───────────────────────────────────────

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
  if (!slabs.length) {
    return { ageFrom: "18", ageTo: "25", premium: "12000" };
  }
  const last = slabs.reduce((a, b) => (a.ageTo >= b.ageTo ? a : b));
  const ageFrom = last.ageTo + 1;
  const ageTo = Math.min(ageFrom + 9, 99);
  if (ageFrom > ageTo) {
    return { ageFrom: "18", ageTo: "25", premium: String(last.premium) };
  }
  const premium = Math.round(last.premium * 1.12);
  return {
    ageFrom: String(ageFrom),
    ageTo: String(ageTo),
    premium: String(premium),
  };
}

function PremiumSlabsSection() {
  const [slabs, setSlabs] = useState(DEFAULT_SLABS);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [addMode, setAddMode] = useState(false);
  const [newSlab, setNewSlab] = useState(() => defaultNewSlab(DEFAULT_SLABS));
  const nextId = useRef(DEFAULT_SLABS.length + 1);

  const startEdit = (slab) => { setEditingId(slab.id); setDraft({ ...slab }); };
  const cancelEdit = () => { setEditingId(null); setDraft({}); };
  const saveEdit = () => {
    setSlabs(s => s.map(r => r.id === editingId ? { ...draft, id: editingId } : r));
    setEditingId(null);
  };
  const deleteSlab = (id) => setSlabs(s => s.filter(r => r.id !== id));
  const addSlab = () => {
    setSlabs(s => [...s, { ...newSlab, id: ++nextId.current, ageFrom: +newSlab.ageFrom, ageTo: +newSlab.ageTo, premium: +newSlab.premium }]);
    setNewSlab(defaultNewSlab([...slabs, { ageFrom: +newSlab.ageFrom, ageTo: +newSlab.ageTo, premium: +newSlab.premium }]));
    setAddMode(false);
  };

  const openAddSlab = () => {
    setNewSlab(defaultNewSlab(slabs));
    setAddMode(true);
  };

  const numInput = (val, onChange, { placeholder, align = "right" } = {}) => (
    <input
      type="number"
      value={val}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
        align === "right" ? "text-right" : "text-left",
      )}
    />
  );

  return (
    <SectionCard
      icon={FileSpreadsheet}
      title="Premium by age"
      subtitle="Annual employee premium (₹) for each age band. Ages at range ends are included."
      action={
        <button onClick={openAddSlab} disabled={addMode}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors disabled:opacity-40">
          <Plus size={13} /> Add age band
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Age band", "Annual premium (₹)", ""].map((h, i) => (
                <th key={i} scope="col" className={cn("px-4 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap", i === 2 ? "text-right pr-4" : i === 0 ? "text-left" : "text-right")}>
                  {i === 2 ? <span className="sr-only">Actions</span> : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slabs.map(slab => {
              const isEditing = editingId === slab.id;
              return (
                <tr key={slab.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        {numInput(draft.ageFrom, v => setDraft(d => ({ ...d, ageFrom: v })), { placeholder: "Min age", align: "left" })}
                        <span className="text-xs text-muted-foreground">–</span>
                        {numInput(draft.ageTo, v => setDraft(d => ({ ...d, ageTo: v })), { placeholder: "Max age", align: "left" })}
                        <span className="text-xs text-muted-foreground">yrs</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-foreground">{slab.ageFrom}–{slab.ageTo} yrs</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing
                      ? numInput(draft.premium, v => setDraft(d => ({ ...d, premium: v })), { placeholder: "Amount" })
                      : <span className="text-xs text-foreground">{fmtINR(slab.premium)}</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={saveEdit} aria-label="Save age band" className="size-7 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors"><Check size={13} /></button>
                        <button type="button" onClick={cancelEdit} aria-label="Cancel editing" className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-border transition-colors"><X size={13} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => startEdit(slab)} aria-label={`Edit age band ${slab.ageFrom}–${slab.ageTo}`} className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"><Edit2 size={13} /></button>
                        <button type="button" onClick={() => deleteSlab(slab.id)} aria-label={`Delete age band ${slab.ageFrom}–${slab.ageTo}`} className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Add row */}
            {addMode && (
              <tr className="border-b border-primary/20 bg-primary/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {numInput(newSlab.ageFrom, v => setNewSlab(d => ({ ...d, ageFrom: v })), { placeholder: "Min age", align: "left" })}
                    <span className="text-xs text-muted-foreground">–</span>
                    {numInput(newSlab.ageTo, v => setNewSlab(d => ({ ...d, ageTo: v })), { placeholder: "Max age", align: "left" })}
                    <span className="text-xs text-muted-foreground">yrs</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {numInput(newSlab.premium, v => setNewSlab(d => ({ ...d, premium: v })), { placeholder: "e.g. 45000" })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button type="button" onClick={addSlab} aria-label="Save new age band" className="size-7 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors"><Check size={13} /></button>
                    <button type="button" onClick={() => { setAddMode(false); setNewSlab(defaultNewSlab(slabs)); }} aria-label="Cancel new age band" className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-border transition-colors"><X size={13} /></button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">All amounts are annual premiums in Indian rupees (INR).</p>
    </SectionCard>
  );
}

// ─── Section 3: Supporting Documents ─────────────────────────────────────────

const DEFAULT_DOCS = [
  { id: 1, name: "Group_Mediclaim_Policy_2026.pdf",    type: "Policy Document", size: "2.4 MB",  date: "2026-03-28", status: "verified" },
  { id: 2, name: "SLA_StarHealth_FY2026.pdf",           type: "Service Agreement", size: "1.1 MB", date: "2026-03-28", status: "verified" },
  { id: 3, name: "Employee_Enrollment_Form.docx",       type: "Enrollment Form",   size: "340 KB", date: "2026-04-01", status: "verified" },
  { id: 4, name: "Claim_Procedure_Handbook.pdf",        type: "Claims Guide",      size: "5.2 MB", date: "2026-04-01", status: "pending" },
];

const DOC_ICONS = {
  "Policy Document":   FileBadge,
  "Service Agreement": FileText,
  "Enrollment Form":   FileText,
  "Claims Guide":      FileText,
  "Other":             Paperclip,
};

const DOC_TYPE_OPTIONS = [
  "Policy Document", "Service Agreement", "Enrollment Form", "Claims Guide", "Other",
];

function DocumentsSection() {
  const [docs, setDocs] = useState(DEFAULT_DOCS);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(null);
  const fileRef = useRef();
  const nextDocId = useRef(docs.length + 1);

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const id = ++nextDocId.current;
      setUploading(file.name);
      setTimeout(() => {
        setDocs(d => [...d, {
          id,
          name: file.name,
          type: "Other",
          size: file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
          date: new Date().toISOString().split("T")[0],
          status: "pending",
        }]);
        setUploading(null);
      }, 900);
    });
  };

  const removeDoc = (id) => setDocs(d => d.filter(doc => doc.id !== id));

  return (
    <SectionCard
      icon={Upload}
      title="Supporting Documents"
      subtitle="Policy documents, SLAs, enrollment forms, and claims guides"
    >
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 mb-4 cursor-pointer transition-all",
          dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg" className="hidden" onChange={e => handleFiles(e.target.files)} />
        <div className={cn("size-12 rounded-2xl flex items-center justify-center transition-colors", dragging ? "bg-primary/15" : "bg-muted")}>
          <Upload size={22} className={dragging ? "text-primary" : "text-muted-foreground"} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{dragging ? "Drop files here" : "Upload documents"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Drag & drop or click · PDF, DOC, DOCX, PNG, JPG · max 20 MB each</p>
        </div>
        {uploading && (
          <div className="absolute inset-0 rounded-2xl bg-background/80 flex items-center justify-center gap-2">
            <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-foreground">Uploading {uploading}…</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {docs.map(doc => {
          const Icon = DOC_ICONS[doc.type] ?? Paperclip;
          return (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/20 transition-colors group">
              <div className="size-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">{doc.type}</span>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="text-[11px] text-muted-foreground">{doc.size}</span>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="text-[11px] text-muted-foreground">{doc.date}</span>
                </div>
              </div>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0",
                doc.status === "verified"
                  ? "bg-success/10 text-success border-success/25"
                  : "bg-warning/10 text-warning border-warning/25",
              )}>
                {doc.status === "verified" ? "Verified" : "Needs review"}
              </span>
              <button type="button" onClick={() => removeDoc(doc.id)} aria-label={`Remove ${doc.name}`} className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Section 4: Batch Duration ────────────────────────────────────────────────

const DEFAULT_BATCH_CFG = {
  durationDays: 15,
  cycleType: "bimonthly",
  firstBatchStart: 1,
  autoReminders: true,
  reminderDaysBefore: 3,
  gracePeriodDays: 2,
  notes: "Two windows per month: 1–15 and 16–end of month. Enrollments close after the grace period.",
};

function BatchDurationSection() {
  const [cfg, setCfg]     = useState(DEFAULT_BATCH_CFG);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cfg);
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setCfg(draft); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const f = key => ({ value: editing ? draft[key] : cfg[key], onChange: v => setDraft(d => ({ ...d, [key]: v })), disabled: !editing });

  return (
    <SectionCard
      icon={Clock}
      title="Enrollment windows"
      subtitle="How long employees have to enroll each period, and when reminders go out"
      action={
        editing ? (
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditing(false); setDraft(cfg); }} className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"><X size={13} /> Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"><Save size={13} /> Save</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {saved && <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 size={13} /> Changes saved</span>}
            <button onClick={() => { setEditing(true); setDraft(cfg); }} className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"><Edit2 size={13} /> Edit</button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Enrollment frequency" required>
            <SelectInput
              value={editing ? draft.cycleType : cfg.cycleType}
              onChange={v => setDraft(d => ({ ...d, cycleType: v }))}
              options={[
                { value: "bimonthly", label: "Twice per month" },
              ]}
            />
          </FormField>
          <FormField label="Window length (days)" hint="How many days each enrollment period stays open">
            <TextInput {...f("durationDays")} type="number" placeholder="15" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First window starts on day" hint="1 = 1st of the month">
            <TextInput {...f("firstBatchStart")} type="number" placeholder="1" />
          </FormField>
          <FormField label="Grace period (days)" hint="Extra days you still accept late enrollments">
            <TextInput {...f("gracePeriodDays")} type="number" placeholder="2" />
          </FormField>
        </div>

        {/* Reminder toggle */}
        <div className="flex items-start justify-between p-4 rounded-xl border border-border bg-muted/20">
          <div>
            <p className="text-xs font-semibold text-foreground">Send email reminders</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Remind employees who haven&apos;t enrolled before the window closes</p>
          </div>
          <button
            type="button"
            disabled={!editing}
            aria-label={(editing ? draft : cfg).autoReminders ? "Turn off email reminders" : "Turn on email reminders"}
            onClick={() => setDraft(d => ({ ...d, autoReminders: !d.autoReminders }))}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full border transition-colors flex-shrink-0 mt-0.5",
              (editing ? draft : cfg).autoReminders ? "bg-primary border-primary" : "bg-muted border-border",
              !editing && "opacity-60 cursor-not-allowed",
            )}
          >
            <span className={cn("inline-block size-3.5 rounded-full bg-white shadow transition-transform", (editing ? draft : cfg).autoReminders ? "translate-x-[18px]" : "translate-x-[2px]")} />
          </button>
        </div>

        {(editing ? draft : cfg).autoReminders && (
          <FormField label="Remind how many days before close?" hint="Employees receive an email this many days before the window closes">
            <TextInput {...f("reminderDaysBefore")} type="number" placeholder="3" />
          </FormField>
        )}

        <FormField label="Internal notes">
          <textarea
            value={editing ? draft.notes : cfg.notes}
            onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
            disabled={!editing}
            rows={2}
            placeholder="Notes for your team (not shown to employees)"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </FormField>
      </div>
    </SectionCard>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InsuranceConfigPage({ onNavigate }) {
  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="insurance-config" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-border" />
            <span className="text-sm text-muted-foreground">Admin</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <button
              onClick={() => onNavigate("insurance-management")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Insurance
            </button>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">Configuration</span>
          </div>
        </AppHeader>

        <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col px-6 pt-5 pb-10">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onNavigate?.("insurance-management")}
                  className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={13} />
                  Back to dashboard
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">Insurance setup</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/25">Open enrollment · 2026</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">Set your insurer, age-based premiums, documents, and enrollment windows</p>
              </div>
            </div>

            {/* Config sections */}
            <div className="space-y-5">
              <InsurerSection />
              <PremiumSlabsSection />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start [&>*]:min-w-0">
                <DocumentsSection />
                <BatchDurationSection />
              </div>
              <DefaultCoverageSection />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
