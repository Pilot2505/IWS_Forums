import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp, Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { authFetch } from "@/services/api";
import useRequireAuth from "@/hooks/useRequireAuth";
import useVote from "@/hooks/useVote";
import { formatTagLabel, getMatchingInterestTags, parseTagsValue } from "@/utils/postMeta";
import { stripHtml } from "@/utils/content";

const DEFAULT_SORT_BY = "date";
const DEFAULT_SORT_DIR = "desc";
const RESULTS_PER_PAGE = 5;

function formatSearchDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SearchResultSkeleton() {
  return (
    <article className="flex animate-pulse flex-col gap-3 rounded-xl border border-[#c1c7d3] bg-white p-4 shadow-sm sm:p-6">
      <div className="h-6 w-3/4 rounded-full bg-[#e1e3e4]" />
      <div className="h-4 w-48 rounded-full bg-[#e1e3e4]" />
      <div className="flex flex-wrap gap-2 pt-1">
        <div className="h-5 w-16 rounded-full bg-[#e1e3e4]" />
        <div className="h-5 w-20 rounded-full bg-[#e1e3e4]" />
        <div className="h-5 w-24 rounded-full bg-[#e1e3e4]" />
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-4 w-full rounded-full bg-[#e1e3e4]" />
        <div className="h-4 w-5/6 rounded-full bg-[#e1e3e4]" />
      </div>
      <div className="h-4 w-28 rounded-full bg-[#e1e3e4]" />
    </article>
  );
}

function SearchVoteControls({
  postId,
  initialVoteCount = 0,
  initialCurrentUserVote = 0,
  onChange,
}) {
  const { voteCount, currentUserVote, loading, voteUp, voteDown } = useVote({
    postId,
    initialVoteCount,
    initialCurrentUserVote,
    onChange,
  });

  const upActive = currentUserVote === 1;
  const downActive = currentUserVote === -1;

  return (
    <div className="flex flex-col items-center gap-1 text-[#717783]">
      <button
        type="button"
        onClick={voteUp}
        disabled={loading}
        aria-pressed={upActive}
        aria-label="Upvote"
        className={`rounded-full p-1.5 transition-colors ${
          upActive ? "text-[#005da7]" : "hover:text-[#005da7]"
        } ${loading ? "opacity-60" : ""}`}
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      <span
        className={`min-w-8 text-center text-sm font-medium ${
          upActive
            ? "text-[#005da7]"
            : downActive
            ? "text-[#ba1a1a]"
            : "text-[#191c1d]"
        }`}
      >
        {voteCount}
      </span>

      <button
        type="button"
        onClick={voteDown}
        disabled={loading}
        aria-pressed={downActive}
        aria-label="Downvote"
        className={`rounded-full p-1.5 transition-colors ${
          downActive ? "text-[#ba1a1a]" : "hover:text-[#ba1a1a]"
        } ${loading ? "opacity-60" : ""}`}
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}

function SearchResultCard({ post, userCategories, onVoteChange }) {
  const tags = parseTagsValue(post.tags);
  const matchingTags = getMatchingInterestTags(tags, userCategories);
  const matchingTagSet = new Set(matchingTags);
  const orderedTags = [
    ...matchingTags,
    ...tags.filter((tag) => !matchingTagSet.has(tag)),
  ];
  const excerpt = stripHtml(post.content);

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-[#c1c7d3] bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6">
      <div className="flex gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1 pt-1 text-[#717783]">
          <SearchVoteControls
            postId={post.id}
            initialVoteCount={post.vote_count ?? 0}
            initialCurrentUserVote={post.current_user_vote ?? 0}
            onChange={onVoteChange}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-semibold leading-[28px] text-[#005da7] transition-colors hover:text-[#2976c7]">
            <Link to={`/post/${post.id}`} className="hover:underline">
              <span dangerouslySetInnerHTML={{ __html: post.title }} />
            </Link>
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-[#414751]">
            <span className="font-medium text-[#191c1d]">
              <Link
                to={`/profile/${encodeURIComponent(post.username)}`}
                className="hover:text-[#005da7] hover:underline"
              >
                {post.username}
              </Link>
            </span>
            <span aria-hidden="true">•</span>
            <span>{formatSearchDate(post.created_at)}</span>
          </div>

          {orderedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {orderedTags.slice(0, 4).map((tag) => {
                const isMatched = matchingTagSet.has(tag);

                return (
                  <span
                    key={tag}
                    className={[
                      "rounded px-2 py-0.5 text-[12px] font-medium",
                      isMatched
                        ? "bg-[#c1d9fe] text-[#485e7e]"
                        : "bg-[#f3f4f5] text-[#414751]",
                    ].join(" ")}
                  >
                    #{formatTagLabel(tag)}
                  </span>
                );
              })}
            </div>
          )}

          <p className="mt-3 line-clamp-2 text-[16px] leading-6 text-[#414751]">
            {excerpt}
          </p>

          <div className="mt-4">
            <Link
              to={`/post/${post.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#005da7] hover:underline"
            >
              Read More
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ query }) {
  return (
    <div className="rounded-xl border border-[#c1c7d3] bg-white p-8 text-center shadow-sm sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5ff] text-[#005da7]">
        <Search className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-[#191c1d]">
        No posts found for “{query}”
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#414751]">
        Try a different keyword or check the spelling in the search bar above.
      </p>
    </div>
  );
}

function PromptState() {
  return (
    <div className="rounded-xl border border-[#c1c7d3] bg-white p-8 text-center shadow-sm sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5ff] text-[#005da7]">
        <Search className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-[#191c1d]">
        Search for posts
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#414751]">
        Type a keyword in the search bar above to find relevant discussions.
      </p>
    </div>
  );
}

function SearchControls({
  sortBy,
  sortDir,
  onSortChange,
  totalResults,
  pageStart,
  pageEnd,
  sortLabel,
  showSortMenu,
  setShowSortMenu,
  sortMenuRef,
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-[#414751]">
        {totalResults > 0 ? (
          <>
              Showing {pageStart}-{pageEnd} of {totalResults}
          </>
        ) : (
          "No results"
        )}
      </div>

      <div ref={sortMenuRef} className="relative flex justify-end items-center">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={showSortMenu}
          onClick={() => setShowSortMenu((open) => !open)}
          className="relative inline-flex w-[250px] max-w-full select-none items-center gap-2 rounded-md border border-[#d1d5db] bg-white px-4 py-2.5 shadow-sm cursor-pointer hover:bg-[#f8f9fa] transition-colors sm:w-[260px]"
        >
          <span className="font-label-md text-label-md text-[#414751] whitespace-nowrap">
            Sort by:
          </span>
          <span className="font-label-md text-label-md text-[#191c1d] font-medium whitespace-nowrap">
            {sortLabel}
          </span>
          <span className="material-symbols-outlined ml-auto text-[#c1c7d3] text-[18px] leading-none shrink-0">
            expand_more
          </span>
        </button>

        {showSortMenu && (
          <div className="absolute right-0 top-full z-20 mt-2 w-[250px] overflow-hidden rounded-lg border border-[#d1d5db] bg-white shadow-lg sm:w-[260px]">
            {[
              ["date", "desc", "Newest first"],
              ["date", "asc", "Oldest first"],
              ["upvotes", "desc", "Most upvotes"],
              ["upvotes", "asc", "Most downvotes"],
            ].map(([nextSortBy, nextSortDir, label]) => {
              const isActive = sortBy === nextSortBy && sortDir === nextSortDir;

              return (
                <button
                  key={`${nextSortBy}:${nextSortDir}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onSortChange(nextSortBy, nextSortDir);
                    setShowSortMenu(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-[#f3f4f5] text-[#005da7]"
                      : "text-[#191c1d] hover:bg-[#f8f9fa]"
                  }`}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PaginationControls({ currentPage, totalPages, onPrevious, onNext }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#c1c7d3] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#414751]">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage <= 1}
          className="rounded-lg border border-[#c1c7d3] px-3 py-2 text-sm font-medium text-[#191c1d] transition-colors hover:bg-[#f3f4f5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-[#c1c7d3] px-3 py-2 text-sm font-medium text-[#191c1d] transition-colors hover:bg-[#f3f4f5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function SearchResult() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    requireToken: true,
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortDir, setSortDir] = useState(DEFAULT_SORT_DIR);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);
  const userCategories = Array.isArray(user?.categories) ? user.categories : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, sortBy, sortDir]);

  const handlePostVoteChange = ({ postId, voteCount, currentUserVote }) => {
    setResults((prev) =>
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

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchResults = async () => {
      setLoading(true);

      try {
        const res = await authFetch(
          `/api/posts/search?${new URLSearchParams({
            q: query,
            sortBy,
            sortDir,
          }).toString()}`
        );

        if (!res.ok) {
          throw new Error("Search failed");
        }

        const data = await res.json();

        if (isActive) {
          setResults(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);

        if (isActive) {
          setResults([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      isActive = false;
    };
  }, [query, sortBy, sortDir]);

  if (!ready || !user) return null;

  const hasQuery = query.length > 0;
  const totalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = results.length === 0 ? 0 : (safeCurrentPage - 1) * RESULTS_PER_PAGE + 1;
  const pageEnd = Math.min(safeCurrentPage * RESULTS_PER_PAGE, results.length);
  const visibleResults = results.slice(
    (safeCurrentPage - 1) * RESULTS_PER_PAGE,
    safeCurrentPage * RESULTS_PER_PAGE
  );
  const resultCountLabel = `Found ${results.length} result${results.length === 1 ? "" : "s"}`;
  const sortValue = `${sortBy}:${sortDir}`;
  const sortLabelMap = {
    "date:desc": "Newest first",
    "date:asc": "Oldest first",
    "upvotes:desc": "Most upvotes",
    "upvotes:asc": "Most downvotes",
  };
  const sortLabel = sortLabelMap[sortValue] ?? "Newest first";

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] antialiased">
      <Navbar user={user} setUser={setUser} showCreatePost={true} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#191c1d] md:text-[32px] md:leading-[40px]">
            {hasQuery ? (
              <>
                Search results for: <span className="text-[#005da7]">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              "Search results"
            )}
          </h1>
          <p className="text-[14px] text-[#414751]">
            {hasQuery ? (loading ? "Searching..." : resultCountLabel) : "Type a keyword in the search bar above to find relevant discussions."}
          </p>
        </div>

        {hasQuery && (
          <SearchControls
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={(nextSortBy, nextSortDir) => {
              setSortBy(nextSortBy);
              setSortDir(nextSortDir);
              setCurrentPage(1);
            }}
            totalResults={results.length}
            pageStart={pageStart}
            pageEnd={pageEnd}
            sortLabel={sortLabel}
            showSortMenu={showSortMenu}
            setShowSortMenu={setShowSortMenu}
            sortMenuRef={sortMenuRef}
          />
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <SearchResultSkeleton key={index} />
            ))}
          </div>
        ) : hasQuery ? (
          results.length > 0 ? (
            <div className="flex flex-col gap-4">
              {visibleResults.map((post) => (
                <SearchResultCard
                  key={post.id}
                  post={post}
                  userCategories={userCategories}
                  onVoteChange={handlePostVoteChange}
                />
              ))}
            </div>
          ) : (
            <EmptyState query={query} />
          )
        ) : (
          <PromptState />
        )}

        {hasQuery && !loading && results.length > 0 && (
          <PaginationControls
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          />
        )}
      </main>
    </div>
  );
}
