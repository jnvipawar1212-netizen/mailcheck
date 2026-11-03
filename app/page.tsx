import { EmailChecker } from "@/components/email-checker";

const FEATURES = [
  { title: "Syntax", body: "Validates the address against the RFC 5322 format." },
  { title: "Mail servers", body: "Looks up live MX records for the domain." },
  { title: "Typos", body: "Catches misspelled providers like gmial.com." },
  { title: "Disposable & role", body: "Flags throwaway inboxes and shared accounts." },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-5 py-16 sm:py-24">
      <div className="flex w-full max-w-2xl flex-col gap-12">
        <header className="flex flex-col gap-4">
          <p className="font-mono text-sm text-accent">mailcheck</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Know if an email will land before you hit send.
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-muted">
            Paste any address to check its format, mail servers, and common red flags in seconds.
          </p>
        </header>

        <EmailChecker />

        <section aria-labelledby="features-heading" className="flex flex-col gap-4">
          <h2 id="features-heading" className="text-sm font-medium uppercase tracking-wider text-muted">
            What we check
          </h2>
          <ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex flex-col gap-1 bg-background p-5">
                <p className="font-medium text-foreground">{feature.title}</p>
                <p className="text-sm leading-relaxed text-muted">{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
