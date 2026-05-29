export const USERS = [
  { id: 1, name: "Malik Boatwright", email: "boatwright@aziro.com", color: "var(--warning)" },
  { id: 2, name: "Zoya Baum", email: "zbaum@aziro.com", color: "var(--primary)" },
  { id: 3, name: "Kenton Rue", email: "rkenton@aziro.com", color: "var(--destructive)" },
  { id: 4, name: "Zackary Turcotte", email: "zturcotte@aziro.com", color: "var(--chart-chart-4)" },
  { id: 5, name: "Branson Crona", email: "rtranson@aziro.com", color: "var(--success)" },
  { id: 6, name: "Shea Trantow", email: "strantow@aziro.com", color: "var(--warning)" },
  { id: 7, name: "Balachandra Husaine", email: "bhusaine@aziro.com", color: "var(--info)" },
  { id: 8, name: "Jayson Heaney", email: "jheaney@aziro.com", color: "var(--destructive)" },
  { id: 9, name: "Crystel Bayer", email: "bcrystel@aziro.com", color: "var(--success)" },
];

export const DEFAULT_RECIPIENTS = [];

export const TEMPLATES = [
  {
    id: "gold-classic",
    label: "Gold Classic",
    thumbSrc: "/kudos-templates/gold-classic.png",
    rendererId: "gold-classic",
    thumbBg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    thumbAccent: "var(--warning)",
  },
  {
    id: "blue-morden",
    label: "Blue Modern",
    thumbSrc: "/kudos-templates/blue-modern-individual.png",
    rendererId: "blue-morden",
    thumbBg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    thumbAccent: "var(--primary)",
  },
  {
    id: "green",
    label: "Green Nature",
    thumbSrc: "/kudos-templates/green-team.png",
    rendererId: "green",
    thumbBg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    thumbAccent: "var(--success)",
  },
  {
    id: "purple-elegant",
    label: "Purple Elegant",
    thumbSrc: "/kudos-templates/purple-elegant.png",
    rendererId: "purple-elegant",
    thumbBg: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)",
    thumbAccent: "var(--chart-chart-4)",
  },
  {
    id: "blue-modern-team",
    label: "Blue Modern (Team)",
    thumbSrc: "/kudos-templates/blue-modern-team.png",
    rendererId: "blue-morden",
    thumbBg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    thumbAccent: "var(--primary)",
  },
  {
    id: "green-nature",
    label: "Green Nature (Classic)",
    thumbSrc: "/kudos-templates/green-nature.png",
    rendererId: "green",
    thumbBg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    thumbAccent: "var(--success)",
  },
  {
    id: "gold-celebration",
    label: "Gold Celebration",
    thumbSrc: "/kudos-templates/gold-celebration.png",
    rendererId: "gold-classic",
    thumbBg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    thumbAccent: "var(--warning)",
  },
];

/** Maps a catalog template id to the card renderer used in the left preview. */
export function resolveKudosRendererId(templateId) {
  return TEMPLATES.find((t) => t.id === templateId)?.rendererId ?? templateId;
}

export function getKudosTemplate(templateId) {
  return TEMPLATES.find((t) => t.id === templateId) ?? null;
}

export const APPRECIATION_CATEGORIES = [
  { id: "customer-service", label: "Outstanding customer service" },
  { id: "milestone", label: "Team milestone" },
  { id: "launch", label: "Product launch" },
  { id: "client-champion", label: "Client champion" },
  { id: "quarterly", label: "Quarterly recognition" },
  { id: "campaign", label: "Campaign / occasion" },
];

export const RECOGNITION_TYPES = [
  { id: "individual", label: "Individual recognition" },
  { id: "team", label: "Team recognition" },
];

export const APPROVAL_STATUS = {
  PENDING: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  CHANGES_REQUESTED: "changes_requested",
};

export const APPROVAL_STATUS_LABELS = {
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes Requested",
};

export const DEFAULT_CARD_CONTENT = {
  headline: "Congratulations",
  subtitle: "On Being Appreciated by the Customer",
  message:
    "Your outstanding dedication, exceptional service, and commitment to excellence have truly made a difference. This recognition is a testament to your remarkable contributions and the impact you've had on our customers.",
  accentColor: "var(--warning)",
  showLogo: true,
  backgroundColor: null,
  backgroundGradient: null,
  fontColor: null,
  themeColor: null,
  brandColor: null,
  buttonColor: null,
  borderColor: null,
  headerBackground: null,
  footerBackground: null,
  bodyBackground: null,
  themeMode: null,
};

/** Appended to BCC when the card is generated (company-wide distribution). */
export const KUDOS_DEFAULT_BCC_RECIPIENTS = ["all@company.com"];

export const DEFAULT_COMPOSE = {
  message: "",
  emailTo: [],
  emailCc: [],
  emailBcc: [],
  toInput: "",
  ccInput: "",
  bccInput: "",
  scheduledDate: "",
  category: "customer-service",
  recognitionType: "individual",
  occasion: "",
};

export const KUDOS_SUGGESTIONS = [
  {
    icon: "🏆",
    title: "Recognise outstanding service",
    prompt: "@Zoya Baum — outstanding customer service this quarter! zbaum@aziro.com",
  },
  {
    icon: "🌟",
    title: "Celebrate a team milestone",
    prompt: "@Malik Boatwright — incredible teamwork on the product launch! boatwright@aziro.com",
  },
  {
    icon: "🤝",
    title: "Thank a client champion",
    prompt: "@Kenton Rue — thank you for being an amazing advocate. rkenton@aziro.com",
  },
  {
    icon: "🚀",
    title: "Highlight exceptional effort",
    prompt: "@Zackary Turcotte — went above and beyond to deliver on time. zturcotte@aziro.com",
  },
];

/** UI label and typed/sent phrase for submitting a card for PSP review — keep in sync everywhere */
export const SUBMIT_FOR_APPROVAL_LABEL = "Submit for approval";
export const SUBMIT_FOR_APPROVAL_COMMAND = "submit for approval";
export const APPROVAL_KEYWORDS = /\bsubmit for approval\b/i;

/** Product & Success Planning — reviews Customer Appreciation cards before send */
export const PSP_TEAM_LABEL = "Approval team";
export const PSP_TEAM_LONG_LABEL = "Product & Success Planning (PSP)";
export const PSP_APPROVAL_EXPLAINER =
  "Product & Success Planning reviews your card before send. You will be notified when it is approved, needs changes, or is declined.";
export const PSP_TEAM_DESCRIPTION = PSP_APPROVAL_EXPLAINER;
export const PSP_APPROVAL_HEADLINE = "Submitted for approval";

export const PREVIEW_COMMAND_CHIPS = [
  { label: "Blue background", command: "change background to blue" },
  { label: "Dark theme", command: "dark theme" },
  { label: "Green background", command: "make template background green" },
  { label: "Reset styles", command: "__reset_styles__" },
  { label: "Undo last style", command: "__undo_style__" },
];

/** @deprecated Use SUBMIT_FOR_APPROVAL_COMMAND */
export const SUBMIT_APPROVAL_COMMAND = SUBMIT_FOR_APPROVAL_COMMAND;
