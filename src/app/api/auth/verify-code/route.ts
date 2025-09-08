import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body || {};
    if (!email || !code) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check verification token
    const token = await prisma.verificationToken.findFirst({
      where: { identifier: email, token: `VER-${code}` },
    });
    if (!token) return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    if (token.expires && token.expires < new Date()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
    // Consume token
    await prisma.verificationToken.deleteMany({ where: { identifier: email, token: { startsWith: 'VER-' } } });

    return NextResponse.json({ ok: true, message: "Account verified" });
  } catch (err: any) {
    console.error("/api/auth/verify-code failed:", err);
    const devMessage = typeof err?.message === "string" ? err.message : undefined;
    return NextResponse.json(
      { error: "Server error", message: process.env.NODE_ENV !== "production" ? devMessage : undefined },
      { status: 500 }
    );
  }
}
