"use client";

import { useState, type FormEvent } from "react";
import type { EmailReport } from "@/lib/email-check";
import { ResultCard } from "@/components/result-card";

export function EmailChecker() {
  const [email, setEmail] = useState("");
  const [report, setReport] = useState<EmailReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function runCheck(address: string) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address }),
      });
      const data = await response.json();
      if (!response.ok) {
        setReport(null);
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setReport(data as EmailReport);
    } catch {
      setError("Could not reach the checker. Try again.");
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) runCheck(email);
  }

  function applySuggestion(suggestion: string) {
    setEmail(suggestion);
    runCheck(suggestion);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 flex-1 rounded-lg border border-border bg-surface px-4 font-mono text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
        <button
          type="submit"
          disabled={pending || !email.trim()}
          className="h-12 rounded-lg bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Checking..." : "Check email"}
        </button>
      </form>

      <div aria-live="polite">
        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        {report && !error && (
          <ResultCard report={report} onApplySuggestion={applySuggestion} />
        )}
      </div>
    </div>
  );
}
