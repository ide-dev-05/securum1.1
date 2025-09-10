"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import TweetCard from "../component/tweetcard";
import Articles from "../component/articles";
import { Skeleton } from "@/components/ui/skeleton";
import Post from "../component/post";

export default function SecurumWorld() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch("/api/posts");
        const data = await res.json();
        // Sort posts by up_count descending
        data.sort((a: any, b: any) => (b.ups || 0) - (a.ups || 0));
        setPosts(data);
      } catch (err) {
        console.error("Failed to load posts:", err);
      }
    }
    loadPosts();
  }, []);

  function TweetCardSkeleton() {
    return (
      <div className="w-full max-w-xl border rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <section className="min-h-screen grid grid-cols-4 gap-2 p-4">
      <div className="col-span-1">
        <Link href="/" className="hover:underline m-2 text-sky-300">Back to Chat</Link>
        <Articles />
      </div>

      <div className="col-span-2 flex flex-col items-center gap-4">
        {posts.length === 0 ? (
          
          <>
          <p className="text-gray-500">Loading...</p>
            <TweetCardSkeleton />
            <TweetCardSkeleton />
            <TweetCardSkeleton />
          </>
        ) : (
          posts.map((post) => (
            <TweetCard
              key={post.id}
              post={{
                id: post.id,
                name: post.user_name || "Unknown",
                username: post.user_email
                  ? `@${post.user_email.split("@")[0]}`
                  : "@unknown",
                avatar: post.user_image || "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg",
                verified: true,
                time: new Date(post.upload_time).toLocaleString(),
                text: post.content,
                ups: post.ups,
                retweets: 0,
                comments: (post.comments || []).map((c: any) => ({
                  id: c.id,
                  name: c.commenter_name || "Anonymous",
                  username: c.commenter_email
                    ? `@${c.commenter_email.split("@")[0]}`
                    : "@unknown",
                  avatar: c.commenter_image || "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg",
                  text: c.content,
                })),
              }}
            />
          ))
          
        )}
      </div>

      <div className="col-span-1">
        <Post />
      </div>
    </section>
  );
}
