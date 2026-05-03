import { Link } from "react-router-dom";
import { stripHtml } from "../../utils/content";
import { formatTagLabel, getMatchingInterestTags, parseTagsValue } from "../../utils/postMeta";

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
        <article className={`rounded-lg border border-[#c1d9fe] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6 ${className}`}>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="text-xl font-semibold text-[#001c39] sm:text-2xl">
                    <span dangerouslySetInnerHTML={{ __html: post.title }} />
                </h3>
                {authorNode ? <div className="text-sm text-[#485e7e]">{authorNode}</div> : null}
            </div>

            {tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {orderedTags.slice(0, 4).map((tag) => {
                        const isMatched = matchingTagSet.has(tag);

                        return (
                            <span
                                key={tag}
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                isMatched
                                        ? "border border-[#005da7]/20 bg-[#005da7]/10 text-[#005da7]"
                                        : "bg-[#eef4ff] text-[#485e7e]"
                                }`}
                            >
                                #{formatTagLabel(tag)}
                            </span>
                        );
                    })}
                </div>
            )}

            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#485e7e] sm:text-base">
                {stripHtml(post.content)}
            </p>

            {children}

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e1e8f6] pt-3">
                <span className="text-xs text-[#717783]">{meta}</span>
                <Link to={readMoreTo} className="font-medium text-[#005da7] transition-colors hover:text-[#004883] hover:underline">
                    Read More
                </Link>
            </div>
        </article>
    );
}
