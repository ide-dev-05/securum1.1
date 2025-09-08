import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const token = await prisma.verificationToken.findFirst({
      where: { identifier: email, token: `FP-${code}` },
    });
    if (!token || (token.expires && token.expires < new Date())) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const hashedPassword = await hash(newPassword, 10);
    await prisma.user.update({ where: { email }, data: { hashedPassword } });

    // consume reset tokens
    await prisma.verificationToken.deleteMany({ where: { identifier: email, token: { startsWith: 'FP-' } } });

    return NextResponse.json({ ok: true, message: "Password has been reset" });
  } catch (err: any) {
    console.error("/api/auth/reset-password failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

