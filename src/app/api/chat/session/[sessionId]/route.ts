import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  const sessionId = params.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const idValue: any = Number.isFinite(Number(sessionId)) ? Number(sessionId) : sessionId;
    // Best-effort: remove dependent rows first if they exist
    // Try common tables: chat_messages, messages. Ignore if table doesn't exist.
    const tryDelete = async (table: string) => {
      const { error } = await supabase.from(table).delete().eq("session_id", idValue);
      if (error) {
        // If relation doesn't exist (Postgres code 42P01), ignore; otherwise log.
        const code = (error as any)?.code;
        if (code !== "42P01") {
          console.warn(`Delete from ${table} failed:`, error);
        }
      }
    };

    await tryDelete("chat_messages");
    await tryDelete("messages");

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", idValue);

    if (error) {
      const code = (error as any)?.code;
      // If invalid input or table mismatch, treat as no-op success.
      if (code === "22P02" || code === "42P01" || code === "42703") {
        console.warn("Delete treated as success due to code:", code);
        return NextResponse.json({ success: true, noOp: true });
      }
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected delete error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
