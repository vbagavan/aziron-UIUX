import {
  FileText,
  Mail,
  Database,
  FolderOpen,
  Terminal,
  Link2,
  Zap,
  Activity,
  BarChart3,
  Wrench,
} from "lucide-react";

/**
 * Platform tool catalog metadata (categories span the full library; `tools` may be a subset).
 */
export const AGENT_TOOLS_METADATA = {
  total_tools: 45,
  categories: [
    "data",
    "filesystem",
    "communication",
    "database",
    "project",
    "system",
    "atlassian",
    "aws_cli",
    "observability",
    "analytics",
  ],
};

const CATEGORY_LABELS = {
  data: "Data",
  filesystem: "Filesystem",
  communication: "Communication",
  database: "Database",
  project: "Project",
  system: "System",
  atlassian: "Atlassian",
  aws_cli: "AWS CLI",
  observability: "Observability",
  analytics: "Analytics",
};

const CATEGORY_ICONS = {
  data: Database,
  filesystem: FileText,
  communication: Mail,
  database: Database,
  project: FolderOpen,
  system: Terminal,
  atlassian: Link2,
  aws_cli: Zap,
  observability: Activity,
  analytics: BarChart3,
};

/** Raw catalog entries (subset of the full 45-tool library). */
export const AGENT_TOOLS_RAW = [
  {
    name: "aggregate_csv",
    category: "data",
    source: "internal",
    description: "Perform aggregation operations on CSV data",
    required_fields: ["input_file", "output_file", "aggregations"],
  },
  {
    name: "google_calendar",
    category: "communication",
    source: "internal",
    description: "Manage Google Calendar events and schedules",
    required_fields: ["action"],
  },
  {
    name: "google_drive",
    category: "communication",
    source: "internal",
    description: "Manage Google Drive files and folders",
    required_fields: ["action"],
  },
  {
    name: "sqlite_database",
    category: "database",
    source: "internal",
    description: "Perform SQLite database operations",
    required_fields: ["operation", "user_id"],
  },
  {
    name: "execute_local_command",
    category: "system",
    source: "external",
    description: "Execute shell commands locally",
    required_fields: ["command"],
  },
  {
    name: "execute_remote_command",
    category: "system",
    source: "external",
    description: "Execute shell commands remotely using SSH",
    required_fields: ["command", "ssh_config"],
  },
  {
    name: "aws_cli_execute",
    category: "aws_cli",
    source: "external",
    description: "Run AWS CLI commands",
    required_fields: ["user_id", "aws_region", "command"],
  },
  {
    name: "atlassian_jira_create_issue",
    category: "atlassian",
    source: "external",
    description: "Create Jira issues",
    required_fields: ["user_id", "project_key", "summary", "issue_type"],
  },
  {
    name: "atlassian_jira_search",
    category: "atlassian",
    source: "external",
    description: "Search Jira issues using JQL",
    required_fields: ["user_id", "jql"],
  },
  {
    name: "process_pptx",
    category: "data",
    source: "internal",
    description: "Extract and analyze PowerPoint content",
    required_fields: ["file_path"],
  },
];

const ACRONYMS = new Set(["csv", "pptx", "sql", "aws", "cli", "ssh", "jql", "api"]);

function humanizeToolName(snakeName) {
  return snakeName
    .split("_")
    .map(part => {
      const lower = part.toLowerCase();
      if (lower === "sqlite") return "SQLite";
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Tools shaped for Create Agent UI (grid, modals, attached list).
 */
export const TOOLS = AGENT_TOOLS_RAW.map(t => ({
  id: t.name,
  name: humanizeToolName(t.name),
  description: t.description,
  category: CATEGORY_LABELS[t.category] ?? humanizeToolName(t.category),
  source: t.source,
  requiredFields: t.required_fields,
  icon: CATEGORY_ICONS[t.category] ?? Wrench,
}));
