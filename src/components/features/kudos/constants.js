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

export const DEFAULT_RECIPIENTS = [
  { name: "Balachandra Husaine", color: "var(--info)" },
  { name: "Sridhar", color: "var(--success)" },
];

export const TEMPLATES = [
  { id: "gold-classic", label: "Gold Classic", thumbBg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", thumbAccent: "var(--warning)" },
  { id: "blue-morden", label: "Blue Modern", thumbBg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", thumbAccent: "var(--primary)" },
  { id: "green", label: "Green Nature", thumbBg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", thumbAccent: "var(--success)" },
  { id: "purple-elegant", label: "Purple Elegant", thumbBg: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)", thumbAccent: "var(--chart-chart-4)" },
];

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
  subtitle: "On Being Appreciated By the Customer",
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

export const DEFAULT_COMPOSE = {
  message: "",
  emailTo: [],
  emailCc: [],
  toInput: "",
  ccInput: "",
  category: "customer-service",
  recognitionType: "individual",
  occasion: "",
};

export const KUDOS_SUGGESTIONS = [
  {
    icon: "🏆",
    title: "Recognise outstanding service",
    prompt: "/kudos @  — outstanding customer service this quarter!",
  },
  {
    icon: "🌟",
    title: "Celebrate a team milestone",
    prompt: "/kudos @  — incredible teamwork on the product launch!",
  },
  {
    icon: "🤝",
    title: "Thank a client champion",
    prompt: "/kudos @  — thank you for being an amazing advocate for our product.",
  },
  {
    icon: "🚀",
    title: "Highlight exceptional effort",
    prompt: "/kudos @  — went above and beyond to deliver results on time.",
  },
];

export const APPROVAL_KEYWORDS = /\b(request approval|send approval|send for approval|approve|submit for approval)\b/i;

/** Product Policy & Planning — approves kudos before send */
export const PSP_TEAM_LABEL = "PSP team";
export const PSP_TEAM_DESCRIPTION =
  "Product & Success Planning reviews your card before it is sent to recipients.";

export const PREVIEW_COMMAND_CHIPS = [
  { label: "Blue background", command: "change background to blue" },
  { label: "Dark theme", command: "dark theme" },
  { label: "Green background", command: "make template background green" },
  { label: "Reset styles", command: "__reset_styles__" },
  { label: "Undo last style", command: "__undo_style__" },
];

export const SUBMIT_APPROVAL_COMMAND = "send approval";
