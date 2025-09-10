"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

const mockArticles = [
  {
    id: 1,
    title: "Ransomware on the Rise: How Companies Can Defend Themselves",
    description:
      "Cybercriminals are increasingly targeting businesses with ransomware. Learn the latest defense strategies to stay secure.",
    author: "Sarah Mitchell",
    avatar: "https://i.pravatar.cc/40?img=12",
    time: "1h ago",
  },
  {
    id: 2,
    title: "AI in Cybersecurity: Friend or Foe?",
    description:
      "Artificial Intelligence is transforming cybersecurity—both for defenders and attackers. Here's what you need to know.",
    author: "David Kim",
    avatar: "https://i.pravatar.cc/40?img=15",
    time: "3h ago",
  },
  {
    id: 3,
    title: "Phishing Scams in 2025: Spot the Red Flags",
    description:
      "Phishing attacks are becoming more sophisticated. Discover how to recognize and avoid falling victim to scams.",
    author: "Linda Park",
    avatar: "https://i.pravatar.cc/40?img=18",
    time: "5h ago",
  },
  {
    id: 4,
    title: "Zero Trust Security: Why Companies Are Adopting It",
    description:
      "The Zero Trust model is gaining momentum as a more reliable way to protect networks in today’s threat landscape.",
    author: "James Carter",
    avatar: "https://i.pravatar.cc/40?img=20",
    time: "8h ago",
  },
  {
    id: 5,
    title: "Data Breaches: Lessons from Recent High-Profile Hacks",
    description:
      "Explore what went wrong in recent data breaches and the key lessons organizations must learn to prevent them.",
    author: "Maria Gonzalez",
    avatar: "https://i.pravatar.cc/40?img=22",
    time: "1d ago",
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