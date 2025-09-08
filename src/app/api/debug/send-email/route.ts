import { NextResponse } from "next/server";
import { sendEmail } from "../../../../lib/mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }
  try {
    const { to, subject, text, html } = await req.json();
    if (!to) return NextResponse.json({ error: "Missing 'to'" }, { status: 400 });
    const info = await sendEmail(to, subject || "Test email", text || "Hello from debug endpoint", html);
    return NextResponse.json({ ok: true, info });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

