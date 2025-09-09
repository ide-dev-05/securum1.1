"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

const mockArticles = [
  {
    id: 1,
    title: "Breaking News: AI Revolutionizes Tech Industry",
    description: "Artificial Intelligence is changing the way we work, live, and interact with technology every day.",
    author: "John Doe",
    avatar: "https://i.pravatar.cc/40?img=5",
    time: "2h ago",
  },
  {
    id: 2,
    title: "Health Tips for 2025: Staying Fit in a Busy World",
    description: "Learn how to balance work and life while keeping yourself healthy with these practical tips.",
    author: "Alice Smith",
    avatar: "https://i.pravatar.cc/40?img=6",
    time: "4h ago",
  },
  {
    id: 3,
    title: "Travel Guide: Top Destinations to Visit This Summer",
    description: "Explore the most amazing places this summer and make unforgettable memories.",
    author: "Bob Johnson",
    avatar: "https://i.pravatar.cc/40?img=7",
    time: "1d ago",
  },
  {
    id: 4,
    title: "Economy Update: Stock Markets Today",
    description: "Global stock markets showed mixed results as investors weigh new economic data.",
    author: "Mark Lee",
    avatar: "https://i.pravatar.cc/40?img=8",
    time: "3h ago",
  },
  {
    id: 5,
    title: "Sports Highlights: Football Finals Recap",
    description: "A thrilling game ended with an unexpected victory in the final minutes.",
    author: "Emma Watson",
    avatar: "https://i.pravatar.cc/40?img=9",
    time: "5h ago",
  },
];

export default function Articles() {
  return (
    <div className="p-4 md:p-6 flex flex-col h-screen max-h-[1000px] bg-gray-900 rounded-lg">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-gray-900 pb-4 pt-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-200">
          Latest Articles
        </h1>
      </div>

      {/* Scrollable articles with custom scrollbar */}
      <div className="flex flex-col gap-4 md:gap-6 overflow-y-auto flex-1 pr-1 py-2 custom-scrollbar">
        {mockArticles.map((article) => (
          <Card
            key={article.id}
            className="bg-[#0f172a] border border-gray-700 rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 hover:border-sky-400/30 hover:-translate-y-0.5"
          >
            <CardHeader className="flex flex-col gap-2 pb-3">
              <CardTitle className="text-lg md:text-xl text-gray-200 line-clamp-1">
                {article.title}
              </CardTitle>
              <CardDescription className="text-gray-400 line-clamp-2">
                {article.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex items-center justify-between pt-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarImage src={article.avatar} />
                  <AvatarFallback className="text-xs">
                    {article.author[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-gray-200 font-medium text-sm md:text-base">
                    {article.author}
                  </span>
                  <span className="text-gray-400 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {article.time}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-sky-400 border-sky-400 hover:bg-sky-500 hover:text-white text-xs md:text-sm"
              >
                Read More
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.8);
        }
      `}</style>
    </div>
  );
}