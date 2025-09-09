"use client";

import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Post() {
  const [text, setText] = useState("");
  const maxChars = 280;

  const handlePost = () => {
    if (!text.trim()) return;
    console.log("New Post:", text);
    setText(""); 
  };

  return (
    <div className="bg-[#15202b] border border-gray-700 rounded-2xl p-6 shadow-lg w-full max-w-2xl mx-auto">
      <div className="flex gap-4">

        <div className="flex-shrink-0">
          <Avatar className="h-14 w-14 ring-2 ring-sky-500/20">
            <AvatarImage src="https://i.pravatar.cc/150?img=12" />
            <AvatarFallback className="bg-sky-600 text-white font-semibold">JD</AvatarFallback>
          </Avatar>
        </div>

       
        <div className="flex-1">
          <textarea
            rows={4}
            placeholder="What's happening?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-none bg-transparent border-none focus:outline-none text-lg text-gray-100 placeholder:text-gray-500 w-full min-h-[140px] leading-relaxed"
          />
          
        
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
            <div className={`text-sm ${text.length > maxChars - 20 ? 'text-amber-500' : 'text-gray-500'} ${text.length > maxChars ? 'text-red-500 font-medium' : ''}`}>
              {text.length > 0 && `${maxChars - text.length} characters left`}
            </div>
            
            <Button
              onClick={handlePost}
              disabled={!text.trim() || text.length > maxChars}
              className="bg-sky-500 hover:bg-sky-600 disabled:bg-gray-600 disabled:text-gray-400 text-white px-6 py-2 rounded-full font-semibold transition-colors"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}