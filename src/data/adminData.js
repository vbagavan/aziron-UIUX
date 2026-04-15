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

// ─── On-Premises tier definitions ───────────────────────────────────────────
export const ONPREM_TIERS = {
  lite: {
    id: "lite", label: "Lite", monthlyFee: 10000,
    limits: { agents: 10, workflows: null, concurrentFlows: 5, flowExecPerMonth: 50000, knowledgeHubGB: null },
    support: "Email", ltsBuilds: true, namedSA: false, hipaa: true, sso: true,
  },
  growth: {
    id: "growth", label: "Growth", monthlyFee: 20000,
    limits: { agents: 25, workflows: null, concurrentFlows: 15, flowExecPerMonth: 250000, knowledgeHubGB: null },
    support: "Priority", ltsBuilds: true, namedSA: true, hipaa: true, sso: true,
  },
  scale: {
    id: "scale", label: "Scale", monthlyFee: 35000,
    limits: { agents: null, workflows: null, concurrentFlows: null, flowExecPerMonth: null, knowledgeHubGB: null },
    support: "24×7 Dedicated", ltsBuilds: true, namedSA: true, hipaa: true, sso: true,
  },
};

// ─── Tenant list ─────────────────────────────────────────────────────────────
export const TENANTS = [
  {
    id: 1, name: "Meridian Financial", domain: "meridian.io",
    deployment: "saas", tier: "scale", seats: 620, status: "active",
    industry: "Finance", contactName: "Sarah Chen", contactEmail: "s.chen@meridian.io",
    createdAt: "2024-03-15", overrides: {},
    usage: { tokensConsumed: 1840, seatsUsed: 607, flowExecutions: 84200, storageGB: 312,
      trend: [820, 940, 1100, 1280, 1560, 1840] },
  },
  {
    id: 2, name: "Nexus Health Systems", domain: "nexushealth.com",
    deployment: "on-prem", tier: "scale", seats: null, status: "active",
    industry: "Healthcare", contactName: "Dr. James Ruiz", contactEmail: "j.ruiz@nexushealth.com",
    createdAt: "2024-01-08", solutionsArchitect: "Alex Kim", licenseStart: "2024-02-01", overrides: {},
    usage: { tokensConsumed: 3100, seatsUsed: null, flowExecutions: 198000, storageGB: null,
      trend: [1400, 1800, 2100, 2500, 2800, 3100] },
  },
  {
    id: 3, name: "Vanta Logistics", domain: "vantalog.co",
    deployment: "saas", tier: "growth", seats: 245, status: "active",
    industry: "Logistics", contactName: "Mark Obasi", contactEmail: "m.obasi@vantalog.co",
    createdAt: "2024-06-22", overrides: { agents: 15 },
    usage: { tokensConsumed: 520, seatsUsed: 237, flowExecutions: 32100, storageGB: 28,
      trend: [180, 240, 310, 390, 450, 520] },
  },
  {
    id: 4, name: "Orion EdTech", domain: "orionlearn.com",
    deployment: "saas", tier: "lite", seats: 88, status: "active",
    industry: "Education", contactName: "Priya Patel", contactEmail: "p.patel@orionlearn.com",
    createdAt: "2024-09-10", overrides: {},
    usage: { tokensConsumed: 180, seatsUsed: 71, flowExecutions: 3800, storageGB: 3.2,
      trend: [40, 70, 95, 120, 150, 180] },
  },
  {
    id: 5, name: "Apex Manufacturing", domain: "apexmfg.com",
    deployment: "on-prem", tier: "growth", seats: null, status: "active",
    industry: "Manufacturing", contactName: "Tom Hargreaves", contactEmail: "t.hargreaves@apexmfg.com",
    createdAt: "2024-05-30", solutionsArchitect: "Maria Santos", licenseStart: "2024-06-15", overrides: {},
    usage: { tokensConsumed: 1650, seatsUsed: null, flowExecutions: 187000, storageGB: null,
      trend: [700, 900, 1100, 1280, 1450, 1650] },
  },
  {
    id: 6, name: "Brightline Retail", domain: "brightlineretail.com",
    deployment: "saas", tier: "growth", seats: 182, status: "active",
    industry: "Retail", contactName: "Lisa Monroe", contactEmail: "l.monroe@brightlineretail.com",
    createdAt: "2024-07-14", overrides: { flowExecPerMonth: 80000 },
    usage: { tokensConsumed: 390, seatsUsed: 175, flowExecutions: 61200, storageGB: 22,
      trend: [90, 140, 200, 270, 330, 390] },
  },
  {
    id: 7, name: "Strategos Consulting", domain: "strategos.io",
    deployment: "saas", tier: "lite", seats: 42, status: "trial",
    industry: "Consulting", contactName: "David Ng", contactEmail: "d.ng@strategos.io",
    createdAt: "2025-03-01", overrides: {},
    usage: { tokensConsumed: 62, seatsUsed: 38, flowExecutions: 1100, storageGB: 0.8,
      trend: [0, 0, 8, 18, 38, 62] },
  },
  {
    id: 8, name: "Cobalt Insurance", domain: "cobaltins.com",
    deployment: "saas", tier: "scale", seats: 510, status: "active",
    industry: "Insurance", contactName: "Rachel Torres", contactEmail: "r.torres@cobaltins.com",
    createdAt: "2023-11-20", overrides: { knowledgeHubGB: 800 },
    usage: { tokensConsumed: 2250, seatsUsed: 498, flowExecutions: null, storageGB: 445,
      trend: [1100, 1400, 1700, 1900, 2100, 2250] },
  },
  {
    id: 9, name: "Zenith Pharma", domain: "zenithpharma.com",
    deployment: "on-prem", tier: "lite", seats: null, status: "active",
    industry: "Pharma", contactName: "Yuki Tanaka", contactEmail: "y.tanaka@zenithpharma.com",
    createdAt: "2024-10-05", solutionsArchitect: "Ben Carter", licenseStart: "2024-11-01", overrides: {},
    usage: { tokensConsumed: 850, seatsUsed: null, flowExecutions: 41000, storageGB: null,
      trend: [200, 350, 480, 610, 730, 850] },
  },
  {
    id: 10, name: "Pulsar Media", domain: "pulsarmedia.tv",
    deployment: "saas", tier: "growth", seats: 130, status: "suspended",
    industry: "Media", contactName: "Chris Blake", contactEmail: "c.blake@pulsarmedia.tv",
    createdAt: "2024-04-18", overrides: {},
    usage: { tokensConsumed: 0, seatsUsed: 0, flowExecutions: 0, storageGB: 18,
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

  { id: "INV-2025-0402", tenantId: 2, amount: 35000, status: "paid",   period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "On-Prem Scale license", amount: 35000 }] },
  { id: "INV-2025-0302", tenantId: 2, amount: 35000, status: "paid",   period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "On-Prem Scale license", amount: 35000 }] },
  { id: "INV-2025-0202", tenantId: 2, amount: 35000, status: "paid",   period: "Feb 2025", issuedAt: "2025-02-01", items: [{ label: "On-Prem Scale license", amount: 35000 }] },
  { id: "INV-2025-0102", tenantId: 2, amount: 35000, status: "paid",   period: "Jan 2025", issuedAt: "2025-01-01", items: [{ label: "On-Prem Scale license", amount: 35000 }] },

  { id: "INV-2025-0403", tenantId: 3, amount: 4500, status: "paid",    period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "245 seats × $12.00", amount: 2940 }, { label: "Platform tokens (520M)", amount: 1560 }] },
  { id: "INV-2025-0303", tenantId: 3, amount: 4230, status: "paid",    period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "245 seats × $12.00", amount: 2940 }, { label: "Platform tokens (430M)", amount: 1290 }] },
  { id: "INV-2025-0203", tenantId: 3, amount: 3888, status: "paid",    period: "Feb 2025", issuedAt: "2025-02-01", items: [{ label: "240 seats × $12.00", amount: 2880 }, { label: "Platform tokens (336M)", amount: 1008 }] },
  { id: "INV-2025-0103", tenantId: 3, amount: 3600, status: "paid",    period: "Jan 2025", issuedAt: "2025-01-01", items: [{ label: "235 seats × $12.00", amount: 2820 }, { label: "Platform tokens (260M)", amount: 780 }] },

  { id: "INV-2025-0404", tenantId: 4, amount: 2220, status: "paid",    period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "88 seats × $15.00", amount: 1320 }, { label: "Platform tokens (180M)", amount: 900 }] },
  { id: "INV-2025-0304", tenantId: 4, amount: 2070, status: "paid",    period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "88 seats × $15.00", amount: 1320 }, { label: "Platform tokens (150M)", amount: 750 }] },

  { id: "INV-2025-0405", tenantId: 5, amount: 20000, status: "paid",   period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "On-Prem Growth license", amount: 20000 }] },
  { id: "INV-2025-0305", tenantId: 5, amount: 20000, status: "paid",   period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "On-Prem Growth license", amount: 20000 }] },

  { id: "INV-2025-0406", tenantId: 6, amount: 3354, status: "overdue", period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "182 seats × $12.00", amount: 2184 }, { label: "Platform tokens (390M)", amount: 1170 }] },
  { id: "INV-2025-0306", tenantId: 6, amount: 3144, status: "paid",    period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "182 seats × $12.00", amount: 2184 }, { label: "Platform tokens (320M)", amount: 960 }] },

  { id: "INV-2025-0407", tenantId: 8, amount: 9600, status: "paid",    period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "510 seats × $10.00", amount: 5100 }, { label: "Platform tokens (2,250M)", amount: 4500 }] },
  { id: "INV-2025-0307", tenantId: 8, amount: 9300, status: "paid",    period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "510 seats × $10.00", amount: 5100 }, { label: "Platform tokens (2,100M)", amount: 4200 }] },

  { id: "INV-2025-0408", tenantId: 9, amount: 10000, status: "paid",   period: "Apr 2025", issuedAt: "2025-04-01", items: [{ label: "On-Prem Lite license", amount: 10000 }] },
  { id: "INV-2025-0308", tenantId: 9, amount: 10000, status: "paid",   period: "Mar 2025", issuedAt: "2025-03-01", items: [{ label: "On-Prem Lite license", amount: 10000 }] },

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
    { id:1, name:"Sarah Chen",       email:"s.chen@meridian.io",      role:"Admin",  status:"Active",   lastActive:"Today, 9:24 AM"      },
    { id:2, name:"Raj Patel",        email:"r.patel@meridian.io",     role:"Member", status:"Active",   lastActive:"Today, 8:45 AM"      },
    { id:3, name:"Lisa Wong",        email:"l.wong@meridian.io",      role:"Member", status:"Active",   lastActive:"Yesterday, 4:12 PM"  },
    { id:4, name:"Marcus Brown",     email:"m.brown@meridian.io",     role:"Member", status:"Active",   lastActive:"2 days ago"          },
    { id:5, name:"Anya Novak",       email:"a.novak@meridian.io",     role:"Member", status:"Active",   lastActive:"3 days ago"          },
    { id:6, name:"Kevin Shah",       email:"k.shah@meridian.io",      role:"Member", status:"Invited",  lastActive:"—"                   },
    { id:7, name:"Priya Lal",        email:"p.lal@meridian.io",       role:"Member", status:"Inactive", lastActive:"15 days ago"         },
  ],
  3: [
    { id:1,  name:"Mark Obasi",      email:"m.obasi@vantalog.co",     role:"Admin",  status:"Active",   lastActive:"Today, 10:01 AM"     },
    { id:2,  name:"Priya Singh",     email:"p.singh@vantalog.co",     role:"Admin",  status:"Active",   lastActive:"Today, 7:30 AM"      },
    { id:3,  name:"Claire Walsh",    email:"c.walsh@vantalog.co",     role:"Member", status:"Active",   lastActive:"Today, 9:33 AM"      },
    { id:4,  name:"Tom Reeves",      email:"t.reeves@vantalog.co",    role:"Member", status:"Active",   lastActive:"Today, 8:55 AM"      },
    { id:5,  name:"Nina Park",       email:"n.park@vantalog.co",      role:"Member", status:"Active",   lastActive:"Yesterday, 6:20 PM"  },
    { id:6,  name:"Sam Diallo",      email:"s.diallo@vantalog.co",    role:"Member", status:"Active",   lastActive:"Yesterday, 2:40 PM"  },
    { id:7,  name:"Amara Osei",      email:"a.osei@vantalog.co",      role:"Member", status:"Active",   lastActive:"2 days ago"          },
    { id:8,  name:"Liam Chen",       email:"l.chen@vantalog.co",      role:"Member", status:"Active",   lastActive:"2 days ago"          },
    { id:9,  name:"Fatima Al-Rashid",email:"f.alrashid@vantalog.co",  role:"Member", status:"Active",   lastActive:"3 days ago"          },
    { id:10, name:"Jacob Okonkwo",   email:"j.okonkwo@vantalog.co",   role:"Member", status:"Invited",  lastActive:"—"                   },
    { id:11, name:"Yara Hassan",     email:"y.hassan@vantalog.co",    role:"Member", status:"Invited",  lastActive:"—"                   },
    { id:12, name:"Derek Mills",     email:"d.mills@vantalog.co",     role:"Member", status:"Inactive", lastActive:"18 days ago"         },
  ],
  4: [
    { id:1, name:"Priya Patel",      email:"p.patel@orionlearn.com",  role:"Admin",  status:"Active",   lastActive:"Today, 11:00 AM"     },
    { id:2, name:"James Obi",        email:"j.obi@orionlearn.com",    role:"Member", status:"Active",   lastActive:"Today, 10:20 AM"     },
    { id:3, name:"Soo-Yeon Kim",     email:"s.kim@orionlearn.com",    role:"Member", status:"Active",   lastActive:"Yesterday"           },
    { id:4, name:"Aaron Vasquez",    email:"a.vasquez@orionlearn.com",role:"Member", status:"Invited",  lastActive:"—"                   },
    { id:5, name:"Marie Dupont",     email:"m.dupont@orionlearn.com", role:"Member", status:"Inactive", lastActive:"21 days ago"         },
  ],
  6: [
    { id:1, name:"Lisa Monroe",      email:"l.monroe@brightlineretail.com",role:"Admin",  status:"Active",   lastActive:"Today, 9:05 AM"  },
    { id:2, name:"Brian Watts",      email:"b.watts@brightlineretail.com", role:"Member", status:"Active",   lastActive:"Today, 8:30 AM"  },
    { id:3, name:"Chloe Martin",     email:"c.martin@brightlineretail.com",role:"Member", status:"Active",   lastActive:"Yesterday"       },
    { id:4, name:"Dev Kapoor",       email:"d.kapoor@brightlineretail.com",role:"Member", status:"Invited",  lastActive:"—"               },
  ],
  7: [
    { id:1, name:"David Ng",         email:"d.ng@strategos.io",       role:"Admin",  status:"Active",   lastActive:"Today, 8:00 AM"      },
    { id:2, name:"Elena Ross",       email:"e.ross@strategos.io",     role:"Member", status:"Active",   lastActive:"Yesterday"           },
    { id:3, name:"Paulo Ferreira",   email:"p.ferreira@strategos.io", role:"Member", status:"Invited",  lastActive:"—"                   },
  ],
  8: [
    { id:1, name:"Rachel Torres",    email:"r.torres@cobaltins.com",  role:"Admin",  status:"Active",   lastActive:"Today, 10:15 AM"     },
    { id:2, name:"Greg Palmer",      email:"g.palmer@cobaltins.com",  role:"Member", status:"Active",   lastActive:"Today, 9:00 AM"      },
    { id:3, name:"Mia Johansson",    email:"m.johansson@cobaltins.com",role:"Member",status:"Active",   lastActive:"Yesterday, 5:30 PM"  },
    { id:4, name:"Oscar Leung",      email:"o.leung@cobaltins.com",   role:"Member", status:"Active",   lastActive:"2 days ago"          },
    { id:5, name:"Dana Hill",        email:"d.hill@cobaltins.com",    role:"Member", status:"Inactive", lastActive:"10 days ago"         },
    { id:6, name:"Felix Nguyen",     email:"f.nguyen@cobaltins.com",  role:"Member", status:"Invited",  lastActive:"—"                   },
  ],
};

// ─── Trend month labels (last 6 months) ─────────────────────────────────────
export const TREND_MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function getTierDef(tenant) {
  if (!tenant) return null;
  return tenant.deployment === "on-prem"
    ? ONPREM_TIERS[tenant.tier]
    : SAAS_TIERS[tenant.tier];
}

export function getLimits(tenant) {
  const tierDef = getTierDef(tenant);
  if (!tierDef) return {};
  return { ...tierDef.limits, ...tenant.overrides };
}

export function computeMRR(tenant) {
  if (!tenant || tenant.status === "suspended" || tenant.status === "churned") return 0;
  if (tenant.deployment === "on-prem") {
    return ONPREM_TIERS[tenant.tier]?.monthlyFee ?? 0;
  }
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

export const TIER_CFG = {
  lite:   { bg: "#475569", text: "#ffffff", ring: "#94a3b8" },
  growth: { bg: "#2563eb", text: "#ffffff", ring: "#93c5fd" },
  scale:  { bg: "#7c3aed", text: "#ffffff", ring: "#c4b5fd" },
};

export const DEPLOY_CFG = {
  "saas":    { bg: "#0ea5e9", text: "#ffffff", label: "SaaS"     },
  "on-prem": { bg: "#059669", text: "#ffffff", label: "On-Prem"  },
};

export const STATUS_CFG = {
  active:    { dot: "#16a34a", text: "#16a34a", label: "Active"    },
  trial:     { dot: "#f59e0b", text: "#d97706", label: "Trial"     },
  suspended: { dot: "#ef4444", text: "#dc2626", label: "Suspended" },
  churned:   { dot: "#94a3b8", text: "#64748b", label: "Churned"   },
};

export const INV_STATUS_CFG = {
  paid:    { bg: "#dcfce7", text: "#16a34a", label: "Paid"    },
  overdue: { bg: "#fee2e2", text: "#dc2626", label: "Overdue" },
  pending: { bg: "#fef9c3", text: "#ca8a04", label: "Pending" },
  draft:   { bg: "#f1f5f9", text: "#64748b", label: "Draft"   },
};
