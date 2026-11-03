import type { CheckStatus, EmailReport } from "@/lib/email-check";

const VERDICT_STYLES: Record<EmailReport["verdict"], { label: string; className: string }> = {
  deliverable: { label: "Deliverable", className: "bg-success/10 text-success" },
  risky: { label: "Risky", className: "bg-warning/15 text-warning" },
  undeliverable: { label: "Undeliverable", className: "bg-danger/10 text-danger" },
};

const STATUS_STYLES: Record<CheckStatus, { label: string; className: string }> = {
  pass: { label: "Pass", className: "bg-success" },
  warn: { label: "Warning", className: "bg-warning" },
  fail: { label: "Fail", className: "bg-danger" },
};

type ResultCardProps = {
  report: EmailReport;
  onApplySuggestion: (suggestion: string) => void;
};

export function ResultCard({ report, onApplySuggestion }: ResultCardProps) {
  const verdict = VERDICT_STYLES[report.verdict];

  return (
    <section
      aria-label="Check results"
      className="overflow-hidden rounded-xl border border-border bg-surface"
    >
      <header className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs uppercase tracking-wider text-muted">Result for</p>
          <p className="truncate font-mono text-base text-foreground">{report.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${verdict.className}`}>
            {verdict.label}
          </span>
          <span className="font-mono text-2xl font-semibold text-foreground">
            {report.score}
            <span className="text-sm text-muted">/100</span>
          </span>
        </div>
      </header>

      {report.suggestion && (
        <div className="flex flex-col gap-2 border-b border-border bg-warning/5 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground">
            Did you mean <span className="font-mono">{report.suggestion}</span>?
          </p>
          <button
            type="button"
            onClick={() => onApplySuggestion(report.suggestion!)}
            className="self-start rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-foreground/40"
          >
            Use suggestion
          </button>
        </div>
      )}

      <ul className="divide-y divide-border">
        {report.checks.map((check) => {
          const status = STATUS_STYLES[check.status];
          return (
            <li key={check.id} className="flex items-start gap-3 px-5 py-4">
              <span
                className={`mt-1.5 size-2.5 shrink-0 rounded-full ${status.className}`}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">
                  {check.label}
                  <span className="sr-only">: {status.label}</span>
                </p>
                <p className="text-sm text-muted">{check.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
