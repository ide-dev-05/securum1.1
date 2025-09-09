import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const rawName = body?.name;
    if (typeof rawName !== "string" || rawName.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const name = rawName.trim();

    const where = session.user.id
      ? { id: session.user.id as string }
      : session.user.email
      ? { email: session.user.email as string }
      : null;

    if (!where) {
      return NextResponse.json({ error: "Session missing user identifier" }, { status: 400 });
    }

    // Helper: retry once if PgBouncer prepared statement error occurs
    const isPgBouncerPsError = (err: any) => {
      const msg = String(err?.message || "").toLowerCase();
      return err?.code === "26000" || msg.includes("prepared statement") && msg.includes("does not exist");
    };
    const withRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (e: any) {
        if (isPgBouncerPsError(e)) {
          try { await prisma.$disconnect(); await prisma.$connect(); } catch {}
          return await fn();
        }
        throw e;
      }
    };

    // Ensure user exists first for clearer errors
    const existing = await withRetry(() => prisma.user.findUnique({ where: where as any }));
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await withRetry(() => prisma.user.update({ where: where as any, data: { name } }));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("/api/user/update failed:", e?.code || e?.name || e, e?.message);
    const msg =
      typeof e?.message === "string" && process.env.NODE_ENV !== "production"
        ? e.message
        : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
