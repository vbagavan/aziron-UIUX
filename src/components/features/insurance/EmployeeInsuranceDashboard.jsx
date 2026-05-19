import { useState } from "react";
import {
  Shield, ShieldCheck, CheckCircle2, Clock, Heart, Eye, Smile, Activity,
  Download, FileText, PhoneCall, Mail, MessageCircle, ChevronRight,
  Users, Calendar, Building2, CreditCard, AlertTriangle, Share2,
  ExternalLink, Headphones, Sparkles, TrendingUp, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatEnrollmentPremiumInr } from "@/components/features/insurance/enrollmentPreviewUtils";

const BENEFIT_CARDS = [
  { icon: Heart, label: "Medical", desc: "Hospitalisation & OPD", color: "text-destructive", bg: "bg-destructive/10" },
  { icon: Smile, label: "Dental", desc: "Preventive & restorative", color: "text-warning", bg: "bg-warning/10" },
  { icon: Eye, label: "Vision", desc: "Exams & eyewear", color: "text-info", bg: "bg-info/10" },
  { icon: Activity, label: "Life cover", desc: "Up to ₹50L family", color: "text-success", bg: "bg-success/10" },
];

const POLICY_DOCS = [
  { id: "schedule", label: "Policy schedule", description: "Full terms, benefits, and exclusions", updated: "12 May 2026", type: "PDF" },
  { id: "member-card", label: "Member ID card", description: "Cashless access at network hospitals", updated: "12 May 2026", type: "Card" },
  { id: "premium-receipt", label: "Premium receipt (80D)", description: "Tax filing documentation", updated: "10 May 2026", type: "PDF" },
];

const PORTAL_LINKS = [
  {
    id: "health-insurance",
    label: "Health Insurance",
    description: "View claims, ID cards, and cashless hospital network",
    href: "https://www.starhealth.in/customer-portal",
    icon: Heart,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    badge: "Insurer portal",
  },
];

function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function InfoTile({ label, value, className, onCopy, copied }) {
  return (
    <Card className={cn("border-border/80 shadow-sm transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="mt-1.5 flex w-full items-center gap-1.5 rounded-sm text-left text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="truncate">{value}</span>
            {copied ? <CheckCircle2 size={14} className="shrink-0 text-success" /> : <FileText size={14} className="shrink-0 text-muted-foreground" />}
          </button>
        ) : (
          <p className="mt-1.5 text-sm font-semibold text-foreground leading-snug">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function InsuranceDashboardHero({
  firstName,
  isApproved,
  statusMeta,
  sumInsured,
  annualPremium,
  coverageLabel,
  memberCount,
  policyDetails,
  policyName,
  insurerName,
  utilizationPct,
  remainingLabel,
  refId,
  onOpenAssistant,
}) {
  const annualPremiumLabel =
    annualPremium != null ? `${formatEnrollmentPremiumInr(annualPremium)}/yr` : "—";
  return (
    <div className="-mx-1 px-1 pb-2">
      <div
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--card) 92%, var(--primary) 8%) 0%, var(--card) 45%, color-mix(in srgb, var(--card) 95%, var(--success) 5%) 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent)]" />
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("gap-1.5 font-semibold", statusMeta.badge)}>
                    {isApproved && <span className="size-1.5 rounded-full bg-success motion-safe-pulse" aria-hidden />}
                    {statusMeta.label}
                  </Badge>
                  {isApproved && (
                    <Badge variant="secondary" className="gap-1 text-muted-foreground">
                      <ShieldCheck size={12} className="text-success" aria-hidden />
                      You&apos;re protected
                    </Badge>
                  )}
                </div>
                {isApproved && (
                  <a
                    href={PORTAL_LINKS[0].href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    Insurer portal
                    <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" aria-hidden />
                    <span className="sr-only">Opens in a new tab</span>
                  </a>
                )}
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                {isApproved ? `Hi ${firstName}, your corporate health cover is active.` : `Thanks ${firstName}, we've received your enrollment.`}
              </p>

              <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Annual premium</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{annualPremiumLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Sum insured</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{sumInsured}</p>
                </div>
                <div className="pb-1">
                  <p className="text-xs font-medium text-muted-foreground">Plan</p>
                  <p className="text-sm font-semibold text-foreground">{coverageLabel}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-background/60 px-3 py-2.5 ring-1 ring-border/50">
                  <p className="text-[11px] text-muted-foreground">Provider</p>
                  <p className="mt-0.5 text-xs font-semibold text-foreground line-clamp-2">{isApproved ? insurerName : policyName}</p>
                </div>
                <div className="rounded-lg bg-background/60 px-3 py-2.5 ring-1 ring-border/50">
                  <p className="text-[11px] text-muted-foreground">Validity</p>
                  <p className="mt-0.5 text-xs font-semibold text-foreground">
                    {isApproved
                      ? `${policyDetails.effectiveLabel} – ${policyDetails.expiryLabel}`
                      : "Activates after approval"}
                  </p>
                </div>
                <div className="rounded-lg bg-background/60 px-3 py-2.5 ring-1 ring-border/50">
                  <p className="text-[11px] text-muted-foreground">Members covered</p>
                  <p className="mt-0.5 text-xs font-semibold text-foreground">{memberCount} insured</p>
                </div>
              </div>

              {isApproved && (
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Coverage utilisation</span>
                    <span className="font-semibold text-foreground">{utilizationPct}% used · {remainingLabel} remaining</span>
                  </div>
                  <Progress className="mt-2" value={utilizationPct} aria-label="Coverage utilisation" />
                </div>
              )}
            </div>

          </div>

          {!isApproved && refId && (
            <p className="mt-4 text-xs text-muted-foreground">
              Reference <span className="font-mono font-semibold text-foreground">{refId}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PolicyOverviewGrid({ tiles }) {
  return (
    <section>
      <SectionHeader title="Policy overview" description="Key identifiers and plan details at a glance." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <InfoTile key={tile.label} {...tile} />
        ))}
      </div>
    </section>
  );
}

function CoverageBenefitsSection({ annualPremium, renewalLabel }) {
  return (
    <section>
      <SectionHeader
        title="Coverage & benefits"
        description="What's included in your HealthFirst Plus plan."
        action={
          <Badge variant="outline" className="gap-1.5 border-success/30 bg-success/10 text-success">
            <TrendingUp size={12} />
            Renews {renewalLabel}
          </Badge>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFIT_CARDS.map(({ icon: Icon, label, desc, color, bg }) => (
          <div
            key={label}
            className="group rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
          >
            <div className={cn("flex size-10 items-center justify-center rounded-xl", bg)}>
              <Icon size={18} className={color} />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{desc}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-success">
              <CheckCircle2 size={11} />
              Active
            </p>
          </div>
        ))}
      </div>
      {annualPremium != null && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Your annual premium</span>
          <span className="font-semibold text-foreground">{formatEnrollmentPremiumInr(annualPremium)}/year</span>
        </div>
      )}
    </section>
  );
}

function InsuredMembersSection({ members }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section>
      <SectionHeader title="Insured members" description="Everyone covered under this policy." />
      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => {
          const initials = m.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
          const open = expandedId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              aria-expanded={open}
              onClick={() => setExpandedId(open ? null : m.id)}
              className={cn(
                "rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                open ? "border-primary/40 ring-2 ring-primary/10" : "border-border/80",
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="size-11 ring-2 ring-background">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.relation}</p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                    <CheckCircle2 size={10} />
                    Covered
                  </span>
                </div>
                <ChevronRight size={16} className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
              </div>
              {open && (
                <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Date of birth:</span> {m.dob || "—"}</p>
                  {m.gender && <p><span className="font-medium text-foreground">Gender:</span> {m.gender}</p>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function QuickAccessPortalsSection() {
  return (
    <section>
      <SectionHeader
        title="Quick access"
        description="Jump straight to the portals you use most for benefits, claims, and wellness."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PORTAL_LINKS.map(({ id, label, description, href, icon: Icon, iconColor, iconBg, badge }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="flex items-start justify-between gap-2">
              <span className={cn("flex size-10 items-center justify-center rounded-xl", iconBg)}>
                <Icon size={18} className={iconColor} aria-hidden />
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {badge}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
                <ExternalLink size={12} className="text-muted-foreground group-hover:text-primary transition-colors" aria-hidden />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            </div>
            <span className="sr-only">Opens in a new tab</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function PolicyDocumentsSection() {
  return (
    <section>
      <SectionHeader title="Policy documents" description="Download or share your insurance documents." />
      <div className="space-y-3">
        {POLICY_DOCS.map((doc) => (
          <div
            key={doc.id}
            className="group flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{doc.label}</p>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{doc.type}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{doc.description}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Updated {doc.updated}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {[
                { icon: ExternalLink, label: "Preview" },
                { icon: Download, label: "Download" },
                { icon: Share2, label: "Share" },
              ].map(({ icon: Icon, label }) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => window.alert(`${label} for "${doc.label}" — connect insurer API to enable.`)}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SupportExperienceSection({ onOpenAssistant }) {
  return (
    <section>
      <SectionHeader title="Claims & support" description="We're here when you need help with claims or coverage questions." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <Building2 size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">HR Benefits</p>
              <p className="text-xs text-muted-foreground">Priya Nair · HR Benefits Specialist</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <a href="mailto:hr-benefits@aziron.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Mail size={14} />
              hr-benefits@aziron.com
            </a>
            <p className="flex items-center gap-2 text-muted-foreground">
              <PhoneCall size={14} />
              +91 98765 43210
            </p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={12} />
              Mon–Fri, 9 AM – 6 PM IST
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="tel:+919876543210" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Call HR
            </a>
            <a href="mailto:hr-benefits@aziron.com" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Email HR
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-primary/5 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-info/10">
              <Headphones size={20} className="text-info" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Claims helpdesk</p>
              <p className="text-xs text-muted-foreground">24/7 cashless & reimbursement support</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <a href="tel:18002667766" className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
              <PhoneCall size={14} />
              1800-266-7766
            </a>
            <a href="mailto:claims@healthfirst.in" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Mail size={14} />
              claims@healthfirst.in
            </a>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={onOpenAssistant} className="gap-1.5">
              <MessageCircle size={14} />
              Chat support
            </Button>
            <a href="tel:18002667766" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Call helpdesk
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function PolicyTimelineSection({ steps }) {
  return (
    <section>
      <SectionHeader title="What happens next" description="Track your enrollment through activation." />
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <ol className="space-y-0">
          {steps.map((step, i) => (
            <li key={step.id ?? i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    step.done
                      ? "bg-success text-white"
                      : step.active
                        ? "bg-warning/15 text-warning ring-2 ring-warning/40"
                        : cn(step.iconBg, step.iconColor),
                  )}
                >
                  {step.icon ?? (step.done ? <CheckCircle2 size={18} /> : <span className="text-xs font-bold">{i + 1}</span>)}
                </div>
                {i < steps.length - 1 && <div className="my-1.5 w-px min-h-8 flex-1 bg-border" aria-hidden />}
              </div>
              <div className={cn("min-w-0 flex-1", i < steps.length - 1 ? "pb-6" : "")}>
                <p className={cn("text-sm font-semibold", step.done ? "text-success" : step.active ? "text-warning" : "text-foreground")}>
                  {step.label}
                </p>
                {step.date && (
                  <p className={cn("mt-0.5 text-xs leading-snug", step.dateColor ?? "text-muted-foreground")}>{step.date}</p>
                )}
                {step.desc && <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{step.desc}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function EmployeeInsuranceDashboard({
  firstName,
  isApproved,
  workflowStatus,
  statusMeta,
  policyDetails,
  policyName,
  refId,
  sumInsured,
  coverageLabel,
  annualPremium,
  insuredMembers,
  steps,
  overviewTiles,
  utilizationPct = 12,
  remainingLabel = "₹4,40,000",
  renewalLabel = "May 2027",
  pendingClarification = false,
  onOpenAssistant,
  previewToggle,
}) {
  const [copiedPolicy, setCopiedPolicy] = useState(false);
  const memberCount = insuredMembers.length;

  const overviewWithCopy = overviewTiles.map((t) =>
    t.copy
      ? {
          ...t,
          onCopy: () => {
            navigator.clipboard.writeText(t.value);
            setCopiedPolicy(true);
            setTimeout(() => setCopiedPolicy(false), 2000);
          },
          copied: copiedPolicy,
        }
      : t,
  );

  return (
    <div className="space-y-8 pb-6">
      <InsuranceDashboardHero
        firstName={firstName}
        isApproved={isApproved}
        statusMeta={statusMeta}
        sumInsured={sumInsured}
        annualPremium={annualPremium}
        coverageLabel={coverageLabel}
        memberCount={memberCount}
        policyDetails={policyDetails}
        policyName={policyName}
        insurerName={policyDetails.insurerName}
        utilizationPct={utilizationPct}
        remainingLabel={remainingLabel}
        refId={refId}
        onOpenAssistant={onOpenAssistant}
      />

      {pendingClarification && (
        <Alert className="flex gap-3 border-warning/30 bg-warning/5 shadow-sm [&>svg]:static [&>svg]:mt-0.5" role="status">
          <AlertTriangle size={20} className="shrink-0 text-warning" />
          <div className="min-w-0 pl-0">
            <AlertTitle>Clarification needed</AlertTitle>
            <AlertDescription>
              HR has requested more information. Use the assistant or contact HR with your reference ID.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <PolicyOverviewGrid tiles={overviewWithCopy} />

      <InsuredMembersSection members={insuredMembers} />

      {previewToggle}
    </div>
  );
}
