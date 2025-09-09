import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
      const { data, error } = await supabase
        .from("posts_with_comments")
        .select("*");
  
      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json([], { status: 500 });
      }
  
      // Transform rows into posts with nested comments
      const postsMap: Record<string, any> = {};
  
      data?.forEach((row: any) => {
        if (!postsMap[row.post_id]) {
          postsMap[row.post_id] = {
            id: row.post_id,
            content: row.post_content,
            ups: row.up_count,
            upload_time: row.post_upload_time,
            user_name: row.user_name,
            user_email: row.user_email,
            user_image: row.user_image,
            comments: [],
          };
        }
  
        if (row.comment_id) {
          postsMap[row.post_id].comments.push({
            id: row.comment_id,
            content: row.comment_content,
            comment_time: row.comment_time,
            commenter_name: row.commenter_name,
            commenter_email: row.commenter_email,
            commenter_image: row.commenter_image,
          });
        }
      });
  
      const postsArray = Object.values(postsMap);
  
      return NextResponse.json(postsArray);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      return NextResponse.json([], { status: 500 });
    }
  }

  
export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { content, uploader } = body;
  
      if (!content || !uploader) {
        return NextResponse.json({ error: "Missing content or uploader" }, { status: 400 });
      }
  
      const { data, error } = await supabase
        .from("posts")
        .insert({
          content,
          uploader,
          upload_time: new Date().toISOString(),
          up_count: 0
        })
        .select()
        .single();
  
      if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
  
      return NextResponse.json({ message: "Post created", post: data });
    } catch (err: any) {
      console.error("Unexpected error:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
