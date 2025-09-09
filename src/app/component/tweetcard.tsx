"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, Repeat2, MessageCircle, Share2, Check, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface Comment {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  text: string;
}

interface Post {
  ups?: number;
  comments?: Comment[];
  retweets?: number;
  avatar: string;
  name: string;
  verified?: boolean;
  username: string;
  time: string;
  text: string;
}

export default function TweetCard({ post }: { post: Post }) {
  const [ups, setUps] = useState(post.ups || 0);
  const [comments, setComments] = useState(Array.isArray(post.comments) ? post.comments : []);
  const [retweets, setRetweets] = useState(post.retweets || 0);
  const [isUpped, setIsUpped] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const handleUp = () => {
    setIsUpped(!isUpped);
    setUps((prev) => (isUpped ? prev - 1 : prev + 1));
  };

  const handleComment = () => {
    if (!newComment.trim()) return;

    const commentObj: Comment = {
      id: comments.length + 1,
      name: "You",
      username: "@you",
      avatar: "",
      text: newComment,
    };

    setComments((prev) => [commentObj, ...prev]);
    setNewComment("");
  };

  const handleRetweet = () => setRetweets((prev) => prev + 1);

  const handleEdit = () => {
    console.log("Edit post", post);
    // Add your edit logic here
  };

  const handleDelete = () => {
    console.log("Delete post", post);
    // Add your delete logic here
  };

  return (
    <Card className="w-full max-w-full rounded-2xl border border-gray-700 text-gray-200 shadow-md dark:bg-[#0f172a] relative">
      <CardContent className="">
        <div className="flex items-start gap-3 w-full">
          <Avatar className="mt-1 flex-shrink-0">
            <AvatarImage src={post.avatar} />
            <AvatarFallback>{post.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm sm:text-base">{post.name}</span>
                {post.verified && <Check className="h-4 w-4 text-sky-500 flex-shrink-0" strokeWidth={3} />}
                <span className="text-gray-400 text-xs sm:text-sm">{post.username}</span>
                <span className="text-gray-400 text-xs sm:text-sm">·</span>
                <span className="text-gray-400 text-xs sm:text-sm">{post.time}</span>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400 p-1 h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1 bg-gray-900 border-gray-700">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm px-2 py-1.5" onClick={handleEdit}>
                    Edit 
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-red-500 text-sm px-2 py-1.5" onClick={handleDelete}>
                    Delete 
                  </Button>
                </PopoverContent>
              </Popover>
            </div>

            <p className="mt-1 text-sm text-gray-200">{post.text}</p>
            <div className="mt-2 flex gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <ArrowUp className="h-4 w-4 text-sky-500" /> {ups}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-blue-400" /> {comments.length}
              </span>
              <span className="flex items-center gap-1">
                <Repeat2 className="h-4 w-4 text-green-400" /> {retweets}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-3">
          <Button variant="ghost" size="sm" onClick={handleUp} className={`flex items-center gap-1 text-gray-400 hover:text-sky-500 ${isUpped ? "text-sky-500" : ""}`}>
            <ArrowUp className={`h-4 w-4 ${isUpped ? "fill-sky-500 text-sky-500" : ""}`} /> Up
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setIsCommentOpen(true)} className="flex items-center gap-1 text-gray-400 hover:text-blue-400">
            <MessageCircle className="h-4 w-4" /> Comment
          </Button>

          <Button variant="ghost" size="sm" onClick={handleRetweet} className="flex items-center gap-1 text-gray-400 hover:text-green-400">
            <Repeat2 className="h-4 w-4" /> Retweet
          </Button>

          <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-400 hover:text-sky-400">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </CardContent>

      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent className="rounded-lg w-full max-w-md bg-gray-900 border-gray-700 text-gray-200">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Comments</DialogTitle>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto mb-4 pr-2">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 mb-4 p-2 rounded-lg bg-gray-800">
                  <Avatar className="flex-shrink-0 h-8 w-8">
                    {comment.avatar ? <AvatarImage src={comment.avatar} /> : <AvatarFallback>{comment.name[0]}</AvatarFallback>}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{comment.name}</span>
                      <span className="text-gray-400 text-xs">{comment.username}</span>
                    </div>
                    <p className="text-sm text-gray-200 break-words">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3">
            <textarea
              className="w-full h-24 p-3 border border-gray-700 rounded-md bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <DialogFooter>
              <Button 
                onClick={handleComment} 
                disabled={!newComment.trim()}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post Comment
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}