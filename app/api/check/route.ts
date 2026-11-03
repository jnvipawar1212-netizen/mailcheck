import { checkEmail } from "@/lib/email-check";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email =
    body && typeof body === "object" && "email" in body
      ? (body as { email: unknown }).email
      : undefined;

  if (typeof email !== "string" || email.trim().length === 0 || email.length > 320) {
    return Response.json({ error: "Provide an email address to check." }, { status: 400 });
  }

  const report = await checkEmail(email);
  return Response.json(report);
}
