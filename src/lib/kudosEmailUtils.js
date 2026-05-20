import { USERS } from "@/components/features/kudos/constants";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function extractEmailsFromText(text) {
  const matches = text.match(EMAIL_RE) ?? [];
  return [...new Set(matches.map((e) => e.toLowerCase()))];
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

export function mergeRecipientSources({ emails, mentions, existing = [] }) {
  const byEmail = new Map();
  [...existing, ...mentions, ...resolveRecipientsFromEmails(emails)].forEach((r) => {
    const key = r.email?.toLowerCase() ?? r.name;
    if (!byEmail.has(key)) byEmail.set(key, r);
  });
  return [...byEmail.values()];
}
