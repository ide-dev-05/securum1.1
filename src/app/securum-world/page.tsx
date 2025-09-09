import TweetCard from "../component/tweetcard";
import Articles from "../component/articles";
import Post from "../component/post";
export const mockPosts = [
 {
  id: 1,
  name: "John Doe",
  username: "@johndoe",
  avatar: "https://i.pravatar.cc/40?img=1",
  verified: true,
  time: "2h",
  text: "This is a sample tweet for testing!",
  ups: 12,
  retweets: 3,
  comments: [
    { id: 1, name: "Alice", username: "@alice", avatar: "https://i.pravatar.cc/40?img=2", text: "Nice tweet!" },
    { id: 2, name: "Bob", username: "@bob", avatar: "https://i.pravatar.cc/40?img=3", text: "I totally agree!" },
    { id: 3, name: "Charlie", username: "@charlie", avatar: "https://i.pravatar.cc/40?img=4", text: "Interesting point of view." },
    { id: 4, name: "Diana", username: "@diana", avatar: "https://i.pravatar.cc/40?img=5", text: "Well said!" },
    { id: 5, name: "Ethan", username: "@ethan", avatar: "https://i.pravatar.cc/40?img=6", text: "Could you explain more?" },
    { id: 6, name: "Fiona", username: "@fiona", avatar: "https://i.pravatar.cc/40?img=7", text: "Love this perspective!" },
    { id: 7, name: "George", username: "@george", avatar: "https://i.pravatar.cc/40?img=8", text: "Absolutely agree!" },
    { id: 8, name: "Hannah", username: "@hannah", avatar: "https://i.pravatar.cc/40?img=9", text: "Thanks for sharing." },
    { id: 9, name: "Ian", username: "@ian", avatar: "https://i.pravatar.cc/40?img=10", text: "This is helpful." },
    { id: 10, name: "Julia", username: "@julia", avatar: "https://i.pravatar.cc/40?img=11", text: "Good point!" },
  ]
},
  {
    id: 2,
    name: "Jane Doe",
    username: "@janedoe",
    verified: false,
    time: "1h",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    text: "Learning Next.js and Tailwind CSS has completely changed how I build apps. 🚀",
    ups: 320,
    comments: [],
    retweets: 8,
  },
  {
    id: 3,
    name: "Alex Kim",
    username: "@alexkim",
    verified: true,
    time: "3h",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "AI is not replacing developers — it's making us 10x faster ⚡️",
    ups: 1020,
    comments: [],
    retweets: 210,
  },
  {
    id: 4,
    name: "Tech Daily",
    username: "@techdaily",
    verified: true,
    time: "6h",
    avatar: "https://randomuser.me/api/portraits/men/70.jpg",
    text: "Breaking: Apple is rumored to announce the new iPhone Ultra next week with a titanium frame. 📱✨",
    ups: 14500,
    comments: [],
    retweets: 1100,
  },
  {
    id: 5,
    name: "Sarah Lee",
    username: "@sarahlee",
    verified: false,
    time: "1d",
    avatar: "https://randomuser.me/api/portraits/women/24.jpg",
    text: "Finally deployed my portfolio website! 💻 Would love feedback 👉 sarahlee.dev",
    ups: 210,
    comments: [],
    retweets: 14,
  },
  {
    id: 6,
    name: "Crypto Buzz",
    username: "@cryptobuzz",
    verified: true,
    time: "2d",
    avatar: "https://randomuser.me/api/portraits/men/15.jpg",
    text: "Bitcoin just crossed $75,000! 🚀📈 #BTC",
    ups: 54000,
    comments: [],
    retweets: 8900,
  },
];


export default function SecurumWorld() {
  return (
    <section className="min-h-screen grid grid-cols-4 gap-2 p-4">
   <div className="col-span-1 ">
        <Articles />
      </div>
        <div className="col-span-2 flex flex-col items-center gap-4">
         {mockPosts.map((post) => (
            <TweetCard key={post.id} post={post} />
         ))}
        </div>
    <div className="col-span-1">
        <Post />
    </div>
</section>

  );
}
