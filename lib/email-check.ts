import { resolveMx } from "node:dns/promises";

export type CheckStatus = "pass" | "warn" | "fail";

export type Check = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
};

export type EmailReport = {
  email: string;
  verdict: "deliverable" | "risky" | "undeliverable";
  score: number;
  suggestion: string | null;
  checks: Check[];
};

const EMAIL_PATTERN =
  /^(?!\.)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}(?<!\.)@(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

const COMMON_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "live.com",
  "msn.com",
  "me.com",
  "gmx.com",
  "yandex.com",
  "zoho.com",
  "mail.com",
];

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.com",
  "temp-mail.org",
  "trashmail.com",
  "yopmail.com",
  "throwawaymail.com",
  "getnada.com",
  "dispostable.com",
  "sharklasers.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mintemail.com",
]);

const ROLE_PREFIXES = new Set([
  "admin",
  "info",
  "support",
  "sales",
  "contact",
  "help",
  "noreply",
  "no-reply",
  "postmaster",
  "webmaster",
  "billing",
  "office",
  "team",
  "hello",
]);

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return row[b.length];
}

function suggestDomain(domain: string): string | null {
  if (COMMON_DOMAINS.includes(domain)) return null;
  let best: { domain: string; distance: number } | null = null;
  for (const candidate of COMMON_DOMAINS) {
    const distance = levenshtein(domain, candidate);
    if (distance <= 2 && (!best || distance < best.distance)) {
      best = { domain: candidate, distance };
    }
  }
  return best?.domain ?? null;
}

async function lookupMx(domain: string): Promise<string[] | null> {
  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 4000),
      ),
    ]);
    return records
      .sort((a, b) => a.priority - b.priority)
      .map((record) => record.exchange)
      .filter(Boolean);
  } catch {
    return null;
  }
}

export async function checkEmail(rawEmail: string): Promise<EmailReport> {
  const email = rawEmail.trim();
  const checks: Check[] = [];
  const syntaxValid = EMAIL_PATTERN.test(email);

  checks.push({
    id: "syntax",
    label: "Syntax",
    status: syntaxValid ? "pass" : "fail",
    detail: syntaxValid
      ? "Address follows the RFC 5322 format."
      : "Address is not formatted like a valid email.",
  });

  if (!syntaxValid) {
    return { email, verdict: "undeliverable", score: 0, suggestion: null, checks };
  }

  const [localPart, rawDomain] = email.split("@");
  const domain = rawDomain.toLowerCase();
  const suggestedDomain = suggestDomain(domain);
  const suggestion = suggestedDomain ? `${localPart}@${suggestedDomain}` : null;

  checks.push({
    id: "typo",
    label: "Domain typo",
    status: suggestion ? "warn" : "pass",
    detail: suggestion
      ? `Looks like a typo. Did you mean ${suggestedDomain}?`
      : "No common domain misspelling detected.",
  });

  const disposable = DISPOSABLE_DOMAINS.has(domain);
  checks.push({
    id: "disposable",
    label: "Disposable provider",
    status: disposable ? "fail" : "pass",
    detail: disposable
      ? "This domain issues temporary, throwaway inboxes."
      : "Not a known disposable email provider.",
  });

  const role = ROLE_PREFIXES.has(localPart.toLowerCase());
  checks.push({
    id: "role",
    label: "Role account",
    status: role ? "warn" : "pass",
    detail: role
      ? "Shared role inbox; often reaches a team, not a person."
      : "Appears to be a personal mailbox.",
  });

  const mx = await lookupMx(domain);
  const hasMx = Boolean(mx && mx.length > 0);
  checks.push({
    id: "mx",
    label: "Mail server (MX)",
    status: hasMx ? "pass" : "fail",
    detail: hasMx
      ? `Accepts mail via ${mx![0]}${mx!.length > 1 ? ` and ${mx!.length - 1} more` : ""}.`
      : "No mail server found for this domain.",
  });

  const weights: Record<string, number> = { typo: 15, disposable: 30, role: 10, mx: 45 };
  let score = 100;
  for (const check of checks) {
    const weight = weights[check.id] ?? 0;
    if (check.status === "fail") score -= weight;
    if (check.status === "warn") score -= Math.round(weight * 0.6);
  }
  score = Math.max(0, score);

  const verdict: EmailReport["verdict"] =
    !hasMx ? "undeliverable" : disposable || score < 80 ? "risky" : "deliverable";

  return { email, verdict, score, suggestion, checks };
}
