import { Link } from "react-router-dom";
import { stripHtml } from "../../utils/content";
import {
  formatTagLabel,
  getMatchingInterestTags,
  parseTagsValue,
} from "../../utils/postMeta";

function getStoredInterestCategories() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return Array.isArray(storedUser.categories) ? storedUser.categories : [];
  } catch {
    return [];
  }
}

export default function PostCard({
  post,
  authorNode,
  meta,
  readMoreTo,
  children,
  className = "",
}) {
  const tags = parseTagsValue(post.tags);
  const userCategories = getStoredInterestCategories();
  const matchingTags = getMatchingInterestTags(tags, userCategories);
  const matchingTagSet = new Set(matchingTags);
  const orderedTags = [
    ...matchingTags,
    ...tags.filter((tag) => !matchingTagSet.has(tag)),
  ];

  return (
    <article
      className={`rounded-[28px] border border-forum-border bg-forum-surface p-5 shadow-panel sm:p-6 ${className}`}
    >
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold leading-tight text-forum-inkStrong sm:text-[2rem]">
          <span dangerouslySetInnerHTML={{ __html: post.title }} />
        </h3>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {orderedTags.slice(0, 4).map((tag) => {
              const isMatched = matchingTagSet.has(tag);

              return (
                <span
                  key={tag}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isMatched
                      ? "bg-forum-primarySoft text-forum-primary"
                      : "bg-forum-panel text-forum-muted"
                  }`}
                >
                  #{formatTagLabel(tag)}
                </span>
              );
            })}
          </div>
        )}

        <p className="line-clamp-3 text-sm leading-7 text-forum-muted sm:text-base">
          {stripHtml(post.content)}
        </p>

        {children ? (
          <div className="border-t border-forum-border pt-4">{children}</div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-forum-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-forum-muted">
            {authorNode ? <span>{authorNode}</span> : null}
            {meta ? (
              <span className="text-xs text-forum-subtle sm:text-sm">
                {meta}
              </span>
            ) : null}
          </div>
          <Link
            to={readMoreTo}
            className="inline-flex items-center gap-2 text-sm font-semibold text-forum-primary transition hover:text-forum-primaryDark"
          >
            Read More
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
