import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function isMissingScoresColumn(err: any) {
  const msg = String(err?.message || "").toLowerCase();
  // Prisma may throw a known error code or a raw driver error message
  return (
    err?.code === "P2022" || // Column does not exist
    err?.code === "P2009" ||
    msg.includes("scores") && (msg.includes("column") || msg.includes("does not exist") || msg.includes("unknown"))
  );
}

function isMissingUsersTableOrSchema(err: any) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    err?.code === "P2021" || // Table does not exist
    err?.code === "P2026" || // Schema does not exist
    msg.includes("relation \"users\" does not exist") ||
    msg.includes("relation 'users' does not exist") ||
    msg.includes("table \"users\" does not exist") ||
    msg.includes("schema \"next_auth\" does not exist")
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const userData = await prisma.user.findUnique({
        where: session.user.id ? { id: session.user.id } : { email: session.user.email! },
        select: { scores: true },
      });

      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const value = typeof userData.scores === "number" ? userData.scores : 0;
      return NextResponse.json({ scores: value });
    } catch (innerErr: any) {
      if (isMissingScoresColumn(innerErr) || isMissingUsersTableOrSchema(innerErr)) {
        // Graceful fallback when DB has no `scores` column yet
        return NextResponse.json({ scores: 0 });
      }
      throw innerErr;
    }
  } catch (error: any) {
    console.error("Full error:", error);
    return NextResponse.json(
      {
        error: "Database operation failed",
        details: error.message,
        code: error.code,
        meta: error.meta
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gainedScore } = await req.json();

    if (typeof gainedScore !== "number") {
      return NextResponse.json(
        { error: "Invalid score value" },
        { status: 400 }
      );
    }

    try {
      // Get current score
      const current = await prisma.user.findUnique({
        where: session.user.id ? { id: session.user.id } : { email: session.user.email! },
        select: { scores: true }
      });

      if (!current) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const base = typeof current.scores === "number" ? current.scores : 0;

      // Update score
      const updated = await prisma.user.update({
        where: session.user.id ? { id: session.user.id } : { email: session.user.email! },
        data: { scores: base + gainedScore },
        select: { scores: true }
      });

      return NextResponse.json(updated);
    } catch (innerErr: any) {
      if (isMissingScoresColumn(innerErr) || isMissingUsersTableOrSchema(innerErr)) {
        // If scores column is missing, acknowledge without failing hard
        return NextResponse.json(
          { scores: 0, notice: "Scores not enabled in DB schema." },
          { status: 200 }
        );
      }
      throw innerErr;
    }
  } catch (error: any) {
    console.error("Error updating score:", error);
    return NextResponse.json(
      {
        error: "Failed to update score",
        details: error.message
      },
      { status: 500 }
    );
  }
}
