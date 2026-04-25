import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import Navbar from "../components/Navbar";
import { authFetch } from "../services/api";
import PostVoteControls from "../components/PostVoteControls";

const POSTS_LIMIT = 5;

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
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isRecommended, setIsRecommended] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/register");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    authFetch(`/api/follow/${parsedUser.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch following");
        return res.json();
      })
      .then((data) => setFollowing(data))
      .catch((err) => console.error("Error loading following:", err));
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchInitialPosts = async () => {
      setLoadingPosts(true);

      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const categories = Array.isArray(storedUser.categories) ? storedUser.categories : [];
        const params = new URLSearchParams({
          limit: String(POSTS_LIMIT),
          sortBy: "date",
          sortDir,
        });
        const url =
          Array.isArray(categories) && categories.length > 0
            ? `/api/posts/recommended?categories=${encodeURIComponent(categories.join(","))}&${params.toString()}`
            : `/api/posts?${params.toString()}`;
        const res = await authFetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data = await res.json();
        setPosts(data.posts ?? []);
        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
        setIsRecommended(categories.length > 0);
      } catch (err) {
        console.error("Error loading posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    setPosts([]);
    setCursor(null);
    setHasMore(true);
    fetchInitialPosts();
  }, [user, sortDir]);

  const handleOpenProfile = (person) => {
    setFollowing((prev) =>
      prev.map((p) => (p.id === Number(person.id) ? { ...p, newPosts: 0 } : p))
    );
    navigate(`/profile/${encodeURIComponent(person.username)}`);
  };

  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

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

  const handleLoadMore = async () => {
    if (!cursor || !hasMore || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const categories = Array.isArray(storedUser.categories) ? storedUser.categories : [];
      const params = new URLSearchParams({
        limit: String(POSTS_LIMIT),
        sortBy: "date",
        sortDir,
        cursor,
      });
      const url =
        Array.isArray(categories) && categories.length > 0
          ? `/api/posts/recommended?categories=${encodeURIComponent(categories.join(","))}&${params.toString()}`
          : `/api/posts?${params.toString()}`;
      const res = await authFetch(url);

      if (!res.ok) {
        throw new Error("Failed to fetch more posts");
      }

      const data = await res.json();

      setPosts((prev) => {
        const existingIds = new Set(prev.map((post) => post.id));
        const incoming = (data.posts ?? []).filter((post) => !existingIds.has(post.id));
        return [...prev, ...incoming];
      });
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error("Error loading more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!user) return null;

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userCategories = Array.isArray(storedUser.categories) ? storedUser.categories : [];

  return (
    <div className="min-h-screen bg-[#D6E4F0]">
      <Navbar user={user} showCreatePost={true} />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:px-10 lg:py-10">
        <div className="flex-1">
          <Link
            to="/create-post"
            className="mb-6 inline-block rounded-lg bg-[#1E56A0] px-5 py-3 text-base font-medium text-white sm:px-6 sm:text-lg lg:mb-8 lg:px-8 lg:py-4 lg:text-xl"
          >
            Create a New Post
          </Link>

          <div className="mb-4 lg:mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="text-3xl font-medium text-[#4F6F9F] sm:text-4xl lg:text-5xl">
                {isRecommended ? "Recommended Posts" : "Recent Posts"}
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Date order</span>
                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </div>
            </div>

            {isRecommended && userCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">Based on:</span>
                {userCategories.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full border border-[#1E56A0]/20 bg-[#1E56A0]/10 px-3 py-1 text-xs font-medium text-[#1E56A0]"
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                ))}
                <Link
                  to="/select-categories"
                  className="ml-2 text-xs text-gray-400 underline hover:text-[#1E56A0]"
                >
                  Change
                </Link>
              </div>
            )}

            {!isRecommended && (
              <p className="mt-2 text-sm text-gray-500">
                <Link
                  to="/select-categories"
                  className="font-medium text-[#1E56A0] hover:underline"
                >
                  Select your interests
                </Link>{" "}
                to get personalized recommendations.
              </p>
            )}
          </div>

          {loadingPosts ? (
            <div className="space-y-5 sm:space-y-6 lg:space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg bg-[#F6F6F6] p-6 lg:p-8">
                  <div className="mb-3 h-6 w-3/4 rounded bg-gray-200" />
                  <div className="mb-2 h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-5/6 rounded bg-gray-200" />
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
                        className="font-medium text-[#1E56A0] hover:underline"
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

          {posts.length > 0 && hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-md bg-[#1E56A0] px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>

        <div className="w-full rounded-lg bg-[#F6F6F6] p-4 sm:p-6 lg:sticky lg:top-6 lg:max-h-[85vh] lg:w-[320px] lg:flex-shrink-0 lg:overflow-y-auto lg:p-8 xl:w-[332px]">
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
                      className={`h-12 w-12 cursor-pointer rounded-full p-[3px] transition-transform hover:scale-105 sm:h-[52px] sm:w-[52px] lg:h-[60px] lg:w-[60px] ${
                        person.newPosts > 0
                          ? "bg-gradient-to-tr from-blue-500 to-cyan-400"
                          : "border-[#D6E4F0]"
                      }`}
                    >
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#21005D]/10">
                        {person.avatar ? (
                          <img src={person.avatar} className="h-full w-full rounded-full object-cover" />
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

                  {index < following.length - 1 && <div className="mt-6 h-px bg-black/50" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
