// ─── SaaS tier definitions (from Commercial Plan v2.4) ─────────────────────
export const SAAS_TIERS = {
  lite: {
    id: "lite", label: "Lite", pricePerSeat: 15, seatRange: "Up to 100 users",
    tokenRatePerM: 5.00,
    limits: { agents: 5, workflows: 2, concurrentFlows: 5, flowExecPerMonth: 5000, knowledgeHubGB: 5 },
    support: "Email", uptime: "99.9%", auditLogs: false, hipaa: false, dedicatedInfra: false, sso: true,
  },
  growth: {
    id: "growth", label: "Growth", pricePerSeat: 12, seatRange: "101–500 users",
    tokenRatePerM: 3.00,
    limits: { agents: 10, workflows: 10, concurrentFlows: 20, flowExecPerMonth: 50000, knowledgeHubGB: 50 },
    support: "Priority", uptime: "99.9%", auditLogs: true, hipaa: false, dedicatedInfra: false, sso: true,
  },
  scale: {
    id: "scale", label: "Scale", pricePerSeat: 10, seatRange: "500+ users",
    tokenRatePerM: 2.00,
    limits: { agents: 50, workflows: 50, concurrentFlows: 100, flowExecPerMonth: null, knowledgeHubGB: 500 },
    support: "Dedicated", uptime: "99.9%", auditLogs: true, hipaa: true, dedicatedInfra: true, sso: true,
  },
};

// ─── Tenant list ─────────────────────────────────────────────────────────────
export const TENANTS = [
  {
    id: 1, name: "Meridian Financial", slug: "meridian-financial", domain: "meridian.io",
    deployment: "saas", tier: "scale", plan: "enterprise", seats: 620, max_users: 620, status: "active",
    industry: "Finance", contactName: "Sarah Chen", contactEmail: "s.chen@meridian.io",
    createdAt: "2024-03-15", overrides: {}, settings: {},
    subscriptionRenewalDate: "2026-12-01",
    billingProfile: {
      billingEmail: "accounts-payable@meridian.io",
      legalEntity: "Meridian Financial Group Ltd",
      taxId: "GB 284 719 402",
      purchaseOrder: "PO-MER-2025-0042",
      lastPaymentStatus: "Paid",
      lastPaymentDate: "2026-04-01",
      financeHelpUrl: "mailto:finance@aziron.com?subject=Meridian%20billing",
    },
    usage: { tokensConsumed: 1840, seatsUsed: 607, flowExecutions: 84200, storageGB: 312,
      memberCount: 607, agentCount: 42, workflowCount: 18, vectorDbCount: 6, providerCount: 3,
      trend: [820, 940, 1100, 1280, 1560, 1840] },
  },
  {
    id: 2, name: "Nexus Health Systems", slug: "nexus-health", domain: "nexushealth.com",
    deployment: "saas", tier: "scale", plan: "enterprise", seats: 350, max_users: null, status: "active",
    industry: "Healthcare", contactName: "Dr. James Ruiz", contactEmail: "j.ruiz@nexushealth.com",
    createdAt: "2024-01-08", subscriptionRenewalDate: "2026-08-01", overrides: {}, settings: {},
    usage: { tokensConsumed: 3100, seatsUsed: null, flowExecutions: 198000, storageGB: null,
      memberCount: 312, agentCount: 89, workflowCount: 34, vectorDbCount: 12, providerCount: 4,
      trend: [1400, 1800, 2100, 2500, 2800, 3100] },
  },
  {
    id: 3, name: "Vanta Logistics", slug: "vanta-logistics", domain: "vantalog.co",
    deployment: "saas", tier: "growth", plan: "professional", seats: 245, max_users: 500, status: "active",
    industry: "Logistics", contactName: "Mark Obasi", contactEmail: "m.obasi@vantalog.co",
    createdAt: "2024-06-22", overrides: { agents: 15 }, settings: {},
    usage: { tokensConsumed: 520, seatsUsed: 237, flowExecutions: 32100, storageGB: 28,
      memberCount: 237, agentCount: 15, workflowCount: 9, vectorDbCount: 3, providerCount: 2,
      trend: [180, 240, 310, 390, 450, 520] },
  },
  {
    id: 4, name: "Orion EdTech", slug: "orion-edtech", domain: "orionlearn.com",
    deployment: "saas", tier: "lite", plan: "standard", seats: 88, max_users: 100, status: "active",
    industry: "Education", contactName: "Priya Patel", contactEmail: "p.patel@orionlearn.com",
    createdAt: "2024-09-10", overrides: {}, settings: {},
    usage: { tokensConsumed: 180, seatsUsed: 71, flowExecutions: 3800, storageGB: 3.2,
      memberCount: 71, agentCount: 4, workflowCount: 2, vectorDbCount: 1, providerCount: 1,
      trend: [40, 70, 95, 120, 150, 180] },
  },
  {
    id: 5, name: "Apex Manufacturing", slug: "apex-manufacturing", domain: "apexmfg.com",
    deployment: "saas", tier: "growth", plan: "professional", seats: 200, max_users: 500, status: "active",
    industry: "Manufacturing", contactName: "Tom Hargreaves", contactEmail: "t.hargreaves@apexmfg.com",
    createdAt: "2024-05-30", subscriptionRenewalDate: "2026-09-01", overrides: {}, settings: {},
    usage: { tokensConsumed: 1650, seatsUsed: null, flowExecutions: 187000, storageGB: null,
      memberCount: 198, agentCount: 23, workflowCount: 11, vectorDbCount: 5, providerCount: 2,
      trend: [700, 900, 1100, 1280, 1450, 1650] },
  },
  {
    id: 6, name: "Brightline Retail", slug: "brightline-retail", domain: "brightlineretail.com",
    deployment: "saas", tier: "growth", plan: "professional", seats: 182, max_users: 250, status: "active",
    industry: "Retail", contactName: "Lisa Monroe", contactEmail: "l.monroe@brightlineretail.com",
    createdAt: "2024-07-14", overrides: { flowExecPerMonth: 80000 }, settings: {},
    usage: { tokensConsumed: 390, seatsUsed: 175, flowExecutions: 61200, storageGB: 22,
      memberCount: 175, agentCount: 10, workflowCount: 7, vectorDbCount: 2, providerCount: 2,
      trend: [90, 140, 200, 270, 330, 390] },
  },
  {
    id: 7, name: "Strategos Consulting", slug: "strategos", domain: "strategos.io",
    deployment: "saas", tier: "lite", plan: "trial", seats: 42, max_users: 50, status: "trial",
    industry: "Consulting", contactName: "David Ng", contactEmail: "d.ng@strategos.io",
    createdAt: "2025-03-01", trialEndsAt: "2026-06-01", overrides: {}, settings: {},
    usage: { tokensConsumed: 62, seatsUsed: 38, flowExecutions: 1100, storageGB: 0.8,
      memberCount: 38, agentCount: 3, workflowCount: 1, vectorDbCount: 1, providerCount: 1,
      trend: [0, 0, 8, 18, 38, 62] },
  },
  {
    id: 8, name: "Cobalt Insurance", slug: "cobalt-insurance", domain: "cobaltins.com",
    deployment: "saas", tier: "scale", plan: "enterprise", seats: 510, max_users: null, status: "active",
    industry: "Insurance", contactName: "Rachel Torres", contactEmail: "r.torres@cobaltins.com",
    createdAt: "2023-11-20", overrides: { knowledgeHubGB: 800 }, settings: { hipaa: true },
    usage: { tokensConsumed: 2250, seatsUsed: 498, flowExecutions: null, storageGB: 445,
      memberCount: 498, agentCount: 51, workflowCount: 22, vectorDbCount: 9, providerCount: 4,
      trend: [1100, 1400, 1700, 1900, 2100, 2250] },
  },
  {
    id: 9, name: "Zenith Pharma", slug: "zenith-pharma", domain: "zenithpharma.com",
    deployment: "saas", tier: "lite", plan: "standard", seats: 150, max_users: 250, status: "active",
    industry: "Pharma", contactName: "Yuki Tanaka", contactEmail: "y.tanaka@zenithpharma.com",
    createdAt: "2024-10-05", subscriptionRenewalDate: "2026-03-01", overrides: {}, settings: {},
    usage: { tokensConsumed: 850, seatsUsed: null, flowExecutions: 41000, storageGB: null,
      memberCount: 145, agentCount: 8, workflowCount: 4, vectorDbCount: 2, providerCount: 1,
      trend: [200, 350, 480, 610, 730, 850] },
  },
  {
    id: 10, name: "Pulsar Media", slug: "pulsar-media", domain: "pulsarmedia.tv",
    deployment: "saas", tier: "growth", plan: "professional", seats: 130, max_users: 150, status: "suspended",
    industry: "Media", contactName: "Chris Blake", contactEmail: "c.blake@pulsarmedia.tv",
    createdAt: "2024-04-18", overrides: {}, settings: {},
    usage: { tokensConsumed: 0, seatsUsed: 0, flowExecutions: 0, storageGB: 18,
      memberCount: 0, agentCount: 7, workflowCount: 3, vectorDbCount: 1, providerCount: 1,
      trend: [280, 310, 320, 290, 145, 0] },
  },
];

// ─── Invoice history ─────────────────────────────────────────────────────────
export const INVOICES = [
  { id: "INV-2025-0401", tenantId: 1, amount: 9880, status: "paid",    period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "620 seats × $10.00", amount: 6200 }, { label: "Platform tokens (1,840M)", amount: 3680 }] },
  { id: "INV-2025-0301", tenantId: 1, amount: 9040, status: "paid",    period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "620 seats × $10.00", amount: 6200 }, { label: "Platform tokens (1,420M)", amount: 2840 }] },
  { id: "INV-2025-0201", tenantId: 1, amount: 8600, status: "paid",    period: "Feb 2025", issuedAt: "2025-02-01", items: [{ label: "620 seats × $10.00", amount: 6200 }, { label: "Platform tokens (1,200M)", amount: 2400 }] },
  { id: "INV-2025-0101", tenantId: 1, amount: 8100, status: "paid",    period: "Jan 2025", issuedAt: "2025-01-01", items: [{ label: "610 seats × $10.00", amount: 6100 }, { label: "Platform tokens (1,000M)", amount: 2000 }] },
  { id: "INV-2024-1201", tenantId: 1, amount: 7800, status: "paid",    period: "Dec 2024", issuedAt: "2024-12-01", items: [{ label: "600 seats × $10.00", amount: 6000 }, { label: "Platform tokens (900M)", amount: 1800 }] },
  { id: "INV-2024-1101", tenantId: 1, amount: 7640, status: "paid",    period: "Nov 2024", issuedAt: "2024-11-01", items: [{ label: "600 seats × $10.00", amount: 6000 }, { label: "Platform tokens (820M)", amount: 1640 }] },

  { id: "INV-2025-0402", tenantId: 2, amount: 11200, status: "paid",   period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "350 seats × $10.00", amount: 3500 }, { label: "Platform tokens (3,100M)", amount: 7700 }] },
  { id: "INV-2025-0302", tenantId: 2, amount: 10800, status: "paid",   period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "350 seats × $10.00", amount: 3500 }, { label: "Platform tokens (2,800M)", amount: 7300 }] },
  { id: "INV-2025-0202", tenantId: 2, amount: 10400, status: "paid",   period: "Feb 2025", issuedAt: "2025-02-01", items: [{ label: "350 seats × $10.00", amount: 3500 }, { label: "Platform tokens (2,500M)", amount: 6900 }] },
  { id: "INV-2025-0102", tenantId: 2, amount: 10000, status: "paid",   period: "Jan 2025", issuedAt: "2025-01-01", items: [{ label: "350 seats × $10.00", amount: 3500 }, { label: "Platform tokens (2,100M)", amount: 6500 }] },

  { id: "INV-2025-0403", tenantId: 3, amount: 4500, status: "paid",    period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "245 seats × $12.00", amount: 2940 }, { label: "Platform tokens (520M)", amount: 1560 }] },
  { id: "INV-2025-0303", tenantId: 3, amount: 4230, status: "paid",    period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "245 seats × $12.00", amount: 2940 }, { label: "Platform tokens (430M)", amount: 1290 }] },
  { id: "INV-2025-0203", tenantId: 3, amount: 3888, status: "paid",    period: "Feb 2025", issuedAt: "2025-02-01", items: [{ label: "240 seats × $12.00", amount: 2880 }, { label: "Platform tokens (336M)", amount: 1008 }] },
  { id: "INV-2025-0103", tenantId: 3, amount: 3600, status: "paid",    period: "Jan 2025", issuedAt: "2025-01-01", items: [{ label: "235 seats × $12.00", amount: 2820 }, { label: "Platform tokens (260M)", amount: 780 }] },

  { id: "INV-2025-0404", tenantId: 4, amount: 2220, status: "paid",    period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "88 seats × $15.00", amount: 1320 }, { label: "Platform tokens (180M)", amount: 900 }] },
  { id: "INV-2025-0304", tenantId: 4, amount: 2070, status: "paid",    period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "88 seats × $15.00", amount: 1320 }, { label: "Platform tokens (150M)", amount: 750 }] },

  { id: "INV-2025-0405", tenantId: 5, amount: 7350, status: "paid",   period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "200 seats × $12.00", amount: 2400 }, { label: "Platform tokens (1,650M)", amount: 4950 }] },
  { id: "INV-2025-0305", tenantId: 5, amount: 7100, status: "paid",   period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "200 seats × $12.00", amount: 2400 }, { label: "Platform tokens (1,450M)", amount: 4700 }] },

  { id: "INV-2025-0406", tenantId: 6, amount: 3354, status: "overdue", period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "182 seats × $12.00", amount: 2184 }, { label: "Platform tokens (390M)", amount: 1170 }] },
  { id: "INV-2025-0306", tenantId: 6, amount: 3144, status: "paid",    period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "182 seats × $12.00", amount: 2184 }, { label: "Platform tokens (320M)", amount: 960 }] },

  { id: "INV-2025-0407", tenantId: 8, amount: 9600, status: "paid",    period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "510 seats × $10.00", amount: 5100 }, { label: "Platform tokens (2,250M)", amount: 4500 }] },
  { id: "INV-2025-0307", tenantId: 8, amount: 9300, status: "paid",    period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "510 seats × $10.00", amount: 5100 }, { label: "Platform tokens (2,100M)", amount: 4200 }] },

  { id: "INV-2025-0408", tenantId: 9, amount: 6500, status: "paid",   period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "150 seats × $15.00", amount: 2250 }, { label: "Platform tokens (850M)", amount: 4250 }] },
  { id: "INV-2025-0308", tenantId: 9, amount: 6200, status: "paid",   period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "150 seats × $15.00", amount: 2250 }, { label: "Platform tokens (730M)", amount: 3950 }] },

  { id: "INV-2025-0409", tenantId: 10, amount: 2316, status: "overdue", period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "130 seats × $12.00", amount: 1560 }, { label: "Platform tokens (252M)", amount: 756 }] },
];

// ─── Per-user usage breakdown ────────────────────────────────────────────────
export const TENANT_USER_USAGE = {
  1: [
    { name: "Sarah Chen",    email: "s.chen@meridian.io",   tokensM: 42, flows: 1820, role: "Admin"  },
    { name: "Raj Patel",     email: "r.patel@meridian.io",  tokensM: 38, flows: 1540, role: "Member" },
    { name: "Lisa Wong",     email: "l.wong@meridian.io",   tokensM: 31, flows: 1290, role: "Member" },
    { name: "Marcus Brown",  email: "m.brown@meridian.io",  tokensM: 28, flows: 1040, role: "Member" },
    { name: "Anya Novak",    email: "a.novak@meridian.io",  tokensM: 24, flows: 890,  role: "Member" },
  ],
  3: [
    { name: "Mark Obasi",    email: "m.obasi@vantalog.co",  tokensM: 8,  flows: 420,  role: "Admin"  },
    { name: "Claire Walsh",  email: "c.walsh@vantalog.co",  tokensM: 6,  flows: 310,  role: "Member" },
    { name: "Tom Reeves",    email: "t.reeves@vantalog.co", tokensM: 5,  flows: 280,  role: "Member" },
    { name: "Nina Park",     email: "n.park@vantalog.co",   tokensM: 4,  flows: 240,  role: "Member" },
    { name: "Sam Diallo",    email: "s.diallo@vantalog.co", tokensM: 3,  flows: 195,  role: "Member" },
  ],
  8: [
    { name: "Rachel Torres", email: "r.torres@cobaltins.com",tokensM: 55, flows: 3200, role: "Admin" },
    { name: "Greg Palmer",   email: "g.palmer@cobaltins.com",tokensM: 48, flows: 2900, role: "Member"},
    { name: "Mia Johansson", email: "m.johansson@cobaltins.com",tokensM: 42, flows: 2600, role: "Member"},
    { name: "Oscar Leung",   email: "o.leung@cobaltins.com",tokensM: 36, flows: 2100, role: "Member"},
    { name: "Dana Hill",     email: "d.hill@cobaltins.com", tokensM: 30, flows: 1800, role: "Member"},
  ],
};

// ─── Per-tenant user roster ──────────────────────────────────────────────────
export const TENANT_USERS = {
  1: [
    { id:1, name:"Sarah Chen",       email:"s.chen@meridian.io",      role:"Admin",  status:"Active",   lastActive:"Today, 9:24 AM",     mfa:true  },
    { id:2, name:"Raj Patel",        email:"r.patel@meridian.io",     role:"Editor", status:"Active",   lastActive:"Today, 8:45 AM",     mfa:true  },
    { id:3, name:"Lisa Wong",        email:"l.wong@meridian.io",      role:"Editor", status:"Active",   lastActive:"Yesterday, 4:12 PM", mfa:false },
    { id:4, name:"Marcus Brown",     email:"m.brown@meridian.io",     role:"Viewer", status:"Active",   lastActive:"2 days ago",         mfa:false },
    { id:5, name:"Anya Novak",       email:"a.novak@meridian.io",     role:"Editor", status:"Active",   lastActive:"3 days ago",         mfa:true  },
    { id:6, name:"Kevin Shah",       email:"k.shah@meridian.io",      role:"Editor", status:"Invited",  lastActive:"—",                  mfa:false },
    { id:7, name:"Priya Lal",        email:"p.lal@meridian.io",       role:"Editor", status:"Inactive", lastActive:"15 days ago",        mfa:false },
  ],
  3: [
    { id:1,  name:"Mark Obasi",      email:"m.obasi@vantalog.co",     role:"Admin",  status:"Active",   lastActive:"Today, 10:01 AM",    mfa:true  },
    { id:2,  name:"Priya Singh",     email:"p.singh@vantalog.co",     role:"Admin",  status:"Active",   lastActive:"Today, 7:30 AM",     mfa:true  },
    { id:3,  name:"Claire Walsh",    email:"c.walsh@vantalog.co",     role:"Editor", status:"Active",   lastActive:"Today, 9:33 AM",     mfa:true  },
    { id:4,  name:"Tom Reeves",      email:"t.reeves@vantalog.co",    role:"Editor", status:"Active",   lastActive:"Today, 8:55 AM",     mfa:false },
    { id:5,  name:"Nina Park",       email:"n.park@vantalog.co",      role:"Viewer", status:"Active",   lastActive:"Yesterday, 6:20 PM", mfa:true  },
    { id:6,  name:"Sam Diallo",      email:"s.diallo@vantalog.co",    role:"Editor", status:"Active",   lastActive:"Yesterday, 2:40 PM", mfa:false },
    { id:7,  name:"Amara Osei",      email:"a.osei@vantalog.co",      role:"Editor", status:"Active",   lastActive:"2 days ago",         mfa:true  },
    { id:8,  name:"Liam Chen",       email:"l.chen@vantalog.co",      role:"Viewer", status:"Active",   lastActive:"2 days ago",         mfa:false },
    { id:9,  name:"Fatima Al-Rashid",email:"f.alrashid@vantalog.co",  role:"Editor", status:"Active",   lastActive:"3 days ago",         mfa:true  },
    { id:10, name:"Jacob Okonkwo",   email:"j.okonkwo@vantalog.co",   role:"Editor", status:"Invited",  lastActive:"—",                  mfa:false },
    { id:11, name:"Yara Hassan",     email:"y.hassan@vantalog.co",    role:"Editor", status:"Invited",  lastActive:"—",                  mfa:false },
    { id:12, name:"Derek Mills",     email:"d.mills@vantalog.co",     role:"Editor", status:"Inactive", lastActive:"18 days ago",        mfa:false },
  ],
  4: [
    { id:1, name:"Priya Patel",      email:"p.patel@orionlearn.com",  role:"Admin",  status:"Active",   lastActive:"Today, 11:00 AM",    mfa:true  },
    { id:2, name:"James Obi",        email:"j.obi@orionlearn.com",    role:"Editor", status:"Active",   lastActive:"Today, 10:20 AM",    mfa:true  },
    { id:3, name:"Soo-Yeon Kim",     email:"s.kim@orionlearn.com",    role:"Editor", status:"Active",   lastActive:"Yesterday",          mfa:false },
    { id:4, name:"Aaron Vasquez",    email:"a.vasquez@orionlearn.com",role:"Editor", status:"Invited",  lastActive:"—",                  mfa:false },
    { id:5, name:"Marie Dupont",     email:"m.dupont@orionlearn.com", role:"Editor", status:"Inactive", lastActive:"21 days ago",        mfa:false },
  ],
  5: [
    { id:1, name:"Tom Hargreaves", email:"t.hargreaves@apexmfg.com", role:"Admin",  status:"Active",   lastActive:"Today, 9:18 AM",    mfa:true  },
    { id:2, name:"Jamie Porter",   email:"j.porter@apexmfg.com",     role:"Editor", status:"Active",   lastActive:"Yesterday, 3:40 PM",mfa:false },
    { id:3, name:"Kim Adeyemi",    email:"k.adeyemi@apexmfg.com",    role:"Viewer", status:"Invited",  lastActive:"—",                 mfa:false },
  ],
  6: [
    { id:1, name:"Lisa Monroe",      email:"l.monroe@brightlineretail.com",role:"Admin",  status:"Active",   lastActive:"Today, 9:05 AM",  mfa:true  },
    { id:2, name:"Brian Watts",      email:"b.watts@brightlineretail.com", role:"Editor", status:"Active",   lastActive:"Today, 8:30 AM",  mfa:true  },
    { id:3, name:"Chloe Martin",     email:"c.martin@brightlineretail.com",role:"Editor", status:"Active",   lastActive:"Yesterday",       mfa:false },
    { id:4, name:"Dev Kapoor",       email:"d.kapoor@brightlineretail.com",role:"Editor", status:"Invited",  lastActive:"—",               mfa:false },
  ],
  7: [
    { id:1, name:"David Ng",         email:"d.ng@strategos.io",       role:"Admin",  status:"Active",   lastActive:"Today, 8:00 AM",     mfa:true  },
    { id:2, name:"Elena Ross",       email:"e.ross@strategos.io",     role:"Editor", status:"Active",   lastActive:"Yesterday",          mfa:true  },
    { id:3, name:"Paulo Ferreira",   email:"p.ferreira@strategos.io", role:"Editor", status:"Invited",  lastActive:"—",                  mfa:false },
  ],
  8: [
    { id:1, name:"Rachel Torres",    email:"r.torres@cobaltins.com",  role:"Admin",  status:"Active",   lastActive:"Today, 10:15 AM",    mfa:true  },
    { id:2, name:"Greg Palmer",      email:"g.palmer@cobaltins.com",  role:"Editor", status:"Active",   lastActive:"Today, 9:00 AM",     mfa:true  },
    { id:3, name:"Mia Johansson",    email:"m.johansson@cobaltins.com",role:"Editor",status:"Active",   lastActive:"Yesterday, 5:30 PM", mfa:false },
    { id:4, name:"Oscar Leung",      email:"o.leung@cobaltins.com",   role:"Viewer", status:"Active",   lastActive:"2 days ago",         mfa:true  },
    { id:5, name:"Dana Hill",        email:"d.hill@cobaltins.com",    role:"Editor", status:"Inactive", lastActive:"10 days ago",        mfa:false },
    { id:6, name:"Felix Nguyen",     email:"f.nguyen@cobaltins.com",  role:"Editor", status:"Invited",  lastActive:"—",                  mfa:false },
  ],
};

// ─── Trend month labels (last 6 months) ─────────────────────────────────────
export const TREND_MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function getTierDef(tenant) {
  if (!tenant) return null;
  return SAAS_TIERS[tenant.tier];
}

export function getLimits(tenant) {
  const tierDef = getTierDef(tenant);
  if (!tierDef) return {};
  return { ...tierDef.limits, ...tenant.overrides };
}

export function computeMRR(tenant) {
  if (!tenant || tenant.status === "suspended" || tenant.status === "churned") return 0;
  const tierDef = SAAS_TIERS[tenant.tier];
  if (!tierDef) return 0;
  const seatFee  = (tenant.seats ?? 0) * tierDef.pricePerSeat;
  const tokenFee = (tenant.usage?.tokensConsumed ?? 0) * tierDef.tokenRatePerM;
  return seatFee + tokenFee;
}

export function formatMRR(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

// ─── Tenant admins (users with is_admin=true per org) ────────────────────────
export const TENANT_ADMINS = {
  1: [
    { id: "ua-1-1", userId: "u-101", name: "Sarah Chen",    email: "s.chen@meridian.io",   grantedAt: "2024-03-15", grantedBy: "super-admin" },
    { id: "ua-1-2", userId: "u-102", name: "Marcus Brown",  email: "m.brown@meridian.io",  grantedAt: "2024-08-01", grantedBy: "s.chen@meridian.io" },
  ],
  2: [
    { id: "ua-2-1", userId: "u-201", name: "Dr. James Ruiz", email: "j.ruiz@nexushealth.com", grantedAt: "2024-01-08", grantedBy: "super-admin" },
  ],
  3: [
    { id: "ua-3-1", userId: "u-301", name: "Mark Obasi",   email: "m.obasi@vantalog.co",   grantedAt: "2024-06-22", grantedBy: "super-admin" },
    { id: "ua-3-2", userId: "u-302", name: "Priya Singh",  email: "p.singh@vantalog.co",   grantedAt: "2024-09-10", grantedBy: "m.obasi@vantalog.co" },
  ],
  4: [
    { id: "ua-4-1", userId: "u-401", name: "Priya Patel",  email: "p.patel@orionlearn.com", grantedAt: "2024-09-10", grantedBy: "super-admin" },
  ],
  5: [
    { id: "ua-5-1", userId: "u-501", name: "Tom Hargreaves", email: "t.hargreaves@apexmfg.com", grantedAt: "2024-05-30", grantedBy: "super-admin" },
  ],
  6: [
    { id: "ua-6-1", userId: "u-601", name: "Lisa Monroe",  email: "l.monroe@brightlineretail.com", grantedAt: "2024-07-14", grantedBy: "super-admin" },
  ],
  7: [
    { id: "ua-7-1", userId: "u-701", name: "David Ng",     email: "d.ng@strategos.io",      grantedAt: "2025-03-01", grantedBy: "super-admin" },
  ],
  8: [
    { id: "ua-8-1", userId: "u-801", name: "Rachel Torres", email: "r.torres@cobaltins.com", grantedAt: "2023-11-20", grantedBy: "super-admin" },
    { id: "ua-8-2", userId: "u-802", name: "Greg Palmer",   email: "g.palmer@cobaltins.com", grantedAt: "2024-02-14", grantedBy: "r.torres@cobaltins.com" },
  ],
  9: [
    { id: "ua-9-1", userId: "u-901", name: "Yuki Tanaka",  email: "y.tanaka@zenithpharma.com", grantedAt: "2024-10-05", grantedBy: "super-admin" },
  ],
  10: [
    { id: "ua-10-1", userId: "u-1001", name: "Chris Blake", email: "c.blake@pulsarmedia.tv", grantedAt: "2024-04-18", grantedBy: "super-admin" },
  ],
};

// ─── Tenant email domains ─────────────────────────────────────────────────────
export const TENANT_DOMAINS = {
  1:  [
    { domain: "meridian.io",      verified: true,  addedAt: "2024-03-15" },
    { domain: "meridian-corp.com", verified: false, addedAt: "2025-01-10" },
  ],
  2:  [{ domain: "nexushealth.com", verified: true, addedAt: "2024-01-08" }],
  3:  [
    { domain: "vantalog.co",   verified: true,  addedAt: "2024-06-22" },
    { domain: "vantalog.com",  verified: true,  addedAt: "2024-07-01" },
  ],
  4:  [{ domain: "orionlearn.com", verified: true, addedAt: "2024-09-10" }],
  5:  [{ domain: "apexmfg.com",    verified: true, addedAt: "2024-05-30" }],
  6:  [{ domain: "brightlineretail.com", verified: true, addedAt: "2024-07-14" }],
  7:  [{ domain: "strategos.io",   verified: false, addedAt: "2025-03-01" }],
  8:  [
    { domain: "cobaltins.com",   verified: true,  addedAt: "2023-11-20" },
    { domain: "cobalt-ins.com",  verified: true,  addedAt: "2024-01-05" },
  ],
  9:  [{ domain: "zenithpharma.com", verified: true, addedAt: "2024-10-05" }],
  10: [{ domain: "pulsarmedia.tv",   verified: true, addedAt: "2024-04-18" }],
};

// ─── Tenant audit log entries ─────────────────────────────────────────────────
export const TENANT_AUDIT_LOG = {
  1: [
    { id:"al-1-1",  actor:"system",               action:"tenant.created",   detail:"Tenant 'Meridian Financial' provisioned on cloud infrastructure",         ts:"2024-03-15T09:00:00Z" },
    { id:"al-1-2",  actor:"super-admin",           action:"plan.changed",     detail:"Plan upgraded: Standard → Enterprise (annual billing)",                   ts:"2024-03-15T09:05:00Z" },
    { id:"al-1-3",  actor:"super-admin",           action:"admin.granted",    detail:"Admin access granted to Sarah Chen (s.chen@meridian.io)",                 ts:"2024-03-16T10:10:00Z" },
    { id:"al-1-4",  actor:"s.chen@meridian.io",    action:"domain.added",     detail:"Domain 'meridian.io' added to allowlist",                                 ts:"2024-04-01T08:30:00Z" },
    { id:"al-1-5",  actor:"s.chen@meridian.io",    action:"domain.verified",  detail:"Domain 'meridian.io' verified via DNS TXT record",                        ts:"2024-04-02T11:15:00Z" },
    { id:"al-1-6",  actor:"s.chen@meridian.io",    action:"user.invited",     detail:"Invited r.patel@meridian.io with role Editor",                            ts:"2024-04-05T14:20:00Z" },
    { id:"al-1-7",  actor:"super-admin",           action:"override.set",     detail:"Seat limit override applied: 500 → 620",                                  ts:"2024-06-01T09:00:00Z" },
    { id:"al-1-8",  actor:"s.chen@meridian.io",    action:"sso.enabled",      detail:"SSO configured via Okta (SAML 2.0) — enforced for all members",           ts:"2024-07-10T13:00:00Z" },
    { id:"al-1-9",  actor:"s.chen@meridian.io",    action:"mfa.enforced",     detail:"MFA enforcement policy updated: Optional → Required (14-day grace period)",ts:"2024-08-01T10:00:00Z" },
    { id:"al-1-10", actor:"super-admin",           action:"admin.granted",    detail:"Admin access granted to Marcus Brown (m.brown@meridian.io)",              ts:"2024-08-01T11:05:00Z" },
    { id:"al-1-11", actor:"s.chen@meridian.io",    action:"api_key.created",  detail:"API key 'prod-integration-v1' created with read/write scope",             ts:"2024-09-15T09:30:00Z" },
    { id:"al-1-12", actor:"system",               action:"invoice.paid",     detail:"Invoice INV-2024-09 paid — $9,880 (Enterprise annual)",                   ts:"2024-10-01T00:00:00Z" },
    { id:"al-1-13", actor:"s.chen@meridian.io",    action:"plan.changed",     detail:"Plan renewed: Enterprise annual — $118,560 committed",                    ts:"2024-11-15T10:30:00Z" },
    { id:"al-1-14", actor:"s.chen@meridian.io",    action:"domain.added",     detail:"Domain 'meridian-corp.com' added as secondary allowlist entry",           ts:"2025-01-10T14:22:00Z" },
    { id:"al-1-15", actor:"system",               action:"login.failed",     detail:"5 consecutive failed logins for m.brown@meridian.io — account locked",    ts:"2025-02-01T03:14:00Z" },
    { id:"al-1-16", actor:"m.brown@meridian.io",   action:"user.invited",     detail:"Invited l.wong@meridian.io with role Editor",                             ts:"2025-02-15T11:00:00Z" },
    { id:"al-1-17", actor:"s.chen@meridian.io",    action:"settings.updated", detail:"MFA grace period reduced: 14 days → 7 days",                              ts:"2025-03-01T09:00:00Z" },
    { id:"al-1-18", actor:"s.chen@meridian.io",    action:"agent.deployed",   detail:"Agent 'Data Sync v2.1' promoted to production environment",               ts:"2025-03-10T15:30:00Z" },
    { id:"al-1-19", actor:"s.chen@meridian.io",    action:"flow.published",   detail:"Workflow 'Customer Onboarding v3' published and set as default",          ts:"2025-03-22T09:45:00Z" },
    { id:"al-1-20", actor:"system",               action:"invoice.paid",     detail:"Invoice INV-2025-04 paid — $9,880 (Enterprise monthly instalment)",       ts:"2025-04-01T00:00:00Z" },
    { id:"al-1-21", actor:"s.chen@meridian.io",    action:"api_key.revoked",  detail:"API key 'prod-integration-v1' revoked — rotation policy applied",         ts:"2025-04-15T10:00:00Z" },
    { id:"al-1-22", actor:"s.chen@meridian.io",    action:"api_key.created",  detail:"API key 'prod-integration-v2' created (replaces v1)",                     ts:"2025-04-15T10:05:00Z" },
    { id:"al-1-23", actor:"r.patel@meridian.io",   action:"data.exported",    detail:"Member roster exported as CSV (620 records) — IP 192.168.1.45",           ts:"2025-05-01T09:00:00Z" },
    { id:"al-1-24", actor:"s.chen@meridian.io",    action:"user.removed",     detail:"j.smith@meridian.io removed from organisation — off-boarded",             ts:"2025-05-10T11:30:00Z" },
    { id:"al-1-25", actor:"s.chen@meridian.io",    action:"role.changed",     detail:"Lisa Wong role changed: Editor → Viewer (permissions downgraded)",        ts:"2025-05-12T16:00:00Z" },
  ],
  3: [
    { id:"al-3-1",  actor:"system",               action:"tenant.created",   detail:"Tenant 'Vanta Logistics' provisioned",                                    ts:"2024-06-22T08:00:00Z" },
    { id:"al-3-2",  actor:"super-admin",           action:"admin.granted",    detail:"Admin access granted to Mark Obasi (m.obasi@vantalog.co)",                ts:"2024-06-22T08:10:00Z" },
    { id:"al-3-3",  actor:"m.obasi@vantalog.co",   action:"domain.added",     detail:"Domain 'vantalog.co' added to allowlist",                                 ts:"2024-07-01T09:15:00Z" },
    { id:"al-3-4",  actor:"m.obasi@vantalog.co",   action:"domain.verified",  detail:"Domain 'vantalog.co' verified via DNS",                                   ts:"2024-07-03T10:00:00Z" },
    { id:"al-3-5",  actor:"super-admin",           action:"admin.granted",    detail:"Admin access granted to Priya Singh (p.singh@vantalog.co)",               ts:"2024-09-10T16:40:00Z" },
    { id:"al-3-6",  actor:"super-admin",           action:"override.set",     detail:"Agent limit override applied: 10 → 15",                                   ts:"2024-10-01T12:00:00Z" },
    { id:"al-3-7",  actor:"m.obasi@vantalog.co",   action:"mfa.enforced",     detail:"MFA enforcement enabled for all admin accounts",                          ts:"2024-11-15T09:00:00Z" },
    { id:"al-3-8",  actor:"p.singh@vantalog.co",   action:"agent.deployed",   detail:"Agent 'Route Optimiser v1.0' deployed to production",                    ts:"2025-01-20T14:00:00Z" },
    { id:"al-3-9",  actor:"system",               action:"invoice.paid",     detail:"Invoice INV-3-2025-03 paid — $4,200",                                     ts:"2025-03-01T00:00:00Z" },
    { id:"al-3-10", actor:"m.obasi@vantalog.co",   action:"user.invited",     detail:"Invited j.okonkwo@vantalog.co with role Editor",                          ts:"2025-04-05T11:30:00Z" },
    { id:"al-3-11", actor:"m.obasi@vantalog.co",   action:"api_key.created",  detail:"API key 'wms-integration' created with read-only scope",                  ts:"2025-04-28T09:00:00Z" },
    { id:"al-3-12", actor:"p.singh@vantalog.co",   action:"data.exported",    detail:"Usage report exported — last 90 days",                                    ts:"2025-05-08T15:30:00Z" },
  ],
  4: [
    { id:"al-4-1",  actor:"system",               action:"tenant.created",   detail:"Tenant 'Orion Learning' provisioned",                                     ts:"2024-09-01T10:00:00Z" },
    { id:"al-4-2",  actor:"super-admin",           action:"admin.granted",    detail:"Admin access granted to Priya Patel (p.patel@orionlearn.com)",            ts:"2024-09-01T10:05:00Z" },
    { id:"al-4-3",  actor:"p.patel@orionlearn.com",action:"domain.added",     detail:"Domain 'orionlearn.com' added and auto-verified",                         ts:"2024-09-10T12:00:00Z" },
    { id:"al-4-4",  actor:"p.patel@orionlearn.com",action:"user.invited",     detail:"Invited j.obi@orionlearn.com with role Editor",                           ts:"2024-10-01T09:00:00Z" },
    { id:"al-4-5",  actor:"system",               action:"invoice.paid",     detail:"Invoice INV-4-2025-01 paid — $1,800",                                     ts:"2025-01-01T00:00:00Z" },
    { id:"al-4-6",  actor:"p.patel@orionlearn.com",action:"flow.published",   detail:"Workflow 'Student Onboarding' published",                                 ts:"2025-02-14T11:00:00Z" },
    { id:"al-4-7",  actor:"p.patel@orionlearn.com",action:"user.removed",     detail:"m.dupont@orionlearn.com deactivated — contract ended",                    ts:"2025-04-01T09:30:00Z" },
  ],
  5: [
    { id:"al-5-1",  actor:"system",               action:"tenant.created",   detail:"Tenant 'Apex Manufacturing' provisioned",                                 ts:"2024-05-30T09:00:00Z" },
    { id:"al-5-2",  actor:"super-admin",           action:"admin.granted",    detail:"Admin access granted to Tom Hargreaves",                                  ts:"2024-05-30T09:10:00Z" },
    { id:"al-5-3",  actor:"t.hargreaves@apexmfg.com",action:"domain.added",   detail:"Domain 'apexmfg.com' added to allowlist",                                 ts:"2024-06-05T10:00:00Z" },
    { id:"al-5-4",  actor:"t.hargreaves@apexmfg.com",action:"user.invited",   detail:"Invited j.porter@apexmfg.com with role Editor",                           ts:"2024-06-10T14:00:00Z" },
    { id:"al-5-5",  actor:"system",               action:"invoice.paid",     detail:"Invoice INV-5-2025-03 paid — $1,200",                                     ts:"2025-03-01T00:00:00Z" },
    { id:"al-5-6",  actor:"t.hargreaves@apexmfg.com",action:"agent.deployed", detail:"Agent 'QC Inspector v1' deployed to production",                          ts:"2025-04-10T13:00:00Z" },
  ],
  6: [
    { id:"al-6-1",  actor:"system",               action:"tenant.created",   detail:"Tenant 'Brightline Retail' provisioned",                                  ts:"2023-11-01T09:00:00Z" },
    { id:"al-6-2",  actor:"super-admin",           action:"admin.granted",    detail:"Admin access granted to Lisa Monroe",                                     ts:"2023-11-01T09:05:00Z" },
    { id:"al-6-3",  actor:"l.monroe@brightlineretail.com",action:"domain.added",detail:"Domain 'brightlineretail.com' added",                                  ts:"2023-11-10T11:00:00Z" },
    { id:"al-6-4",  actor:"l.monroe@brightlineretail.com",action:"sso.enabled",detail:"SSO enabled via Azure AD (OIDC)",                                        ts:"2024-02-15T14:00:00Z" },
    { id:"al-6-5",  actor:"l.monroe@brightlineretail.com",action:"mfa.enforced",detail:"MFA required for all accounts",                                         ts:"2024-03-01T09:00:00Z" },
    { id:"al-6-6",  actor:"system",               action:"invoice.paid",     detail:"Invoice INV-6-2025-04 paid — $3,960",                                     ts:"2025-04-01T00:00:00Z" },
    { id:"al-6-7",  actor:"b.watts@brightlineretail.com",action:"flow.published",detail:"Workflow 'Inventory Sync v2' published",                               ts:"2025-04-20T10:30:00Z" },
    { id:"al-6-8",  actor:"l.monroe@brightlineretail.com",action:"data.exported",detail:"Full audit export requested — compliance review",                      ts:"2025-05-05T09:00:00Z" },
  ],
  7: [
    { id:"al-7-1",  actor:"system",               action:"tenant.created",   detail:"Tenant 'Strategos Consulting' provisioned (trial)",                       ts:"2025-03-01T10:00:00Z" },
    { id:"al-7-2",  actor:"super-admin",           action:"admin.granted",    detail:"Admin access granted to David Ng",                                        ts:"2025-03-01T10:05:00Z" },
    { id:"al-7-3",  actor:"d.ng@strategos.io",     action:"domain.added",     detail:"Domain 'strategos.io' added",                                             ts:"2025-03-05T14:00:00Z" },
    { id:"al-7-4",  actor:"d.ng@strategos.io",     action:"user.invited",     detail:"Invited e.ross@strategos.io with role Editor",                            ts:"2025-03-10T11:00:00Z" },
  ],
  8: [
    { id:"al-8-1",  actor:"system",               action:"tenant.created",   detail:"Tenant 'Cobalt Insurance' provisioned",                                   ts:"2023-05-15T09:00:00Z" },
    { id:"al-8-2",  actor:"super-admin",           action:"admin.granted",    detail:"Admin access granted to Rachel Torres",                                   ts:"2023-05-15T09:10:00Z" },
    { id:"al-8-3",  actor:"r.torres@cobaltins.com",action:"domain.added",     detail:"Domain 'cobaltins.com' added and verified",                               ts:"2023-05-20T10:00:00Z" },
    { id:"al-8-4",  actor:"r.torres@cobaltins.com",action:"sso.enabled",      detail:"SSO configured via PingFederate (SAML 2.0)",                              ts:"2023-09-01T13:00:00Z" },
    { id:"al-8-5",  actor:"r.torres@cobaltins.com",action:"mfa.enforced",     detail:"MFA required — compliance mandate (SOC 2 Type II)",                      ts:"2024-01-01T09:00:00Z" },
    { id:"al-8-6",  actor:"super-admin",           action:"plan.changed",     detail:"Plan upgraded: Professional → Enterprise",                                ts:"2024-06-01T10:00:00Z" },
    { id:"al-8-7",  actor:"r.torres@cobaltins.com",action:"api_key.created",  detail:"API key 'claims-api-prod' created",                                       ts:"2024-08-15T09:00:00Z" },
    { id:"al-8-8",  actor:"system",               action:"invoice.paid",     detail:"Invoice INV-8-2025-04 paid — $14,200",                                    ts:"2025-04-01T00:00:00Z" },
    { id:"al-8-9",  actor:"r.torres@cobaltins.com",action:"agent.deployed",   detail:"Agent 'Claims Triage v3.2' promoted to production",                      ts:"2025-04-25T14:30:00Z" },
    { id:"al-8-10", actor:"g.palmer@cobaltins.com",action:"data.exported",    detail:"Claims processing audit log exported — GDPR request",                    ts:"2025-05-02T10:00:00Z" },
    { id:"al-8-11", actor:"r.torres@cobaltins.com",action:"role.changed",     detail:"Oscar Leung role changed: Viewer → Editor",                               ts:"2025-05-09T11:00:00Z" },
  ],
  10: [
    { id:"al-10-1", actor:"system",               action:"tenant.created",   detail:"Tenant 'NovaTech Solutions' provisioned",                                 ts:"2024-04-18T09:00:00Z" },
    { id:"al-10-2", actor:"super-admin",           action:"admin.granted",    detail:"Admin access granted to initial contact",                                 ts:"2024-04-18T09:05:00Z" },
    { id:"al-10-3", actor:"super-admin",           action:"plan.changed",     detail:"Plan set: Trial → Standard",                                              ts:"2024-07-01T09:00:00Z" },
    { id:"al-10-4", actor:"system",               action:"login.failed",     detail:"Multiple failed login attempts detected — automated lockout triggered",   ts:"2025-01-05T02:30:00Z" },
    { id:"al-10-5", actor:"super-admin",           action:"tenant.suspended",  detail:"Tenant suspended — non-payment after 30-day grace period",               ts:"2025-01-10T15:00:00Z" },
  ],
};

export const TIER_CFG = {
  lite:   { bg: "#475569", text: "#ffffff", ring: "#94a3b8" },
  growth: { bg: "#2563eb", text: "#ffffff", ring: "#93c5fd" },
  scale:  { bg: "#7c3aed", text: "#ffffff", ring: "#c4b5fd" },
};

export const DEPLOY_CFG = {
  saas: { bg: "#0ea5e9", text: "#ffffff", label: "Cloud" },
};

export const STATUS_CFG = {
  active:    { dot: "#16a34a", text: "#16a34a", label: "Active",    bg: "#dcfce7", badgeText: "#15803d" },
  trial:     { dot: "#2563eb", text: "#2563eb", label: "Trial",     bg: "#dbeafe", badgeText: "#1d4ed8" },
  suspended: { dot: "#ef4444", text: "#dc2626", label: "Suspended", bg: "#fee2e2", badgeText: "#b91c1c" },
  deleted:   { dot: "#94a3b8", text: "#64748b", label: "Deleted",   bg: "#f1f5f9", badgeText: "#475569" },
  churned:   { dot: "#94a3b8", text: "#64748b", label: "Churned",   bg: "#f1f5f9", badgeText: "#475569" },
};

export const PLAN_CFG = {
  trial:        { label: "Trial",        color: "#f59e0b", bg: "#fef9c3", text: "#a16207" },
  standard:     { label: "Standard",     color: "#0ea5e9", bg: "#e0f2fe", text: "#0369a1" },
  professional: { label: "Professional", color: "#8b5cf6", bg: "#ede9fe", text: "#6d28d9" },
  enterprise:   { label: "Enterprise",   color: "#2563eb", bg: "#dbeafe", text: "#1d4ed8" },
};

export const INV_STATUS_CFG = {
  paid:    { bg: "#dcfce7", text: "#16a34a", label: "Paid"    },
  overdue: { bg: "#fee2e2", text: "#dc2626", label: "Overdue" },
  pending: { bg: "#fef9c3", text: "#ca8a04", label: "Pending" },
  draft:   { bg: "#f1f5f9", text: "#64748b", label: "Draft"   },
};
