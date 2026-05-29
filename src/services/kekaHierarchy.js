/**
 * Mock Keka HR hierarchy — reporting managers for appreciation CC.
 * Replace with Keka API (employee → reportingManager) in production.
 */

const KEKA_MANAGER_BY_EMPLOYEE_EMAIL = {
  "zbaum@aziro.com": {
    name: "Malik Boatwright",
    email: "boatwright@aziro.com",
    title: "Reporting Manager",
  },
  "rkenton@aziro.com": {
    name: "Balachandra Husaine",
    email: "bhusaine@aziro.com",
    title: "Reporting Manager",
  },
  "zturcotte@aziro.com": {
    name: "Malik Boatwright",
    email: "boatwright@aziro.com",
    title: "Reporting Manager",
  },
  "strantow@aziro.com": {
    name: "Crystel Bayer",
    email: "bcrystel@aziro.com",
    title: "Reporting Manager",
  },
  "jheaney@aziro.com": {
    name: "Balachandra Husaine",
    email: "bhusaine@aziro.com",
    title: "Reporting Manager",
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string[]} recipientEmails — To addresses (appreciated employees)
 * @returns {Promise<Array<{ name: string, email: string, title?: string }>>}
 */
export async function fetchKekaHierarchyForRecipients(recipientEmails = []) {
  await delay(500);

  const managers = new Map();
  const toLower = recipientEmails.map((e) => e.toLowerCase());

  for (const email of toLower) {
    const manager = KEKA_MANAGER_BY_EMPLOYEE_EMAIL[email];
    if (!manager) continue;
    if (toLower.includes(manager.email.toLowerCase())) continue;
    managers.set(manager.email.toLowerCase(), manager);
  }

  return Array.from(managers.values());
}
