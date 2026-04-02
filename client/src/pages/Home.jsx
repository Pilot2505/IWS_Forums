import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";
import Navbar from "../components/Navbar";
import { authFetch } from "../services/api";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/register");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Fetch following + newPosts
    authFetch(`/api/follow/${parsedUser.id}`)
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
    authFetch(`/api/posts?page=${currentPage}&limit=5`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch posts");
        return res.json();
      })
      .then((data) => {
        setPosts(data.posts);
        setTotalPages(data.totalPages);
      })
      .catch((err) => {
        console.error("Error loading posts:", err);
      });
  }, [currentPage, navigate]);

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

  function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  return (
    <div className="min-h-screen bg-[#D6E4F0]">
      <Navbar user={user} showCreatePost={true} />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:px-10 lg:py-10">
        {/* Main Content */}
        <div className="flex-1">
          <Link to="/create-post" className="mb-6 inline-block rounded-lg bg-[#1E56A0] px-5 py-3 text-base font-medium text-white sm:px-6 sm:text-lg lg:mb-8 lg:px-8 lg:py-4 lg:text-xl">
            Create a New Post
          </Link>

          <h2 className="mb-6 text-3xl font-medium text-[#4F6F9F] sm:text-4xl lg:mb-8 lg:text-5xl">Recent Posts</h2>

          <div className="space-y-5 sm:space-y-6 lg:space-y-8">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-lg border-b-[0.5px] border-r-[0.5px] border-black bg-[#F6F6F6] p-4 sm:p-6 lg:p-8"
              >
                <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-2xl font-semibold text-black sm:text-3xl lg:text-4xl">{post.title}</h3>
                  <p className="text-base text-black sm:text-lg lg:text-2xl">
                      By{" "}
                      <Link
                        to={`/profile/${encodeURIComponent(post.username)}`}
                        className="text-[#1E56A0] font-medium hover:underline"
                      >
                        {post.username}
                      </Link>
                  </p>
                </div>
                <p className="mb-6 line-clamp-3 text-base leading-relaxed text-black sm:text-lg lg:mb-8 lg:text-2xl">
                  {stripHtml(post.content)}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-light text-black sm:text-base lg:text-xl">{new Date(post.created_at).toLocaleString()}</p>
                  <Link
                    to={`/post/${post.id}`}
                    className="text-base font-medium text-[#1E56A0] sm:text-lg lg:text-[22px]"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => {
                  window.scrollTo(0, 0);
                  setCurrentPage(index + 1);
                }}
                className={`px-4 py-2 rounded-md ${
                  currentPage === index + 1
                    ? "bg-[#1E56A0] text-white"
                    : "bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full rounded-lg bg-[#F6F6F6] p-4 sm:p-6 lg:sticky lg:top-6 lg:w-[320px] lg:max-h-[85vh] lg:flex-shrink-0 lg:overflow-y-auto lg:p-8 xl:w-[332px]">
          <h3 className="mb-6 bg-[#F6F6F6] pb-2 text-2xl font-medium capitalize text-[#0C245E]/70 sm:text-3xl lg:sticky lg:top-0 lg:z-10 lg:mb-8 lg:text-4xl">
            Following
          </h3>

          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            {following.map((person, index) => (
              <div key={person.id}>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => handleOpenProfile(person)}
                    className={`h-12 w-12 rounded-full p-[3px] transition-transform hover:scale-105 cursor-pointer sm:h-[52px] sm:w-[52px] lg:h-[60px] lg:w-[60px]
                      ${person.newPosts > 0 ? "bg-gradient-to-tr from-blue-500 to-cyan-400" : "border-[#D6E4F0]"}
                    `}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#21005D]/10 flex items-center justify-center">
                      {person.avatar ? (
                        <img
                          src={person.avatar}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-8 h-8" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p
                      onClick={() => handleOpenProfile(person)}
                      className="cursor-pointer text-lg text-black transition-colors hover:text-[#1E56A0] sm:text-xl lg:text-2xl">
                      {person.fullname || person.username}
                    </p>
                    {person.newPosts > 0 && (
                        <p className="text-sm text-[#0C245E]/70 sm:text-base">
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
