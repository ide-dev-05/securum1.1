import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { resetCodeEmail } from "@/lib/emailTemplates";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    // Avoid user enumeration: respond success regardless, but only send if user exists
    if (user) {
      const code = generateCode();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await prisma.verificationToken.deleteMany({ where: { identifier: email, token: { startsWith: 'FP-' } } });
      await prisma.verificationToken.create({
        data: { identifier: email, token: `FP-${code}`, expires },
      });
      try {
        const tpl = resetCodeEmail({ code, minutes: 10 });
        await sendEmail(email, tpl.subject, tpl.text, tpl.html);
      } catch (e) {
        console.warn("Forgot password email failed:", e);
      }
    }
    return NextResponse.json({ ok: true, message: "If the email exists, a code has been sent." });
  } catch (err: any) {
    console.error("/api/auth/forgot-password failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

