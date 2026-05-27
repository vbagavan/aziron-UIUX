import { USERS } from "@/components/features/kudos/constants";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const MENTION_RE = /@[A-Za-z][A-Za-z\s.'-]{1,40}/g;

export function extractEmailsFromText(text) {
  const matches = text.match(EMAIL_RE) ?? [];
  return [...new Set(matches.map((e) => e.toLowerCase()))];
}

/** Appreciation copy with emails and @mentions stripped (for NLP from chat). */
export function extractAppreciationMessageFromPrompt(text) {
  if (!text?.trim()) return "";
  let t = text.replace(/^\/kudos\s*/i, "").trim();
  t = t.replace(EMAIL_RE, " ");
  t = t.replace(MENTION_RE, " ");
  return t.replace(/\s+/g, " ").trim();
}

export function resolveRecipientsFromEmails(emails) {
  return emails.map((email) => {
    const user = USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) return { name: user.name, color: user.color, email: user.email };
    const local = email.split("@")[0];
    const name = local.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { name, color: "var(--primary)", email };
  });
}

export function parseMentionNames(text) {
  const names = [];
  const re = /@([A-Za-z][A-Za-z\s.'-]{1,40})/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1].trim();
    const user = USERS.find((u) => u.name.toLowerCase().startsWith(raw.toLowerCase()));
    if (user && !names.find((n) => n.name === user.name)) {
      names.push({ name: user.name, color: user.color, email: user.email });
    }
  }
  return names;
}

/**
 * Returns the active @-mention being typed, or null if not in mention mode.
 * Ignores @ inside email addresses (e.g. user@company.com).
 */
export function getActiveMention(text) {
  if (!text) return null;
  const atIdx = text.lastIndexOf("@");
  if (atIdx === -1) return null;
  if (atIdx > 0 && !/\s/.test(text[atIdx - 1])) return null;
  const query = text.slice(atIdx + 1);
  if (/[\s\n]/.test(query)) return null;
  return { atIdx, query };
}

export function mergeRecipientSources({ emails, mentions, existing = [] }) {
  const byEmail = new Map();
  [...existing, ...mentions, ...resolveRecipientsFromEmails(emails)].forEach((r) => {
    const key = r.email?.toLowerCase() ?? r.name;
    if (!byEmail.has(key)) byEmail.set(key, r);
  });
  return [...byEmail.values()];
}
