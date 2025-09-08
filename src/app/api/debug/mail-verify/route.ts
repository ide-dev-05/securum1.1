import { NextResponse } from "next/server";
import transporter from "../../../../lib/mail";

export const runtime = "nodejs";

export async function GET() {
  // Only expose in non-production for safety
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }
  try {
    const ok = await transporter.verify();
    return NextResponse.json({ ok: true, message: ok ? "SMTP server is ready" : "SMTP verify returned false" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

