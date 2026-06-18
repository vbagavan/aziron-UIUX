/** Org directory for hub / asset share pickers (prototype). */
export const HUB_SHARE_DIRECTORY = [
  ...[
    { name: "Sarah Chen", email: "sarah.chen@aziro.com" },
    { name: "Marcus Reid", email: "marcus.reid@aziro.com" },
    { name: "Priya Nair", email: "priya.nair@aziro.com" },
    { name: "Tom Alvarez", email: "tom.alvarez@aziro.com" },
    { name: "Lena Brooks", email: "lena.brooks@aziro.com" },
    { name: "Dev Patel", email: "dev.patel@aziro.com" },
    { name: "Mei Tan", email: "mei.tan@aziro.com" },
    { name: "Noah Kim", email: "noah.kim@aziro.com" },
  ].map((entry) => ({ ...entry, principalType: "user" })),
  ...[
    { name: "Platform Engineering", memberCount: 9 },
    { name: "Data Science", memberCount: 6 },
    { name: "Customer Success", memberCount: 11 },
    { name: "Marketing Ops", memberCount: 5 },
    { name: "Security", memberCount: 4 },
  ].map((entry) => ({ ...entry, principalType: "team" })),
  ...[
    { name: "Engineering", memberCount: 48 },
    { name: "Operations", memberCount: 22 },
    { name: "Revenue", memberCount: 31 },
    { name: "People", memberCount: 14 },
  ].map((entry) => ({ ...entry, principalType: "department" })),
];

export function sharePrincipalInitials(name) {
  return (name ?? "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
