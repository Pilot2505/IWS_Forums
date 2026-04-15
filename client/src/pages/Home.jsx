import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";
import Navbar from "../components/Navbar";
import { authFetch } from "../services/api";
import PostVoteControls from "../components/PostVoteControls";

// Map category id -> label hiển thị
const CATEGORY_LABELS = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C / C++",
  web: "Web Development",
  mobile: "Mobile Development",
  database: "Database",
  devops: "DevOps",
  ai_ml: "AI / Machine Learning",
  security: "Cybersecurity",
  cloud: "Cloud Computing",
  opensource: "Open Source",
};

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRecommended, setIsRecommended] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);

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
      .then((data) => setFollowing(data))
      .catch((err) => console.error("Error loading following:", err));
  }, [navigate]);

  // Fetch posts mỗi khi user hoặc currentPage thay đổi
  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        // Lấy categories từ localStorage (đã được cập nhật sau khi chọn)
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const cats = storedUser.categories;
        const hasCategories = Array.isArray(cats) && cats.length > 0;

        let url = "";
        if (hasCategories) {
          const catParam = cats.join(",");
          url = `/api/posts/recommended?categories=${encodeURIComponent(catParam)}&page=${currentPage}&limit=5`;
        } else {
          url = `/api/posts?page=${currentPage}&limit=5`;
        }

        const res = await authFetch(url);
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();

        setPosts(data.posts);
        setTotalPages(data.totalPages);
        setIsRecommended(hasCategories);
      } catch (err) {
        console.error("Error loading posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [user, currentPage]);

  const handleOpenProfile = (person) => {
    setFollowing((prev) =>
      prev.map((p) =>
        p.id === Number(person.id) ? { ...p, newPosts: 0 } : p
      )
    );
    navigate(`/profile/${encodeURIComponent(person.username)}`);
  };

  function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  const handlePostVoteChange = ({ postId, voteCount, currentUserVote }) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              vote_count: voteCount,
              current_user_vote: currentUserVote,
            }
          : post
      )
    );
  };

  if (!user) return null;

  // Lấy label categories để hiển thị
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userCategories = Array.isArray(storedUser.categories) ? storedUser.categories : [];

  return (
    <div className="min-h-screen bg-[#D6E4F0]">
      <Navbar user={user} showCreatePost={true} />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:px-10 lg:py-10">
        {/* Main Content */}
        <div className="flex-1">
          <Link
            to="/create-post"
            className="mb-6 inline-block rounded-lg bg-[#1E56A0] px-5 py-3 text-base font-medium text-white sm:px-6 sm:text-lg lg:mb-8 lg:px-8 lg:py-4 lg:text-xl"
          >
            Create a New Post
          </Link>

          {/* Section title + category badges */}
          <div className="mb-4 lg:mb-6">
            <h2 className="text-3xl font-medium text-[#4F6F9F] sm:text-4xl lg:text-5xl">
              {isRecommended ? "Recommended Posts" : "Recent Posts"}
            </h2>

            {isRecommended && userCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-500">Based on:</span>
                {userCategories.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-[#1E56A0]/10 px-3 py-1 text-xs font-medium text-[#1E56A0] border border-[#1E56A0]/20"
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                ))}
                <Link
                  to="/select-categories"
                  className="ml-2 text-xs text-gray-400 hover:text-[#1E56A0] underline"
                >
                  Change
                </Link>
              </div>
            )}

            {!isRecommended && (
              <p className="mt-2 text-sm text-gray-500">
                <Link
                  to="/select-categories"
                  className="text-[#1E56A0] hover:underline font-medium"
                >
                  Select your interests
                </Link>{" "}
                to get personalized recommendations.
              </p>
            )}
          </div>

          {/* Posts list */}
          {loadingPosts ? (
            <div className="space-y-5 sm:space-y-6 lg:space-y-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg bg-[#F6F6F6] p-6 lg:p-8 animate-pulse"
                >
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg bg-[#F6F6F6] p-8 text-center text-gray-500">
              {isRecommended
                ? "No posts found for your selected categories yet. Try changing your interests or check back later."
                : "No posts yet. Be the first to create one!"}
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6 lg:space-y-8">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border-b-[0.5px] border-r-[0.5px] border-black bg-[#F6F6F6] p-4 sm:p-6 lg:p-8"
                >
                  <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-2xl font-semibold text-black sm:text-3xl lg:text-4xl">
                      {post.title}
                    </h3>
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
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <PostVoteControls
                      postId={post.id}
                      initialVoteCount={post.vote_count ?? 0}
                      initialCurrentUserVote={post.current_user_vote ?? 0}
                      onChange={handlePostVoteChange}
                    />
                    <Link
                      to={`/post/${post.id}`}
                      className="text-base font-medium text-[#1E56A0] sm:text-lg lg:text-[22px]"
                    >
                      Read More
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-light text-black sm:text-base lg:text-xl">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
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
          )}
        </div>

        {/* Sidebar — Following */}
        <div className="w-full rounded-lg bg-[#F6F6F6] p-4 sm:p-6 lg:sticky lg:top-6 lg:w-[320px] lg:max-h-[85vh] lg:flex-shrink-0 lg:overflow-y-auto lg:p-8 xl:w-[332px]">
          <h3 className="mb-6 bg-[#F6F6F6] pb-2 text-2xl font-medium capitalize text-[#0C245E]/70 sm:text-3xl lg:sticky lg:top-0 lg:z-10 lg:mb-8 lg:text-4xl">
            Following
          </h3>

          {following.length === 0 ? (
            <p className="text-sm text-gray-400">You are not following anyone yet.</p>
          ) : (
            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
              {following.map((person, index) => (
                <div key={person.id}>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => handleOpenProfile(person)}
                      className={`h-12 w-12 rounded-full p-[3px] transition-transform hover:scale-105 cursor-pointer sm:h-[52px] sm:w-[52px] lg:h-[60px] lg:w-[60px]
                        ${
                          person.newPosts > 0
                            ? "bg-gradient-to-tr from-blue-500 to-cyan-400"
                            : "border-[#D6E4F0]"
                        }
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
                        className="cursor-pointer text-lg text-black transition-colors hover:text-[#1E56A0] sm:text-xl lg:text-2xl"
                      >
                        {person.fullname || person.username}
                      </p>
                      {person.newPosts > 0 && (
                        <p className="text-sm text-[#0C245E]/70 sm:text-base">
                          {person.newPosts} new post
                          {person.newPosts > 1 ? "s" : ""}
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
          )}
        </div>
      </div>
    </div>
  );
}
