import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { prisma } from "../../../../lib/prisma";
import { sendEmail } from "../../../../lib/mail";
import bcrypt from "bcryptjs";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const code = generateCode();

    await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });

    // Store verification code in VerificationToken table (avoids client schema mismatch)
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.verificationToken.create({
      data: { identifier: email, token: `VER-${code}`, expires: expiry },
    });

    try {
      await sendEmail(
        email,
        "Confirm your account",
        `Your confirmation code is ${code}`,
        `<p>Your confirmation code is <strong>${code}</strong></p>`
      );
    } catch (e) {
      // If email is not configured, still respond OK so user can test locally
      console.warn("Email send failed (check MAIL_* env):", e);
    }

    return NextResponse.json({
      ok: true,
      message: "Confirmation code sent",
    });
  } catch (err: any) {
    console.error("/api/auth/register failed:", err);
    const code = err?.code || err?.name;
    if (code === "P2002") {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    // Surface more detail in development to help debugging
    const devMessage = typeof err?.message === "string" ? err.message : undefined;
    return NextResponse.json(
      { error: "Server error", message: process.env.NODE_ENV !== "production" ? devMessage : undefined },
      { status: 500 }
    );
  }
}
