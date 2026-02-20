import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";
import LogoutButton from "./LogoutButton";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/register");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Fetch following + newPosts
    fetch(`/api/follow/${parsedUser.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch following");
        return res.json();
      })
      .then((data) => {
        setFollowing(data);
      })
      .catch((err) => {
        console.error("Error loading following:", err);
      });

    // Fetch posts
    fetch("/api/posts")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch posts");
        return res.json();
      })
      .then((data) => {
        setPosts(data);
      })
      .catch((err) => {
        console.error("Error loading posts:", err);
      });

  }, [navigate]);

  const handleOpenProfile = (person) => {
    setFollowing(prev =>
      prev.map(p =>
        p.id === Number(person.id)
          ? { ...p, newPosts: 0 }
          : p
      )
    );

    navigate(`/profile/${encodeURIComponent(person.username)}`);
  };

  if (!user) return null;

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div className="min-h-screen bg-[#D6E4F0]">
      {/* Top Bar */}
      <header className="h-[75px] bg-[#F6F6F6] flex items-center justify-between px-12">
        <Link to="/" className="text-[#163172] text-4xl font-semibold font-['Poppins']">
          Technical Forum
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/create-post" className="text-[#1E56A0] text-2xl font-medium">
            Create Post
          </Link>
          <Link to={`/profile/${user.username}`} className="w-10 h-10 rounded-full bg-[#21005D]/10 border-4 border-[#D6E4F0] flex items-center justify-center hover:scale-105 transition-transform">
            <User className="w-5 h-5" />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="flex gap-8 px-12 pt-12">
        {/* Main Content */}
        <div className="flex-1">
          <Link to="/create-post" className="inline-block bg-[#1E56A0] text-white px-8 py-4 rounded-lg text-xl font-medium mb-8">
            Create a New Post
          </Link>

          <h2 className="text-[#4F6F9F] text-5xl font-medium mb-8">Recent Posts</h2>

          <div className="space-y-8">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#F6F6F6] rounded-lg border-r-[0.5px] border-b-[0.5px] border-black p-8"
              >
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-black text-4xl font-semibold">{post.title}</h3>
                  <p className="text-black text-2xl">
                      By{" "}
                      <Link
                        to={`/profile/${encodeURIComponent(post.username)}`}
                        className="text-[#1E56A0] font-medium hover:underline"
                      >
                        {post.username}
                      </Link>
                  </p>
                </div>
                <p className="text-black text-2xl leading-relaxed mb-8 line-clamp-3">
                  {truncateText(post.content, 120)}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-black text-xl font-light">{new Date(post.created_at).toLocaleString()}</p>
                  <Link
                    to={`/post/${post.id}`}
                    className="text-[#1E56A0] text-[22px] font-medium"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[332px] bg-[#F6F6F6] rounded-lg h-[650px] p-8">
          <h3 className="text-[#0C245E]/70 text-4xl font-medium capitalize mb-8">
            Following
          </h3>

          <div className="space-y-6">
            {following.map((person, index) => (
              <div key={person.id}>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => handleOpenProfile(person)}
                    className={`w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform
                      ${person.newPosts > 0 
                        ? "bg-[#21005D]/10 border-4 border-[#006EFF]" 
                        : "bg-[#21005D]/10 border-4 border-[#D6E4F0]"}
                    `}
                  >
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <p
                      onClick={() => handleOpenProfile(person)}
                      className="text-black text-2xl hover:text-[#1E56A0] transition-colors cursor-pointer">
                      {person.username}
                    </p>
                    {person.newPosts > 0 && (
                        <p className="text-[#0C245E]/70 text-base">
                          {person.newPosts} new post{person.newPosts > 1 ? "s" : ""}
                        </p>
                    )}
                  </div>
                </div>

                {index < following.length - 1 && (
                  <div className="h-px bg-black/50 mt-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
